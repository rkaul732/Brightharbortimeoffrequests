import { clean, httpError, isAllowedProgram, isValidEmail, programLabel } from "./http.mjs";

const brightHarborDomain = "@brightharbor.org";

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

export async function supabaseRest(path, options = {}) {
  const supabaseUrl = requiredAny(["SUPABASE_URL"], "SUPABASE_URL").replace(/\/$/, "");
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
  const supabaseUrl = requiredAny(["SUPABASE_URL"], "SUPABASE_URL").replace(/\/$/, "");
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
    throw httpError(401, data?.msg || data?.error_description || invalidMessage);
  }
  return data;
}

export async function createAuthUser(email, password, metadata = {}) {
  const supabaseUrl = requiredAny(["SUPABASE_URL"], "SUPABASE_URL").replace(/\/$/, "");
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

export async function verifyEmployee(event) {
  const user = await verifySupabaseUser(event, "Employee session is required.", "Employee session has expired.");
  if (!isBrightHarborEmail(user.email)) {
    throw httpError(403, "You must use your Bright Harbor Email.");
  }
  return user;
}

export async function verifyAdmin(event) {
  const user = await verifySupabaseUser(event, "Admin session is required.", "Admin session has expired.");
  const email = user.email;
  if (!isAdminEmail(email)) {
    throw httpError(403, "This account is not an admin.");
  }

  return user;
}

export function isAdminEmail(email) {
  const allowed = String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(String(email || "").toLowerCase());
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
  return {
    id: user.id,
    email: clean(user.email || profile.email).toLowerCase(),
    first_name: clean(profile.first_name || profile.firstName),
    last_name: clean(profile.last_name || profile.lastName),
    pronouns: clean(profile.pronouns),
    program: programLabel(profile.program),
    manager: clean(profile.manager)
  };
}

export async function readEmployeeProfile(user) {
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

  const supabaseUrl = requiredAny(["SUPABASE_URL"], "SUPABASE_URL").replace(/\/$/, "");
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
