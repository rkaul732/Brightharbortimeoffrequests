import { assertMethod, clean, handleError, httpError, isValidEmail, json, preflight, readJson } from "./_shared/http.mjs";
import { isAdminEmail, passwordGrant } from "./_shared/supabase.mjs";

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
    const userEmail = session.user?.email?.toLowerCase();
    if (!isAdminEmail(userEmail)) {
      throw httpError(403, "This account is not an admin.");
    }

    return json(200, {
      email: userEmail,
      accessToken: session.access_token,
      expiresIn: session.expires_in
    });
  } catch (error) {
    return handleError(error);
  }
}
