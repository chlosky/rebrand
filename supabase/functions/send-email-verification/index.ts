import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const POSTMARK_SERVER_TOKEN = Deno.env.get("POSTMARK_SERVER_TOKEN");
    const POSTMARK_FROM_EMAIL = Deno.env.get("POSTMARK_FROM_EMAIL");

    if (!POSTMARK_SERVER_TOKEN) throw new Error("Postmark server token not configured");

    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const requestOrigin = req.headers.get("origin") || req.headers.get("referer") || "http://localhost:8080";
    const baseUrl = requestOrigin.replace(/\/$/, "");

    const rawToken = randomToken();
    const tokenHash = await sha256Hex(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(); // 24h

    const { error: upsertErr } = await supabase.from("email_verification_tokens").upsert(
      {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        used_at: null,
      },
      { onConflict: "user_id" },
    );

    if (upsertErr) {
      console.error("Error saving verification token:", upsertErr);
      return new Response(JSON.stringify({ error: "Failed to create verification token" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const verificationUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.5;">
        <h2 style="margin: 0 0 12px;">Verify your email</h2>
        <p style="margin: 0 0 16px;">Please verify your email address to secure your account and receive updates.</p>
        <p style="margin: 0 0 20px;">
          <a href="${verificationUrl}" style="display: inline-block; background: #000; color: #fff; padding: 10px 14px; border-radius: 999px; text-decoration: none;">
            Verify email
          </a>
        </p>
        <p style="margin: 0; color: #666; font-size: 12px;">If you didn't request this, you can ignore this email.</p>
      </div>
    `.trim();

    const res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": POSTMARK_SERVER_TOKEN,
      },
      body: JSON.stringify({
        To: user.email,
        From: POSTMARK_FROM_EMAIL || undefined,
        Subject: "Verify your email address",
        HtmlBody: htmlBody,
        MessageStream: "outbound",
        Tag: "email-verification",
        Metadata: { email_type: "email_verification" },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Postmark error:", err);
      return new Response(JSON.stringify({ error: "Failed to send verification email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Unhandled error in send-email-verification:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

