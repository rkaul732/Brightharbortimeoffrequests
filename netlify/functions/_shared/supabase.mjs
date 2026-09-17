import { clean, httpError, isAllowedProgram, isValidEmail, programLabel } from "./http.mjs";

const brightHarborDomain = "@brightharbor.org";
const defaultSuperAdminEmail = "hr@brightharbor.org";
const accountTypes = new Set(["employee", "admin"]);

function firstEnv(names) {
  return names.map((name) => process.env[name]).find(Boolean);
}

function requiredAny(names, label) {
  const value = firstEnv(names);
  if (!value) {
    throw httpError(500, `${label} is not configured.`);
  }
  return value;
}

export function hasSupabaseConfig() {
  return Boolean(
    process.env.SUPABASE_URL &&
      firstEnv(["SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY"]) &&
      firstEnv(["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"])
  );
}

export function supabaseProjectRef() {
  const supabaseUrl = supabaseBaseUrl(clean(process.env.SUPABASE_URL));
  if (!supabaseUrl) return "";
  try {
    return new URL(supabaseUrl).hostname.split(".")[0] || "";
  } catch (error) {
    return "";
  }
}

export async function supabaseRest(path, options = {}) {
  const supabaseUrl = supabaseBaseUrl(requiredAny(["SUPABASE_URL"], "SUPABASE_URL"));
  const serviceRoleKey = requiredAny(["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"], "SUPABASE_SECRET_KEY");
  const url = `${supabaseUrl}/rest/v1/${path}`;
  const headers = {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json"
  };

  if (options.prefer) {
    headers.prefer = options.prefer;
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw httpError(response.status, data?.message || data?.error || "Supabase request failed.");
  }

  return data;
}

export async function passwordGrant(email, password, invalidMessage = "Invalid admin credentials.") {
  const supabaseUrl = supabaseBaseUrl(requiredAny(["SUPABASE_URL"], "SUPABASE_URL"));
  const publishableKey = requiredAny(["SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY"], "SUPABASE_PUBLISHABLE_KEY");
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.msg || data?.error_description || data?.error || invalidMessage;
    if (/invalid.*credentials/i.test(message) || /invalid.*login/i.test(message)) {
      throw httpError(401, invalidMessage);
    }
    throw httpError(401, message);
  }
  return data;
}

export async function createAuthUser(email, password, metadata = {}) {
  const supabaseUrl = supabaseBaseUrl(requiredAny(["SUPABASE_URL"], "SUPABASE_URL"));
  const serviceRoleKey = requiredAny(["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"], "SUPABASE_SECRET_KEY");
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.msg || data?.message || data?.error_description || data?.error || "Could not create employee account.";
    if (response.status === 422 || /already/i.test(message)) {
      throw httpError(409, "An account already exists for this email. Sign in instead.");
    }
    throw httpError(response.status, message);
  }

  return data;
}

export function supabaseBaseUrl(value) {
  const cleaned = clean(value);
  try {
    const url = new URL(cleaned);
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch (error) {
    return cleaned.replace(/\/(?:auth|rest|storage)\/v1.*$/i, "").replace(/\/$/, "");
  }
}

export async function verifyEmployee(event) {
  const user = await verifySupabaseUser(event, "Employee session is required.", "Employee session has expired.");
  if (!isBrightHarborEmail(user.email)) {
    throw httpError(403, "You must use your Bright Harbor Email.");
  }
  return user;
}

export async function verifyAdmin(event) {
  const user = await verifySupabaseUser(event, "Admin session is required.", "Admin session has expired.");
  return adminAccessForUser(user);
}

export async function verifySuperAdmin(event) {
  const admin = await verifyAdmin(event);
  if (!admin.is_super_admin) {
    throw httpError(403, "Only the super admin can change account types.");
  }
  return admin;
}

export async function adminAccessForUser(user) {
  const email = clean(user.email).toLowerCase();
  const profile = await readEmployeeProfile({ id: user.id, email });
  const superAdmin = isSuperAdminEmail(email);
  const envAdmin = isAdminEmail(email);
  const profileAdmin = normalizeAccountType(profile?.account_type) === "admin";

  if (!superAdmin && !envAdmin && !profileAdmin) {
    throw httpError(403, "This account is not an admin.");
  }

  return {
    ...user,
    email,
    profile,
    account_type: superAdmin ? "super_admin" : "admin",
    role: superAdmin ? "super_admin" : "admin",
    is_super_admin: superAdmin
  };
}

export function isAdminEmail(email) {
  const allowed = String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(String(email || "").toLowerCase());
}

export function isSuperAdminEmail(email) {
  const normalized = clean(email).toLowerCase();
  return superAdminEmails().includes(normalized);
}

export function superAdminEmails() {
  const configured = firstEnv(["SUPER_ADMIN_EMAILS", "SUPER_ADMIN_EMAIL"]) || defaultSuperAdminEmail;
  return String(configured)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function hasAdminAccessConfig() {
  return Boolean(process.env.ADMIN_EMAILS || superAdminEmails().length);
}

export function normalizeAccountType(value) {
  const type = clean(value).toLowerCase();
  return accountTypes.has(type) ? type : "employee";
}

export function isBrightHarborEmail(email) {
  const normalized = clean(email).toLowerCase();
  return isValidEmail(normalized) && normalized.endsWith(brightHarborDomain);
}

export function assertBrightHarborEmail(email) {
  if (!isBrightHarborEmail(email)) {
    throw httpError(400, "You must use your Bright Harbor Email.");
  }
}

export function normalizeEmployeeProfile(user, profile = {}) {
  const normalized = {
    id: user.id,
    email: clean(user.email || profile.email).toLowerCase(),
    first_name: clean(profile.first_name || profile.firstName),
    last_name: clean(profile.last_name || profile.lastName),
    pronouns: clean(profile.pronouns),
    program: programLabel(profile.program),
    manager: clean(profile.manager)
  };
  if (Object.prototype.hasOwnProperty.call(profile, "account_type") || Object.prototype.hasOwnProperty.call(profile, "accountType")) {
    normalized.account_type = normalizeAccountType(profile.account_type || profile.accountType);
  }
  return normalized;
}

export async function readEmployeeProfile(user) {
  if (!clean(user?.id)) return null;
  const rows = await supabaseRest(`employee_profiles?id=eq.${encodeURIComponent(user.id)}&select=*&limit=1`);
  return rows[0] || null;
}

export async function upsertEmployeeProfile(user, profile) {
  const normalized = normalizeEmployeeProfile(user, profile);
  assertBrightHarborEmail(normalized.email);
  if (normalized.program && !isAllowedProgram(normalized.program)) {
    throw httpError(400, "Choose a valid program.");
  }

  const rows = await supabaseRest("employee_profiles?on_conflict=id&select=*", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=representation",
    body: normalized
  });

  return rows[0];
}

async function verifySupabaseUser(event, missingMessage, expiredMessage) {
  const authHeader = event.headers.authorization || event.headers.Authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    throw httpError(401, missingMessage);
  }

  const supabaseUrl = supabaseBaseUrl(requiredAny(["SUPABASE_URL"], "SUPABASE_URL"));
  const publishableKey = requiredAny(["SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY"], "SUPABASE_PUBLISHABLE_KEY");
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: publishableKey,
      authorization: `Bearer ${token}`
    }
  });

  const user = await response.json().catch(() => ({}));
  if (!response.ok || !user.email) {
    throw httpError(401, expiredMessage);
  }

  return { ...user, email: user.email.toLowerCase() };
}
