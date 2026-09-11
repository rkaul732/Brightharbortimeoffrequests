import { assertMethod, clean, handleError, httpError, isValidEmail, json, preflight, readJson } from "./_shared/http.mjs";
import { adminAccessForUser, passwordGrant, supabaseRest } from "./_shared/supabase.mjs";

export async function handler(event) {
  const options = preflight(event);
  if (options) return options;

  try {
    assertMethod(event, "POST");
    const body = await readJson(event);
    const email = clean(body.email).toLowerCase();
    const password = String(body.password || "");

    if (!isValidEmail(email) || !password) {
      throw httpError(400, "Enter an admin email and password.");
    }

    const session = await passwordGrant(email, password);
    const access = await adminAccessForUser(session.user || {});
    const userEmail = access.email;

    const previousSignIns = await supabaseRest(`admin_sign_ins?admin_email=eq.${encodeURIComponent(userEmail)}&select=sign_in_at&order=sign_in_at.desc&limit=1`);
    const currentSignInAt = new Date().toISOString();
    const signInRows = await supabaseRest("admin_sign_ins?select=*", {
      method: "POST",
      prefer: "return=representation",
      body: {
        admin_email: userEmail,
        sign_in_at: currentSignInAt
      }
    });

    return json(200, {
      email: userEmail,
      name: displayName(session.user, access.profile),
      accessToken: session.access_token,
      expiresIn: session.expires_in,
      accountType: access.account_type,
      role: access.role,
      isSuperAdmin: access.is_super_admin,
      previousSignInAt: previousSignIns[0]?.sign_in_at || null,
      currentSignInAt: signInRows[0]?.sign_in_at || currentSignInAt
    });
  } catch (error) {
    return handleError(error);
  }
}

function displayName(user, profile = {}) {
  const profileName = `${clean(profile?.first_name)} ${clean(profile?.last_name)}`.trim();
  if (profileName) return profileName;

  const metadataName = clean(user?.user_metadata?.full_name || user?.user_metadata?.name);
  if (metadataName) return metadataName;

  const prefix = clean(user?.email).split("@")[0] || "Admin";
  return prefix
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
