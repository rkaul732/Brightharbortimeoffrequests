import {
  clean,
  handleError,
  httpError,
  json,
  preflight,
  programListValue,
  readJson,
  requireProgramList,
  supervisorSummaryForPrograms
} from "./_shared/http.mjs";
import { normalizeEmployeeProfile, readEmployeeProfile, upsertEmployeeProfile, verifyEmployee } from "./_shared/supabase.mjs";

export async function handler(event) {
  const options = preflight(event);
  if (options) return options;

  try {
    if (!["GET", "PATCH"].includes(event.httpMethod)) {
      throw httpError(405, `${event.httpMethod} is not allowed for this endpoint.`);
    }

    const employee = await verifyEmployee(event);

    if (event.httpMethod === "GET") {
      const existingProfile = await readEmployeeProfile(employee);
      const profile = existingProfile || (await upsertEmployeeProfile(employee, {}));
      return json(200, { profile: normalizeEmployeeProfile(employee, profile) });
    }

    const body = await readJson(event);
    const programs = requireProgramList(body.programs || body.program);
    const profileInput = {
      first_name: clean(body.first_name),
      last_name: clean(body.last_name),
      pronouns: clean(body.pronouns),
      program: programListValue(programs),
      manager: supervisorSummaryForPrograms(programs)
    };

    if (!profileInput.first_name || !profileInput.last_name || !profileInput.program) {
      throw httpError(400, "Complete your name and choose at least one program.");
    }

    const profile = await upsertEmployeeProfile(employee, profileInput);
    return json(200, { profile: normalizeEmployeeProfile(employee, profile) });
  } catch (error) {
    return handleError(error);
  }
}
