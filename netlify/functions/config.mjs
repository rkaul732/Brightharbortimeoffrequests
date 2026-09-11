import { json, preflight } from "./_shared/http.mjs";
import { hasAdminAccessConfig, hasSupabaseConfig } from "./_shared/supabase.mjs";

export async function handler(event) {
  const options = preflight(event);
  if (options) return options;

  return json(200, {
    backendReady: hasSupabaseConfig(),
    emailReady: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
    adminEmailsConfigured: hasAdminAccessConfig()
  });
}
