import {
  assertMethod,
  canReviewProgram,
  clean,
  handleError,
  httpError,
  isSpecificHours,
  json,
  preflight,
  readJson,
  supervisorEmailsForProgram,
  uniqueEmails
} from "./_shared/http.mjs";
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
    if (!admin.is_super_admin && !canReviewProgram(admin.email, existing[0].program)) {
      throw httpError(403, "You can only update requests routed to your programs.");
    }

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
    await notifySupervisors(updated, admin);
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
    <p>Your ${escapeHtml(timeOffTypeLabel(request.time_off_type))} request for ${escapeHtml(requestSummary(request))} was <strong>${escapeHtml(request.status)}</strong>.</p>
    ${request.decision_note ? `<p>Note: ${escapeHtml(request.decision_note)}</p>` : ""}
  `;
  await sendEmail({ to: request.email, subject, html });
}

async function notifySupervisors(request, admin) {
  const to = uniqueEmails(supervisorEmailsForProgram(request.program));
  const subject = `Time off request ${statusLabels(request.status)}: ${request.first_name} ${request.last_name}`;
  const html = `
    <h1>Time off request update</h1>
    <p><strong>${escapeHtml(request.first_name)} ${escapeHtml(request.last_name)}</strong>'s request is now <strong>${escapeHtml(statusLabels(request.status))}</strong>.</p>
    <p>${escapeHtml(requestSummary(request))}</p>
    <p>Program: ${escapeHtml(request.program)}<br>Updated by: ${escapeHtml(admin.email)}</p>
    ${request.decision_note ? `<p>Note: ${escapeHtml(request.decision_note)}</p>` : ""}
  `;
  await sendEmail({ to, subject, html });
}

function statusLabels(status) {
  return {
    in_review: "in review",
    approved: "approved",
    denied: "denied"
  }[status] || status;
}

function requestSummary(request) {
  if (isSpecificHours(request.partial_day)) {
    return `${request.start_date}, ${request.start_time || ""} to ${request.end_time || ""} (${request.requested_hours || ""} hours)`;
  }
  return `${request.start_date} to ${request.end_date} (${request.business_days} business days)`;
}

function timeOffTypeLabel(value) {
  const text = clean(value);
  const labels = {
    "paid time off": "Vacation",
    pto: "Vacation",
    vacation: "Vacation",
    "sick time": "Sick",
    sick: "Sick",
    "personal day": "Personal",
    personal: "Personal",
    bereavement: "Personal",
    "unpaid time": "Unpaid",
    unpaid: "Unpaid"
  };
  return labels[text.toLowerCase()] || text;
}
