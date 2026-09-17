import { assertMethod, clean, handleError, httpError, json, preflight, readJson } from "./_shared/http.mjs";
import { isSuperAdminEmail, normalizeAccountType, supabaseRest, verifyAdmin } from "./_shared/supabase.mjs";

export async function handler(event) {
  const options = preflight(event);
  if (options) return options;

  try {
    assertMethod(event, "POST");
    await verifyAdmin(event);

    const body = await readJson(event);
    const id = clean(body.id);
    const assignedAdmin = clean(body.assigned_admin || body.assignedAdmin || body.manager);

    if (!id) throw httpError(400, "Member id is required.");
    if (assignedAdmin) await assertReviewerExists(assignedAdmin);

    const rows = await supabaseRest(`employee_profiles?id=eq.${encodeURIComponent(id)}&select=*`, {
      method: "PATCH",
      prefer: "return=representation",
      body: {
        manager: assignedAdmin
      }
    });

    if (!rows.length) throw httpError(404, "Member was not found.");
    return json(200, { member: memberResponse(rows[0]) });
  } catch (error) {
    return handleError(error);
  }
}

async function assertReviewerExists(assignedAdmin) {
  const accounts = await supabaseRest("employee_profiles?select=email,first_name,last_name,account_type");
  const reviewer = accounts.map(memberResponse).find((account) => reviewerMatches(account, assignedAdmin));
  if (!reviewer || (reviewer.account_type !== "admin" && reviewer.account_type !== "super_admin")) {
    throw httpError(400, "Choose an admin from the list.");
  }
}

function reviewerMatches(account, assignedAdmin) {
  const value = clean(assignedAdmin).toLowerCase();
  return clean(account.email).toLowerCase() === value || accountName(account).toLowerCase() === value;
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

function accountName(account) {
  const name = `${clean(account.first_name)} ${clean(account.last_name)}`.trim();
  return name || account.email || "Unknown account";
}
