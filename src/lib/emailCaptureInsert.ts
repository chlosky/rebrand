import { supabase } from "@/integrations/supabase/client";

export type EmailCaptureSource =
  | "homepage_newsletter"
  | "homepage_demo_popup"
  | "demo_feedback";

export type EmailCaptureInsert = {
  first_name?: string | null;
  email: string;
  marketing_consent: boolean;
  source: EmailCaptureSource;
  feedback?: string | null;
};

/** Inserts a row into email_captures with page context when available. */
export async function insertEmailCapture(row: EmailCaptureInsert) {
  const pagePath =
    typeof window !== "undefined" ? window.location.pathname || "/" : null;
  const referrer =
    typeof document !== "undefined" && document.referrer ? document.referrer : null;

  return supabase.from("email_captures").insert({
    first_name: row.first_name?.trim() || null,
    email: row.email.toLowerCase().trim(),
    marketing_consent: row.marketing_consent,
    source: row.source,
    page_path: pagePath,
    referrer,
    feedback: row.feedback?.trim() || null,
  });
}
