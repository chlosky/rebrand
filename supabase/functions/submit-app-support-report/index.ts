import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPPORT_EMAIL = "support@paletteplot.com";
const DESCRIPTION_MIN = 10;
const HELP_ME_CREATE_DESCRIPTION_MAX = 1000;
const MAX_ATTACHMENTS = 3;

const SUBMISSION_TYPES = new Set(["report", "ai_flag", "feature_request", "help_me_create"]);

function submissionTypeLabel(submissionType: string, toolValue: string): string {
  if (submissionType === "help_me_create" || toolValue === "help_me_create") {
    return "Help Me Create";
  }
  if (submissionType === "report") return "Report issue";
  if (submissionType === "ai_flag") return "Flag AI-generated content";
  return "Feature request";
}
const BILLING_CHANNELS = new Set(["apple_app_store", "google_play", "web"]);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Paths must be objects the user uploaded under support-reports/{user_id}/... */
function normalizeAttachmentPaths(userId: string, raw: unknown): string[] {
  if (raw == null) return [];
  if (!Array.isArray(raw)) {
    throw new Error("Invalid attachments");
  }
  if (raw.length > MAX_ATTACHMENTS) {
    throw new Error(`At most ${MAX_ATTACHMENTS} images allowed`);
  }
  const out: string[] = [];
  for (const item of raw) {
    const s = String(item ?? "").trim();
    if (!s) continue;
    if (s.length > 480 || s.includes("..") || s.includes("//") || !s.startsWith(`${userId}/`)) {
      throw new Error("Invalid attachment path");
    }
    const rest = s.slice(userId.length + 1);
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/i.test(rest)) {
      throw new Error("Invalid attachment path");
    }
    const lower = rest.toLowerCase();
    const okExt = /\.(jpe?g|png|gif|webp|heic|heif|avif|bmp|tiff?)$/i.test(lower);
    if (!okExt) {
      throw new Error("Attachments must be image files (e.g. JPG, PNG, HEIC)");
    }
    out.push(s);
  }
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: {
      submission_type?: string;
      tool_value?: string;
      tool_label?: string;
      description?: string;
      attachment_storage_paths?: unknown;
      billing_purchase_channel?: string | null;
    } = {};
    try {
      const raw = await req.text();
      if (raw?.trim()) body = JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const submissionType = String(body.submission_type ?? "").trim();
    const toolValue = String(body.tool_value ?? "").trim();
    const toolLabel = String(body.tool_label ?? "").trim();
    const description = String(body.description ?? "").trim();
    const rawBillingChannel = String(body.billing_purchase_channel ?? "").trim();

    let billingPurchaseChannel: string | null = null;
    if (toolValue === "billing") {
      if (!BILLING_CHANNELS.has(rawBillingChannel)) {
        return new Response(
          JSON.stringify({ error: "Please select where you purchased (Mobile purchase or Web)." }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      billingPurchaseChannel = rawBillingChannel;
    } else if (rawBillingChannel) {
      return new Response(JSON.stringify({ error: "Purchase channel applies only to billing reports." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let attachmentPaths: string[] = [];
    try {
      attachmentPaths = normalizeAttachmentPaths(user.id, body.attachment_storage_paths);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid attachments";
      return new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!SUBMISSION_TYPES.has(submissionType)) {
      return new Response(JSON.stringify({ error: "Invalid submission type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!toolValue || toolValue.length > 240) {
      return new Response(JSON.stringify({ error: "Invalid tool selection" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!toolLabel || toolLabel.length > 240) {
      return new Response(JSON.stringify({ error: "Invalid tool label" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const isHelpMeCreate = submissionType === "help_me_create";
    const descriptionTooLong =
      isHelpMeCreate && description.length > HELP_ME_CREATE_DESCRIPTION_MAX;
    if (description.length < DESCRIPTION_MIN || descriptionTooLong) {
      return new Response(
        JSON.stringify({
          error: isHelpMeCreate
            ? `Description must be between ${DESCRIPTION_MIN} and ${HELP_ME_CREATE_DESCRIPTION_MAX} characters`
            : `Description must be at least ${DESCRIPTION_MIN} characters`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const userEmail = user.email ?? "";
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("first_name")
      .eq("id", user.id)
      .maybeSingle();
    const userFirstName = (profile?.first_name as string | null)?.trim() || "";
    const typeLabel = submissionTypeLabel(submissionType, toolValue);

    const reportDescription = isHelpMeCreate
      ? [
          "Help Me Create",
          "",
          "What are you working on right now?",
          description,
          "",
          "What do you need help with?",
          toolLabel,
        ].join("\n")
      : description;

    // Service role so the row is always written (user JWT insert can fail under RLS edge cases).
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("app_support_reports")
      .insert({
        user_id: user.id,
        user_email: userEmail,
        user_first_name: userFirstName || null,
        submission_type: submissionType,
        tool_value: toolValue,
        tool_label: toolLabel,
        description: reportDescription,
        attachment_storage_paths: attachmentPaths,
        billing_purchase_channel: billingPurchaseChannel,
      })
      .select("id")
      .single();

    if (insertError || !inserted?.id) {
      console.error("[submit-app-support-report] insert error:", insertError);
      const detail = insertError?.message ?? "unknown";
      return new Response(JSON.stringify({ error: "Could not save report", detail }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const billingChannelLabel =
      billingPurchaseChannel === "apple_app_store" || billingPurchaseChannel === "google_play"
        ? "Mobile purchase"
        : billingPurchaseChannel === "web"
          ? "Web (card / checkout)"
          : "";

    const billingRowText =
      billingPurchaseChannel != null ? `Purchase channel: ${billingChannelLabel}` : "";

    const messageType = isHelpMeCreate ? "help_me_create" : "app_support_feedback";
    const caseSubject =
      messageType === "help_me_create" ? `Help Me Create — ${toolLabel}` : `${typeLabel} — ${toolLabel}`;
    const preview = description.slice(0, 240);

    // Mirror into user inbox + admin support case (service role; RLS-safe).
    try {
      const { data: existingThread, error: threadFindErr } = await supabaseAdmin
        .from("inbox_threads")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (threadFindErr) throw threadFindErr;

      let threadId = existingThread?.id as string | undefined;
      const threadSource = messageType === "help_me_create" ? "help_me_create" : "support_report";
      if (!threadId) {
        const { data: createdThread, error: threadCreateErr } = await supabaseAdmin
          .from("inbox_threads")
          .insert({
            user_id: user.id,
            source: threadSource,
            status: "open",
            last_message_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        if (threadCreateErr) throw threadCreateErr;
        threadId = createdThread.id as string;
      }

      const nowIso = new Date().toISOString();
      const chatBody = description;

      const { data: createdCase, error: caseErr } = await supabaseAdmin
        .from("support_cases")
        .insert({
          user_id: user.id,
          user_email: userEmail,
          user_first_name: userFirstName || null,
          message_type: messageType,
          submission_type: submissionType,
          tool_or_area: toolValue,
          tool_label: toolLabel,
          subject: caseSubject,
          original_submission_text: reportDescription,
          latest_message_preview: preview,
          status: "open",
          admin_unread: true,
          user_unread: false,
          attachment_storage_paths: attachmentPaths,
          report_id: inserted.id,
          thread_id: threadId,
        })
        .select("id")
        .single();
      if (caseErr) throw caseErr;

      const { error: msgErr } = await supabaseAdmin.from("inbox_messages").insert({
        thread_id: threadId,
        case_id: createdCase?.id ?? null,
        sender: "user",
        body_text: chatBody,
        attachment_storage_paths: attachmentPaths,
        created_at: nowIso,
      });
      if (msgErr) throw msgErr;

      await supabaseAdmin
        .from("inbox_threads")
        .update({ last_message_at: nowIso, updated_at: nowIso, source: threadSource })
        .eq("id", threadId);
    } catch (e) {
      console.error("[submit-app-support-report] inbox/case mirror failed:", e);
      const detail = e instanceof Error ? e.message : String(e);
      return new Response(
        JSON.stringify({
          error: "Report saved but inbox case could not be created",
          detail,
          id: inserted.id,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const billingRowHtml =
      billingPurchaseChannel != null
        ? `<tr><th align="left">Purchase channel</th><td>${escapeHtml(billingChannelLabel)}</td></tr>`
        : "";

    const signedUrls: string[] = [];
    for (const p of attachmentPaths) {
      const { data: signed, error: signErr } = await supabaseAdmin.storage
        .from("support-reports")
        .createSignedUrl(p, 60 * 60 * 24 * 7);
      if (!signErr && signed?.signedUrl) signedUrls.push(signed.signedUrl);
    }

    const attachmentHtml =
      signedUrls.length === 0
        ? "<tr><th align=\"left\">Attachments</th><td>(none)</td></tr>"
        : `<tr><th align="left">Attachments</th><td>${signedUrls
            .map(
              (u, i) =>
                `<div><a href="${u.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}">Screenshot ${i + 1}</a></div>`,
            )
            .join("")}</td></tr>`;

    const attachmentText =
      signedUrls.length === 0
        ? "Attachments: (none)"
        : `Attachments:\n${signedUrls.map((u) => u).join("\n")}`;

    const textBody = [
      "New app support submission",
      "",
      `Report id: ${inserted.id}`,
      `User id: ${user.id}`,
      `First name: ${userFirstName || "(none)"}`,
      `User email: ${userEmail || "(none)"}`,
      "",
      `Submission type: ${typeLabel}`,
      `Tool (value): ${toolValue}`,
      `Tool (label): ${toolLabel}`,
      ...(billingRowText ? [billingRowText] : []),
      "",
      "Description:",
      reportDescription,
      "",
      attachmentText,
    ].join("\n");

    const htmlBody = `
      <h2>New app support submission</h2>
      <table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
        <tr><th align="left">Report id</th><td>${escapeHtml(String(inserted.id))}</td></tr>
        <tr><th align="left">User id</th><td>${escapeHtml(user.id)}</td></tr>
        <tr><th align="left">First name</th><td>${escapeHtml(userFirstName || "(none)")}</td></tr>
        <tr><th align="left">User email</th><td>${escapeHtml(userEmail || "(none)")}</td></tr>
        <tr><th align="left">Submission type</th><td>${escapeHtml(typeLabel)}</td></tr>
        <tr><th align="left">Tool (value)</th><td>${escapeHtml(toolValue)}</td></tr>
        <tr><th align="left">Tool (label)</th><td>${escapeHtml(toolLabel)}</td></tr>
        ${billingRowHtml}
        <tr><th align="left">Description</th><td style="white-space:pre-wrap">${escapeHtml(reportDescription)}</td></tr>
        ${attachmentHtml}
      </table>
    `.trim();

    console.log("[submit-app-support-report] saved support report; app email notification disabled", {
      reportId: inserted.id,
      supportEmail: SUPPORT_EMAIL,
      subject:
        messageType === "help_me_create"
          ? "[palette plotting] Help Me Create"
          : `[palette plotting] ${typeLabel} — ${toolLabel}`,
    });

    return new Response(JSON.stringify({ success: true, id: inserted.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[submit-app-support-report]", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
