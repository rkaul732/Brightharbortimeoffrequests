import {
  assertMethod,
  calculateBusinessDays,
  clean,
  handleError,
  httpError,
  isAllowedProgram,
  isSpecificHours,
  isValidEmail,
  json,
  normalizeProgramList,
  preflight,
  programLabel,
  readJson,
  calculateRequestedHours,
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

  const partialDay = clean(body.partial_day) || "Full days";
  const specificHours = isSpecificHours(partialDay);
  const startDate = clean(body.start_date);
  const endDate = specificHours ? startDate : clean(body.end_date);
  const startTime = specificHours ? clean(body.start_time) : "";
  const endTime = specificHours ? clean(body.end_time) : "";
  const requestedHours = specificHours ? calculateRequestedHours(startTime, endTime) : null;

  const request = {
    employee_user_id: employee.id,
    first_name: clean(profile.first_name),
    last_name: clean(profile.last_name),
    email: employee.email,
    department: clean(body.department),
    program: requestedProgram,
    manager: supervisorSummaryForProgram(requestedProgram),
    time_off_type: timeOffTypeLabel(body.time_off_type),
    start_date: startDate,
    end_date: endDate,
    partial_day: partialDay,
    start_time: startTime || null,
    end_time: endTime || null,
    requested_hours: requestedHours,
    business_days: calculateBusinessDays(startDate, endDate, partialDay, startTime, endTime),
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
  if (specificHours) {
    if (!request.start_time || !request.end_time) {
      throw httpError(400, "Enter the start and end time for the specific hours request.");
    }
    if (!request.requested_hours || request.requested_hours <= 0) {
      throw httpError(400, "Enter an end time that is after the start time.");
    }
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
    <p>${escapeHtml(requestSummary(request))}</p>
    <p>Program: ${escapeHtml(request.program)}<br>Department: ${escapeHtml(request.department)}<br>Request routing: ${escapeHtml(request.manager)}</p>
    ${request.reason ? `<p>Notes: ${escapeHtml(request.reason)}</p>` : ""}
  `;
  await sendEmail({ to, subject, html });
}

function requestSummary(request) {
  if (isSpecificHours(request.partial_day)) {
    return `${request.start_date}, ${request.start_time} to ${request.end_time} (${request.requested_hours} hours)`;
  }
  return `${request.start_date} to ${request.end_date} (${request.business_days} business days)`;
}
