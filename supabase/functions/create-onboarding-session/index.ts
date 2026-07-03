import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { attributionInsertFromClient } from "../_shared/onboardingAttribution.ts";

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

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const resumeToken = randomToken();
    const resumeTokenHash = await sha256Hex(resumeToken);

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const attributionInput =
      body.attribution && typeof body.attribution === "object"
        ? (body.attribution as Record<string, unknown>)
        : {};
    const attributionColumns = attributionInsertFromClient({
      first_touch: attributionInput.first_touch as Record<string, unknown> | null,
      last_touch: attributionInput.last_touch as Record<string, unknown> | null,
      payload: attributionInput.payload as Record<string, unknown> | null,
    });

    const { data, error } = await supabase
      .from("onboarding_sessions")
      .insert({
        resume_token_hash: resumeTokenHash,
        status: "started",
        ...attributionColumns,
      })
      .select("id, status, created_at")
      .single();

    if (error) {
      console.error("Error creating onboarding session:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to create onboarding session",
          details: error.message,
          hint: error.message?.includes("relation") || error.message?.includes("does not exist") 
            ? "The onboarding_sessions table may not exist. Please apply the migration: 20260101000000_create_onboarding_sessions_and_email_verification.sql"
            : undefined
        }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        sessionId: data.id,
        resumeToken,
        status: data.status,
        createdAt: data.created_at,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("Unhandled error in create-onboarding-session:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

