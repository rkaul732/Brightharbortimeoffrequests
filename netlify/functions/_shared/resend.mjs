export async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const recipients = Array.isArray(to)
    ? to.map((item) => String(item || "").trim()).filter(Boolean)
    : String(to || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  if (!apiKey || !from || !recipients.length) {
    return { skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: recipients.length === 1 ? recipients[0] : recipients,
      subject,
      html
    })
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Resend email failed", body);
    return { skipped: false, error: body?.message || "Resend email failed." };
  }

  return { skipped: false, id: body.id };
}

export function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
