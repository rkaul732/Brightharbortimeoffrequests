import { assertMethod, canReviewProgram, handleError, json, preflight } from "./_shared/http.mjs";
import { supabaseRest, verifyAdmin } from "./_shared/supabase.mjs";

export async function handler(event) {
  const options = preflight(event);
  if (options) return options;

  try {
    assertMethod(event, "GET");
    const admin = await verifyAdmin(event);
    const requests = await supabaseRest("time_off_requests?select=*");
    const visibleRequests = admin.is_super_admin
      ? requests
      : requests.filter((request) => canReviewProgram(admin.email, request.program));
    visibleRequests.sort((a, b) => {
      const last = String(a.last_name || "").localeCompare(String(b.last_name || ""));
      if (last) return last;
      const first = String(a.first_name || "").localeCompare(String(b.first_name || ""));
      if (first) return first;
      return String(a.start_date || "").localeCompare(String(b.start_date || ""));
    });
    return json(200, { requests: visibleRequests });
  } catch (error) {
    return handleError(error);
  }
}
