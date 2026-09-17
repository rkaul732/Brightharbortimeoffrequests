import { assertMethod, clean, httpError, json, preflight, readJson } from "./_shared/http.mjs";
import { assertBrightHarborEmail, supabaseRest } from "./_shared/supabase.mjs";

const defaultAdminEmails = ["hr@brightharbor.org", "mcorrigan@brightharbor.org"];

export async function handler(event) {
  const options = preflight(event);
  if (options) return options;

  try {
    assertMethod(event, "POST");
    const body = await readJson(event);
    requireSetupToken(body.setupToken);

    const password = clean(process.env.ADMIN_SETUP_PASSWORD);
    if (password.length < 8) {
      throw httpError(500, "ADMIN_SETUP_PASSWORD must be set in Netlify and must be at least 8 characters.");
    }

    const emails = setupEmails();
    if (!emails.length) {
      throw httpError(500, "No admin setup emails are configured.");
    }

    const existingUsers = await listAuthUsers();
    const results = [];
    for (const email of emails) {
      const existing = existingUsers.find((user) => clean(user.email).toLowerCase() === email);
      const user = existing ? await updateAuthUser(existing.id, email, password) : await createAuthUser(email, password);
      await upsertAdminProfile(user, email);
      results.push({
        email,
        action: existing ? "password reset" : "created",
        userId: user.id || existing?.id || "",
        accountType: email === "hr@brightharbor.org" ? "super_admin" : "admin"
      });
    }

    return json(200, {
      ok: true,
      message: "Admin users were created or reset in this Supabase project. Remove ADMIN_SETUP_TOKEN and ADMIN_SETUP_PASSWORD from Netlify after confirming login works.",
      admins: results
    });
  } catch (error) {
    return handleSetupError(error);
  }
}

function handleSetupError(error) {
  const statusCode = error.statusCode || 500;
  if (statusCode === 500) console.error(error);
  return json(statusCode, {
    error: error.message || "Admin setup failed.",
    nextStep: "Check Netlify environment variables ADMIN_SETUP_TOKEN, ADMIN_SETUP_PASSWORD, ADMIN_SETUP_EMAILS, SUPABASE_URL, and SUPABASE_SECRET_KEY, then trigger a new deploy."
  });
}

function requireSetupToken(inputToken) {
  const configuredToken = clean(process.env.ADMIN_SETUP_TOKEN);
  if (!configuredToken) {
    throw httpError(500, "ADMIN_SETUP_TOKEN is not configured in Netlify.");
  }
  if (clean(inputToken) !== configuredToken) {
    throw httpError(403, "Setup token is incorrect.");
  }
}

function setupEmails() {
  const configured = clean(process.env.ADMIN_SETUP_EMAILS);
  const emails = (configured ? configured.split(",") : defaultAdminEmails)
    .map((email) => clean(email).toLowerCase())
    .filter(Boolean);
  emails.forEach(assertBrightHarborEmail);
  return Array.from(new Set(emails));
}

async function listAuthUsers() {
  const data = await supabaseAuthAdmin("users?per_page=1000");
  return Array.isArray(data?.users) ? data.users : [];
}

async function createAuthUser(email, password) {
  const data = await supabaseAuthAdmin("users", {
    method: "POST",
    body: {
      email,
      password,
      email_confirm: true,
      user_metadata: metadataFor(email)
    }
  });
  return data.user || data;
}

async function updateAuthUser(id, email, password) {
  if (!id) throw httpError(500, `Could not find the Supabase user id for ${email}.`);
  const body = {
    email,
    password,
    email_confirm: true,
    user_metadata: metadataFor(email)
  };

  try {
    const data = await supabaseAuthAdmin(`users/${encodeURIComponent(id)}`, {
      method: "PUT",
      body
    });
    return data.user || data;
  } catch (error) {
    if (!isInvalidSupabasePath(error)) throw error;
  }

  const data = await supabaseAuthAdmin(`user/${encodeURIComponent(id)}`, {
    method: "PUT",
    body
  });
  return data.user || data;
}

async function upsertAdminProfile(user, email) {
  const userId = clean(user?.id);
  if (!userId) throw httpError(500, `Supabase did not return a user id for ${email}.`);
  const name = profileName(email);

  await supabaseRest("employee_profiles?on_conflict=id&select=id,email,account_type", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=representation",
    body: {
      id: userId,
      email,
      first_name: name.first,
      last_name: name.last,
      pronouns: "",
      program: "",
      manager: "",
      account_type: "admin"
    }
  });
}

async function supabaseAuthAdmin(path, options = {}) {
  const supabaseUrl = supabaseBaseUrl(requiredEnv("SUPABASE_URL"));
  const serviceRoleKey = requiredAnyEnv(["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"], "SUPABASE_SECRET_KEY");
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json"
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.msg || data?.message || data?.error_description || data?.error || "Supabase admin request failed.";
    throw httpError(response.status, `${message} (${safeRoute(path)})`);
  }
  return data;
}

function isInvalidSupabasePath(error) {
  return /invalid path specified/i.test(error?.message || "");
}

function supabaseBaseUrl(value) {
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

function safeRoute(path) {
  const route = String(path || "")
    .replace(/\?.*$/, "")
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i, ":user_id");
  return `/auth/v1/admin/${route}`;
}

function metadataFor(email) {
  const name = profileName(email);
  return {
    first_name: name.first,
    last_name: name.last,
    full_name: `${name.first} ${name.last}`.trim(),
    account_type: "admin"
  };
}

function profileName(email) {
  const names = {
    "hr@brightharbor.org": { first: "HR", last: "Admin" },
    "mcorrigan@brightharbor.org": { first: "Meghan", last: "Corrigan" }
  };
  if (names[email]) return names[email];

  const prefix = email.split("@")[0] || "Admin";
  const parts = prefix.split(/[._-]+/).filter(Boolean);
  return {
    first: titleCase(parts[0] || "Admin"),
    last: titleCase(parts.slice(1).join(" ") || "User")
  };
}

function titleCase(value) {
  const text = clean(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : "";
}

function requiredEnv(name) {
  const value = clean(process.env[name]);
  if (!value) throw httpError(500, `${name} is not configured.`);
  return value;
}

function requiredAnyEnv(names, label) {
  const value = names.map((name) => clean(process.env[name])).find(Boolean);
  if (!value) throw httpError(500, `${label} is not configured.`);
  return value;
}
