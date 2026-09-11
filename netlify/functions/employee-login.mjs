import { assertMethod, clean, handleError, httpError, json, preflight, readJson } from "./_shared/http.mjs";
import {
  assertBrightHarborEmail,
  normalizeEmployeeProfile,
  passwordGrant,
  readEmployeeProfile,
  upsertEmployeeProfile
} from "./_shared/supabase.mjs";

export async function handler(event) {
  const options = preflight(event);
  if (options) return options;

  try {
    assertMethod(event, "POST");
    const body = await readJson(event);
    const email = clean(body.email).toLowerCase();
    const password = String(body.password || "");

    assertBrightHarborEmail(email);

    const session = await passwordGrant(email, password, "Invalid employee email or password.");
    const user = {
      id: session.user?.id,
      email: session.user?.email?.toLowerCase() || email
    };

    if (!user.id) {
      throw httpError(401, "Employee session has expired.");
    }
    assertBrightHarborEmail(user.email);

    const existingProfile = await readEmployeeProfile(user);
    const profile = existingProfile || (await upsertEmployeeProfile(user, fallbackProfile(session.user)));

    return json(200, {
      email: user.email,
      id: user.id,
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
      profile: normalizeEmployeeProfile(user, profile)
    });
  } catch (error) {
    return handleError(error);
  }
}

function fallbackProfile(user) {
  const metadata = user?.user_metadata || {};
  const fullName = clean(metadata.full_name || metadata.name);
  const [firstName = "", ...rest] = fullName.split(/\s+/).filter(Boolean);
  return {
    first_name: clean(metadata.first_name || firstName),
    last_name: clean(metadata.last_name || rest.join(" ")),
    pronouns: clean(metadata.pronouns),
    program: clean(metadata.program),
    manager: clean(metadata.manager)
  };
}
