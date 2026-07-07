import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

function sanitizeErrorMessage(error: unknown): string {
  const defaultMessage = "An error occurred. Please try again.";

  if (!(error instanceof Error)) {
    return defaultMessage;
  }

  const message = error.message.toLowerCase();

  if (
    message.includes("relation") ||
    message.includes("column") ||
    message.includes("table") ||
    message.includes("does not exist") ||
    message.includes("syntax error") ||
    message.includes("sql") ||
    message.includes("constraint") ||
    message.includes("violates")
  ) {
    return "Database error. Please try again.";
  }

  if (
    message.includes("row-level security") ||
    message.includes("rls") ||
    message.includes("permission") ||
    message.includes("unauthorized") ||
    message.includes("pgrst")
  ) {
    return "Permission denied. Please ensure you're logged in.";
  }

  if (
    message.includes("stripe") ||
    message.includes("openai") ||
    message.includes("api error") ||
    message.includes("api") ||
    message.includes("brevo")
  ) {
    return "Service temporarily unavailable. Please try again.";
  }

  if (
    message.includes("fetch") ||
    message.includes("network") ||
    message.includes("connection") ||
    message.includes("timeout") ||
    message.includes("econnrefused")
  ) {
    return "Connection error. Please check your internet and try again.";
  }

  if (
    message.includes("not configured") ||
    message.includes("missing") ||
    message.includes("env") ||
    message.includes("environment") ||
    message.includes("secret") ||
    message.includes("key")
  ) {
    return "Service configuration error. Please contact support.";
  }

  return defaultMessage;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SmsPurpose = "board-reminder" | "verification";

function normalizeToE164(phoneNumber: string): string | null {
  const trimmed = phoneNumber.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (trimmed.startsWith("+") && digits.length >= 6 && digits.length <= 15) return `+${digits}`;
  return null;
}

function stripSmsContent(content: string): string {
  return content
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/[\r\n]+/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function sendBrevoTransactionalSms(opts: {
  to: string;
  content: string;
  tag?: string;
}): Promise<{ ok: true; messageId: string | null } | { ok: false; statusCode: number; error: string }> {
  const apiKey = Deno.env.get("BREVO_API_KEY");
  const sender = Deno.env.get("BREVO_SMS_SENDER") ?? "Palette";

  if (!apiKey) {
    console.error("Missing BREVO_API_KEY");
    return { ok: false, statusCode: 500, error: "Missing BREVO_API_KEY" };
  }

  const recipient = normalizeToE164(opts.to);
  if (!recipient || !/^\+[1-9]\d{5,14}$/.test(recipient)) {
    return { ok: false, statusCode: 400, error: "Invalid phone number" };
  }

  const content = stripSmsContent(opts.content);
  if (!content || content.length > 70) {
    return { ok: false, statusCode: 400, error: "SMS content must be 70 characters or less" };
  }

  const response = await fetch("https://api.brevo.com/v3/transactionalSMS/send", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender,
      recipient,
      content,
      type: "transactional",
      tag: opts.tag ?? "palette_plan_reminder",
      unicodeEnabled: false,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error =
      typeof data === "object" && data && "message" in data
        ? String((data as { message?: string }).message)
        : JSON.stringify(data);
    console.error("Brevo SMS error:", response.status, error);
    return { ok: false, statusCode: response.status, error };
  }

  const messageId =
    typeof data === "object" && data && "messageId" in data
      ? String((data as { messageId?: string | number }).messageId ?? "")
      : null;

  return { ok: true, messageId: messageId || null };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const phoneNumber = body.phoneNumber as string | undefined;
    const message = body.message as string | undefined;
    const purpose = (body.purpose as SmsPurpose | undefined) ?? "verification";
    const tag =
      purpose === "board-reminder"
        ? "palette_plan_reminder"
        : "palette_phone_verification";

    if (!phoneNumber || !message) {
      throw new Error("Phone number and message are required");
    }

    const masked = phoneNumber.replace(/\d(?=\d{4})/g, "*");
    console.log(`Sending ${purpose} SMS via Brevo to ${masked}`);

    const result = await sendBrevoTransactionalSms({
      to: phoneNumber,
      content: message,
      tag,
    });

    if (!result.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          provider: "brevo",
          statusCode: result.statusCode,
          error: result.error,
        }),
        {
          status: result.statusCode >= 400 && result.statusCode < 600 ? result.statusCode : 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        provider: "brevo",
        messageId: result.messageId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in send-sms-notification:", error);
    return new Response(JSON.stringify({ error: sanitizeErrorMessage(error) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
