import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  console.log(`[send-password-reset] ${req.method} request received`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("[send-password-reset] Handling OPTIONS preflight");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[send-password-reset] Starting password reset flow");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const POSTMARK_SERVER_TOKEN = Deno.env.get("POSTMARK_SERVER_TOKEN");
    const POSTMARK_FROM_EMAIL = Deno.env.get("POSTMARK_FROM_EMAIL");

    if (!POSTMARK_SERVER_TOKEN) {
      console.error("[send-password-reset] Postmark server token not configured");
      throw new Error("Postmark server token not configured");
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    console.log("[send-password-reset] Request body:", { email: body.email ? "***" : "missing" });
    
    const { email } = body;
    if (!email) {
      console.error("[send-password-reset] Email is required");
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!normalizedEmail.includes("@")) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Single admin call — resolves by email in Auth (no paginated listUsers scan).
    console.log("[send-password-reset] Generating recovery link via generateLink");
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: normalizedEmail,
    });

    const errMsg = String(resetError?.message ?? "").toLowerCase();
    const userMissing =
      !!resetError &&
      (errMsg.includes("not found") ||
        errMsg.includes("no user") ||
        errMsg.includes("does not exist") ||
        errMsg.includes("user not registered") ||
        errMsg.includes("email address is not registered"));

    if (userMissing || !resetData?.properties?.action_link) {
      if (resetError && !userMissing) {
        console.error("[send-password-reset] Error generating reset link:", resetError);
        return new Response(JSON.stringify({ error: "Failed to generate reset link" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("[send-password-reset] User not found or no link (returning success for security)");
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (resetError) {
      console.error("[send-password-reset] Error generating reset link:", resetError);
      return new Response(JSON.stringify({ error: "Failed to generate reset link" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = resetData.user;
    const userEmail = user?.email ?? normalizedEmail;
    const userId = user?.id ?? null;
    console.log("[send-password-reset] Recovery link ready for user:", userId ?? "(no id)");

    console.log("[send-password-reset] Reset data:", JSON.stringify(resetData, null, 2));
    
    // Get site URL for reset link and template fetching (use SITE_URL env var or fallback to production)
    const envSiteUrl = Deno.env.get("SITE_URL");
    const siteUrl = envSiteUrl || "https://paletteplot.com";
    console.log("[send-password-reset] Site URL:", siteUrl, "(from env:", envSiteUrl, ")");

    // Use Supabase's action_link and modify redirect_to to point to our reset password page
    // The action_link goes through Supabase's auth endpoint which exchanges the token for a JWT
    const recoveryUrl = resetData.properties.action_link;
    console.log("[send-password-reset] Recovery URL from Supabase:", recoveryUrl);
    
    // Parse the action_link and update the redirect_to parameter
    // IMPORTANT: The redirect_to URL must be whitelisted in Supabase Dashboard:
    // Authentication → URL Configuration → Redirect URLs
    // Add both: https://paletteplot.com/reset-password and https://paletteplot.com/reset-password
    let resetUrl: string;
    try {
      const url = new URL(recoveryUrl);
      // Use www version for consistency (make sure both are whitelisted in Supabase)
      url.searchParams.set("redirect_to", `${siteUrl}/reset-password`);
      resetUrl = url.toString();
      console.log("[send-password-reset] Reset URL created:", resetUrl.replace(/token=[^&]+/, "token=***"));
    } catch (urlError) {
      console.error("[send-password-reset] Error parsing recovery URL:", urlError);
      return new Response(JSON.stringify({ error: "Failed to parse reset link" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's name from profile if available
    let profile: { first_name: string | null; username: string | null } | null = null;
    if (userId) {
      const { data } = await supabase
        .from("profiles")
        .select("first_name, username")
        .eq("id", userId)
        .single();
      profile = data;
    }

    const userName = profile?.first_name || profile?.username || "there";
    console.log("[send-password-reset] User name:", userName);

    // Prepare template variables for Postmark template
    const privacyPolicyUrl = `${siteUrl}/privacy`;
    const templateModel = {
      name: userName,
      reset_password_url: resetUrl,
      privacy_policy_url: privacyPolicyUrl,
      tiktok_url: "https://www.tiktok.com/@paletteplotting",
      youtube_url: "https://www.youtube.com/@paletteplotting",
      instagram_url: "https://www.instagram.com/paletteplotting",
    };

    // Send email via Postmark using server-side template
    console.log("[send-password-reset] Sending email via Postmark template to:", userEmail);
    console.log("[send-password-reset] Template alias: password-reset");
    console.log("[send-password-reset] Template model keys:", Object.keys(templateModel));
    
    const postmarkPayload: any = {
      To: userEmail,
      TemplateAlias: "password-reset",
      TemplateModel: templateModel,
      MessageStream: "outbound",
      Tag: "password-reset",
      Metadata: { email_type: "password_reset" },
    };
    
    // Only include From if POSTMARK_FROM_EMAIL is set
    if (POSTMARK_FROM_EMAIL) {
      postmarkPayload.From = POSTMARK_FROM_EMAIL;
    }
    
    const res = await fetch("https://api.postmarkapp.com/email/withTemplate", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": POSTMARK_SERVER_TOKEN,
      },
      body: JSON.stringify(postmarkPayload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      let err;
      try {
        err = JSON.parse(errorText);
      } catch {
        err = { Message: errorText, ErrorCode: res.status };
      }
      console.error("[send-password-reset] Postmark API error response:", {
        status: res.status,
        statusText: res.statusText,
        error: err,
        payload: { ...postmarkPayload, TemplateModel: "[redacted]" },
      });
      return new Response(JSON.stringify({ 
        error: "Failed to send reset email",
        details: err.Message || err.ErrorCode || "Unknown error"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const postmarkResponse = await res.json().catch(() => ({}));
    console.log("[send-password-reset] Email sent successfully:", postmarkResponse);
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[send-password-reset] Unhandled error:", e);
    console.error("[send-password-reset] Error stack:", e instanceof Error ? e.stack : "No stack");
    return new Response(JSON.stringify({ 
      error: "Internal error",
      details: e instanceof Error ? e.message : String(e)
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
