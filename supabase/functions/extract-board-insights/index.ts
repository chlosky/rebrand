import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  createServiceRoleClient,
  plottingProRequiredResponse,
  userHasActivePlottingPro,
} from "../_shared/requirePlottingPro.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createServiceRoleClient();
    const hasPro = await userHasActivePlottingPro(admin, userData.user.id);
    if (!hasPro) {
      return plottingProRequiredResponse(corsHeaders);
    }

    const { board_id } = await req.json();
    if (!board_id) {
      return new Response(JSON.stringify({ error: "board_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: board, error: boardErr } = await supabase
      .from("boards")
      .select("id, title, role, layout_json")
      .eq("id", board_id)
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (boardErr || !board) {
      return new Response(JSON.stringify({ error: "Board not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const objects = (board.layout_json as { objects?: { type?: string; text?: string }[] })?.objects ?? [];
    const textSnippets = objects
      .map((o) => (typeof o.text === "string" ? o.text : ""))
      .filter((t) => t.trim().length > 2)
      .slice(0, 20);

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey || textSnippets.length === 0) {
      return new Response(
        JSON.stringify({
          themes: [],
          reminders: textSnippets.slice(0, 3).map((t) => ({
            title: t.slice(0, 80),
            remind_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const prompt = `You help users organize vision boards. From these board text elements, extract:
1) up to 3 core themes (short phrases)
2) up to 5 actionable reminders for a plan board (title only, imperative)

Board: ${board.title} (${board.role})
Texts:
${textSnippets.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Reply JSON only: {"themes":["..."],"reminders":[{"title":"..."}]}`;

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You return valid JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      }),
    });

    if (!aiRes.ok) {
      throw new Error("AI request failed");
    }

    const aiJson = await aiRes.json();
    const content = aiJson.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content.replace(/```json|```/g, "").trim());

    const reminders = (parsed.reminders ?? []).map((r: { title: string }) => ({
      title: r.title,
      remind_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }));

    return new Response(JSON.stringify({ themes: parsed.themes ?? [], reminders }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "extract failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
