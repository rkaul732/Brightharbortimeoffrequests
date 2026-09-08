import { assertMethod, handleError, json, preflight } from "./_shared/http.mjs";
import { supabaseRest, verifyAdmin } from "./_shared/supabase.mjs";

export async function handler(event) {
  const options = preflight(event);
  if (options) return options;

  try {
    assertMethod(event, "GET");
    await verifyAdmin(event);
    const requests = await supabaseRest("time_off_requests?select=*");
    requests.sort((a, b) => {
      const last = String(a.last_name || "").localeCompare(String(b.last_name || ""));
      if (last) return last;
      const first = String(a.first_name || "").localeCompare(String(b.first_name || ""));
      if (first) return first;
      return String(a.start_date || "").localeCompare(String(b.start_date || ""));
    });
    return json(200, { requests });
  } catch (error) {
    return handleError(error);
  }
}
