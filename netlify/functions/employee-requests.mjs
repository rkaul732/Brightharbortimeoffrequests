import { assertMethod, handleError, json, preflight } from "./_shared/http.mjs";
import { supabaseRest, verifyEmployee } from "./_shared/supabase.mjs";

export async function handler(event) {
  const options = preflight(event);
  if (options) return options;

  try {
    assertMethod(event, "GET");
    const employee = await verifyEmployee(event);
    const requests = await supabaseRest(
      `time_off_requests?employee_user_id=eq.${encodeURIComponent(employee.id)}&select=*&order=created_at.desc`
    );
    return json(200, { requests });
  } catch (error) {
    return handleError(error);
  }
}
