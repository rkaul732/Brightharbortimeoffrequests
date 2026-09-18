import {
  clean,
  handleError,
  isSpecificHours,
  json,
  preflight,
  supervisorEmailsForProgram,
  uniqueEmails
} from "./_shared/http.mjs";
import { escapeHtml, sendEmail } from "./_shared/resend.mjs";
import { supabaseRest } from "./_shared/supabase.mjs";

export const config = {
  schedule: "0 13 * * *"
};

export async function handler(event) {
  const options = preflight(event);
  if (options) return options;

  try {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const requests = await supabaseRest(
      `time_off_requests?status=eq.in_review&created_at=lte.${encodeURIComponent(cutoff)}&pending_reminder_sent_at=is.null&select=*`
    );

    for (const request of requests) {
      await notifyPendingSupervisors(request);
      await supabaseRest(`time_off_requests?id=eq.${encodeURIComponent(request.id)}&select=id`, {
        method: "PATCH",
        prefer: "return=minimal",
        body: { pending_reminder_sent_at: new Date().toISOString() }
      });
    }

    return json(200, { checked: requests.length });
  } catch (error) {
    return handleError(error);
  }
}

async function notifyPendingSupervisors(request) {
  const to = uniqueEmails(supervisorEmailsForProgram(request.program));
  const subject = `Time off request pending over one week: ${request.first_name} ${request.last_name}`;
  const html = `
    <h1>Time off request still pending</h1>
    <p><strong>${escapeHtml(request.first_name)} ${escapeHtml(request.last_name)}</strong>'s request has been pending for over one week.</p>
    <p>${escapeHtml(requestSummary(request))}</p>
    <p>Program: ${escapeHtml(request.program)}<br>Submitted: ${escapeHtml(clean(request.created_at))}</p>
    ${request.reason ? `<p>Notes: ${escapeHtml(request.reason)}</p>` : ""}
  `;
  await sendEmail({ to, subject, html });
}

function requestSummary(request) {
  if (isSpecificHours(request.partial_day)) {
    return `${request.start_date}, ${request.start_time || ""} to ${request.end_time || ""} (${request.requested_hours || ""} hours)`;
  }
  return `${request.start_date} to ${request.end_date} (${request.business_days} business days)`;
}
