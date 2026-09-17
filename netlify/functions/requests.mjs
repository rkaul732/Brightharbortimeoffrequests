import {
  assertMethod,
  calculateBusinessDays,
  clean,
  handleError,
  httpError,
  isAllowedProgram,
  isValidEmail,
  json,
  normalizeProgramList,
  preflight,
  programLabel,
  readJson,
  supervisorEmailsForProgram,
  supervisorSummaryForProgram,
  uniqueEmails
} from "./_shared/http.mjs";
import { escapeHtml, sendEmail } from "./_shared/resend.mjs";
import { readEmployeeProfile, supabaseRest, verifyEmployee } from "./_shared/supabase.mjs";

const timeOffTypes = new Set(["Vacation", "Sick", "Personal", "Unpaid"]);

export async function handler(event) {
  const options = preflight(event);
  if (options) return options;

  try {
    assertMethod(event, "POST");
    const employee = await verifyEmployee(event);
    const profile = await readEmployeeProfile(employee);
    if (!profile) {
      throw httpError(400, "Complete your profile settings before submitting a request.");
    }

    const body = await readJson(event);
    const request = buildRequest(body, employee, profile);
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

function buildRequest(body, employee, profile) {
  const profilePrograms = normalizeProgramList(profile.program || profile.programs);
  const requestedProgram = programLabel(body.program);
  if (!profilePrograms.length) {
    throw httpError(400, "Complete your profile settings before submitting a request.");
  }
  if (!profilePrograms.includes(requestedProgram)) {
    throw httpError(400, "Choose one of the programs saved in your profile.");
  }

  const request = {
    employee_user_id: employee.id,
    first_name: clean(profile.first_name),
    last_name: clean(profile.last_name),
    email: employee.email,
    department: clean(body.department),
    program: requestedProgram,
    manager: supervisorSummaryForProgram(requestedProgram),
    time_off_type: timeOffTypeLabel(body.time_off_type),
    start_date: clean(body.start_date),
    end_date: clean(body.end_date),
    partial_day: clean(body.partial_day) || "Full days",
    business_days: calculateBusinessDays(body.start_date, body.end_date, body.partial_day),
    reason: clean(body.reason),
    status: "in_review"
  };

  const required = ["first_name", "last_name", "email", "department", "program", "manager", "time_off_type", "start_date", "end_date"];
  if (required.some((key) => !request[key])) {
    throw httpError(400, "Complete all required fields.");
  }
  if (!isValidEmail(request.email)) {
    throw httpError(400, "Enter a valid email address.");
  }
  if (!timeOffTypes.has(request.time_off_type)) {
    throw httpError(400, "Choose a valid time off type.");
  }
  if (!isAllowedProgram(request.program)) {
    throw httpError(400, "Choose a valid program.");
  }
  if (!request.business_days || request.business_days <= 0) {
    throw httpError(400, "Choose dates that include at least one business day.");
  }

  return request;
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

async function notifyAdmins(request) {
  const to = uniqueEmails([...(process.env.ADMIN_NOTIFY_EMAIL || "").split(","), ...supervisorEmailsForProgram(request.program)]);
  const subject = `Time off request: ${request.first_name} ${request.last_name}`;
  const html = `
    <h1>New time off request</h1>
    <p><strong>${escapeHtml(request.first_name)} ${escapeHtml(request.last_name)}</strong> submitted ${escapeHtml(request.time_off_type)}.</p>
    <p>${escapeHtml(request.start_date)} to ${escapeHtml(request.end_date)} (${escapeHtml(request.business_days)} business days)</p>
    <p>Program: ${escapeHtml(request.program)}<br>Department: ${escapeHtml(request.department)}<br>Request routing: ${escapeHtml(request.manager)}</p>
    ${request.reason ? `<p>Notes: ${escapeHtml(request.reason)}</p>` : ""}
  `;
  await sendEmail({ to, subject, html });
}
