import { httpError } from "./http.mjs";

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

export async function passwordGrant(email, password) {
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
    throw httpError(401, data?.msg || data?.error_description || "Invalid admin credentials.");
  }
  return data;
}

export async function verifyAdmin(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    throw httpError(401, "Admin session is required.");
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
    throw httpError(401, "Admin session has expired.");
  }

  const email = user.email.toLowerCase();
  if (!isAdminEmail(email)) {
    throw httpError(403, "This account is not an admin.");
  }

  return { email, id: user.id };
}

export function isAdminEmail(email) {
  const allowed = String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(String(email || "").toLowerCase());
}
