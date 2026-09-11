import { assertMethod, clean, handleError, json, preflight } from "./_shared/http.mjs";
import { isSuperAdminEmail, normalizeAccountType, supabaseRest, verifySuperAdmin } from "./_shared/supabase.mjs";

export async function handler(event) {
  const options = preflight(event);
  if (options) return options;

  try {
    assertMethod(event, "GET");
    await verifySuperAdmin(event);

    const accounts = await supabaseRest("employee_profiles?select=*");
    accounts.sort((a, b) => {
      const last = clean(a.last_name).localeCompare(clean(b.last_name));
      if (last) return last;
      const first = clean(a.first_name).localeCompare(clean(b.first_name));
      if (first) return first;
      return clean(a.email).localeCompare(clean(b.email));
    });

    return json(200, { accounts: accounts.map(accountResponse) });
  } catch (error) {
    return handleError(error);
  }
}

function accountResponse(account) {
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
