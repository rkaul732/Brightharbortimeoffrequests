import { assertMethod, calculateBusinessDays, clean, handleError, httpError, isValidEmail, json, preflight, readJson } from "./_shared/http.mjs";
import { escapeHtml, sendEmail } from "./_shared/resend.mjs";
import { supabaseRest } from "./_shared/supabase.mjs";

export async function handler(event) {
  const options = preflight(event);
  if (options) return options;

  try {
    assertMethod(event, "POST");
    const body = await readJson(event);
    const request = buildRequest(body);
    const rows = await supabaseRest("time_off_requests?select=*", {
      method: "POST",
      prefer: "return=representation",
      body: request
    });
    const saved = rows[0];
    await notifyAdmins(saved);
    return json(201, { request: saved });
  } catch (error) {
    return handleError(error);
  }
}

function buildRequest(body) {
  const request = {
    first_name: clean(body.first_name),
    last_name: clean(body.last_name),
    email: clean(body.email).toLowerCase(),
    department: clean(body.department),
    manager: clean(body.manager),
    time_off_type: clean(body.time_off_type),
    start_date: clean(body.start_date),
    end_date: clean(body.end_date),
    partial_day: clean(body.partial_day) || "Full days",
    business_days: calculateBusinessDays(body.start_date, body.end_date, body.partial_day),
    reason: clean(body.reason),
    status: "in_review"
  };

  const required = ["first_name", "last_name", "email", "department", "manager", "time_off_type", "start_date", "end_date"];
  if (required.some((key) => !request[key])) {
    throw httpError(400, "Complete all required fields.");
  }
  if (!isValidEmail(request.email)) {
    throw httpError(400, "Enter a valid email address.");
  }
  if (!request.business_days || request.business_days <= 0) {
    throw httpError(400, "Choose dates that include at least one business day.");
  }

  return request;
}

async function notifyAdmins(request) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  const subject = `Time off request: ${request.first_name} ${request.last_name}`;
  const html = `
    <h1>New time off request</h1>
    <p><strong>${escapeHtml(request.first_name)} ${escapeHtml(request.last_name)}</strong> submitted ${escapeHtml(request.time_off_type)}.</p>
    <p>${escapeHtml(request.start_date)} to ${escapeHtml(request.end_date)} (${escapeHtml(request.business_days)} business days)</p>
    <p>Department: ${escapeHtml(request.department)}<br>Manager: ${escapeHtml(request.manager)}</p>
    ${request.reason ? `<p>Notes: ${escapeHtml(request.reason)}</p>` : ""}
  `;
  await sendEmail({ to, subject, html });
}
