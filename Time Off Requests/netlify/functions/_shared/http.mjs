const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "cache-control": "no-store"
};

export function preflight(event) {
  return event.httpMethod === "OPTIONS"
    ? {
        statusCode: 204,
        headers: corsHeaders,
        body: ""
      }
    : null;
}

export function json(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      ...corsHeaders,
      "content-type": "application/json",
      ...headers
    },
    body: JSON.stringify(body)
  };
}

export async function readJson(event) {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch (error) {
    throw httpError(400, "Request body must be valid JSON.");
  }
}

export function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export function clean(value) {
  return String(value || "").trim();
}

export function assertMethod(event, method) {
  if (event.httpMethod !== method) {
    throw httpError(405, `${event.httpMethod} is not allowed for this endpoint.`);
  }
}

export function handleError(error) {
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? "Something went wrong." : error.message;
  if (statusCode === 500) {
    console.error(error);
  }
  return json(statusCode, { error: message });
}

export function calculateBusinessDays(startValue, endValue, partialDay) {
  const start = parseLocalDate(startValue);
  const end = parseLocalDate(endValue);
  if (!start || !end || start > end) return 0;

  let days = 0;
  for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const weekday = date.getDay();
    if (weekday !== 0 && weekday !== 6) days += 1;
  }

  if (days === 1 && String(partialDay || "").toLowerCase().includes("half")) {
    return 0.5;
  }
  return days;
}

export function parseLocalDate(value) {
  if (!value) return null;
  const parts = String(value).split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
