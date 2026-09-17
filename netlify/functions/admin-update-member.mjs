import {
  assertMethod,
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
import { isSuperAdminEmail, normalizeAccountType, supabaseRest, verifySuperAdmin } from "./_shared/supabase.mjs";

export async function handler(event) {
  const options = preflight(event);
  if (options) return options;

  try {
    assertMethod(event, "POST");
    await verifySuperAdmin(event);

    const body = await readJson(event);
    const id = clean(body.id);
    const updates = memberUpdates(body);

    if (!id) throw httpError(400, "Member id is required.");

    const rows = await supabaseRest(`employee_profiles?id=eq.${encodeURIComponent(id)}&select=*`, {
      method: "PATCH",
      prefer: "return=representation",
      body: updates
    });

    if (!rows.length) throw httpError(404, "Member was not found.");
    return json(200, { member: memberResponse(rows[0]) });
  } catch (error) {
    return handleError(error);
  }
}

function memberUpdates(body) {
  const updates = {};

  if (Object.prototype.hasOwnProperty.call(body, "first_name") || Object.prototype.hasOwnProperty.call(body, "firstName")) {
    updates.first_name = clean(body.first_name || body.firstName);
  }
  if (Object.prototype.hasOwnProperty.call(body, "last_name") || Object.prototype.hasOwnProperty.call(body, "lastName")) {
    updates.last_name = clean(body.last_name || body.lastName);
  }
  if (Object.prototype.hasOwnProperty.call(body, "pronouns")) {
    updates.pronouns = clean(body.pronouns);
  }
  if (Object.prototype.hasOwnProperty.call(body, "program") || Object.prototype.hasOwnProperty.call(body, "programs")) {
    const programs = requireProgramList(body.programs || body.program);
    updates.program = programListValue(programs);
    updates.manager = supervisorSummaryForPrograms(programs);
  }

  if (!updates.first_name && Object.prototype.hasOwnProperty.call(updates, "first_name")) {
    throw httpError(400, "First name is required.");
  }
  if (!updates.last_name && Object.prototype.hasOwnProperty.call(updates, "last_name")) {
    throw httpError(400, "Last name is required.");
  }
  if (Object.prototype.hasOwnProperty.call(updates, "program")) {
    if (!updates.program) throw httpError(400, "Choose at least one program.");
  }

  return updates;
}

function memberResponse(account) {
  const email = clean(account.email).toLowerCase();
  const superAdmin = isSuperAdminEmail(email);
  return {
    id: clean(account.id),
    email,
    first_name: clean(account.first_name),
    last_name: clean(account.last_name),
    pronouns: clean(account.pronouns),
    program: clean(account.program),
    manager: clean(account.manager),
    account_type: superAdmin ? "super_admin" : normalizeAccountType(account.account_type),
    is_super_admin: superAdmin,
    created_at: account.created_at || "",
    updated_at: account.updated_at || ""
  };
}
