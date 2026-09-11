import { assertAllowedProgram, assertMethod, clean, handleError, httpError, json, preflight, readJson } from "./_shared/http.mjs";
import {
  assertBrightHarborEmail,
  createAuthUser,
  normalizeEmployeeProfile,
  passwordGrant,
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
    if (password.length < 8) {
      throw httpError(400, "Choose a password with at least 8 characters.");
    }

    const profileInput = {
      first_name: clean(body.first_name),
      last_name: clean(body.last_name),
      pronouns: clean(body.pronouns),
      program: clean(body.program),
      manager: clean(body.manager)
    };
    requireProfile(profileInput);
    assertAllowedProgram(profileInput.program);

    const createdUser = await createAuthUser(email, password, profileInput);
    const user = {
      id: createdUser.id || createdUser.user?.id,
      email: email
    };
    if (!user.id) {
      throw httpError(500, "Employee account was created, but the profile could not be linked.");
    }

    const profile = await upsertEmployeeProfile(user, profileInput);
    const session = await passwordGrant(email, password, "Sign in failed after account creation.");

    return json(201, {
      email,
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

function requireProfile(profile) {
  if (!profile.first_name || !profile.last_name || !profile.program || !profile.manager) {
    throw httpError(400, "Complete your name, program, and manager.");
  }
}
