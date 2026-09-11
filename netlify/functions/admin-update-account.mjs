import { assertMethod, clean, handleError, httpError, json, preflight, readJson } from "./_shared/http.mjs";
import { isSuperAdminEmail, normalizeAccountType, supabaseRest, verifySuperAdmin } from "./_shared/supabase.mjs";

export async function handler(event) {
  const options = preflight(event);
  if (options) return options;

  try {
    assertMethod(event, "POST");
    await verifySuperAdmin(event);

    const body = await readJson(event);
    const id = clean(body.id);
    const accountType = clean(body.account_type || body.accountType).toLowerCase();

    if (!id) throw httpError(400, "Account id is required.");
    if (!["employee", "admin"].includes(accountType)) throw httpError(400, "Choose employee or admin.");

    const existing = await supabaseRest(`employee_profiles?id=eq.${encodeURIComponent(id)}&select=*`);
    if (!existing.length) throw httpError(404, "Account was not found.");
    if (isSuperAdminEmail(existing[0].email)) {
      throw httpError(400, "The super admin account type cannot be changed here.");
    }

    const rows = await supabaseRest(`employee_profiles?id=eq.${encodeURIComponent(id)}&select=*`, {
      method: "PATCH",
      prefer: "return=representation",
      body: {
        account_type: accountType
      }
    });

    return json(200, { account: accountResponse(rows[0]) });
  } catch (error) {
    return handleError(error);
  }
}

function accountResponse(account) {
  const email = clean(account.email).toLowerCase();
  return {
    id: clean(account.id),
    email,
    first_name: clean(account.first_name),
    last_name: clean(account.last_name),
    pronouns: clean(account.pronouns),
    program: clean(account.program),
    manager: clean(account.manager),
    account_type: normalizeAccountType(account.account_type),
    is_super_admin: false,
    created_at: account.created_at || "",
    updated_at: account.updated_at || ""
  };
}
