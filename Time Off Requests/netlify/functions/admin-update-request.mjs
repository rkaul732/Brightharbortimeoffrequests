import { assertMethod, clean, handleError, httpError, json, preflight, readJson } from "./_shared/http.mjs";
import { escapeHtml, sendEmail } from "./_shared/resend.mjs";
import { supabaseRest, verifyAdmin } from "./_shared/supabase.mjs";

const statuses = new Set(["in_review", "approved", "denied"]);

export async function handler(event) {
  const options = preflight(event);
  if (options) return options;

  try {
    assertMethod(event, "POST");
    const admin = await verifyAdmin(event);
    const body = await readJson(event);
    const id = clean(body.id);
    const status = clean(body.status);
    const decisionNote = clean(body.decision_note);

    if (!id) throw httpError(400, "Request id is required.");
    if (!statuses.has(status)) throw httpError(400, "Choose a valid approval type.");

    const existing = await supabaseRest(`time_off_requests?id=eq.${encodeURIComponent(id)}&select=*`);
    if (!existing.length) throw httpError(404, "Request was not found.");

    const rows = await supabaseRest(`time_off_requests?id=eq.${encodeURIComponent(id)}&select=*`, {
      method: "PATCH",
      prefer: "return=representation",
      body: {
        status,
        decision_note: decisionNote,
        reviewed_by: admin.email,
        updated_at: new Date().toISOString()
      }
    });

    const updated = rows[0];
    await notifyEmployee(updated);
    return json(200, { request: updated });
  } catch (error) {
    return handleError(error);
  }
}

async function notifyEmployee(request) {
  if (request.status === "in_review") return;

  const subject = `Your time off request was ${request.status === "approved" ? "approved" : "denied"}`;
  const html = `
    <h1>Time off request update</h1>
    <p>Hi ${escapeHtml(request.first_name)},</p>
    <p>Your ${escapeHtml(request.time_off_type)} request for ${escapeHtml(request.start_date)} to ${escapeHtml(request.end_date)} was <strong>${escapeHtml(request.status)}</strong>.</p>
    ${request.decision_note ? `<p>Note: ${escapeHtml(request.decision_note)}</p>` : ""}
  `;
  await sendEmail({ to: request.email, subject, html });
}
