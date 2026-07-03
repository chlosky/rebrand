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

type ChatTurn = { role: "user" | "assistant"; content: string };

const COLOR_PALETTE = `Palette Plotting board colors (pick color_key for board background vibe):
- rose_gold (#F5E1E3) — warmth, romance, self-love, gentle ambition
- light_pink (#FDE8F0) — soft, nurturing, feminine calm
- neon_pink (#FFE0F0) — bold energy, confidence, playful drive
- sky_blue (#E3F4FC) — clarity, calm focus, open sky thinking
- red (#FCE4E6) — urgency, passion, decisive action
- yellow (#FFF8DC) — optimism, creativity, morning energy
- green (#E0F5EA) — growth, health, steady progress
- light_green (#EDFCEB) — fresh starts, nature, ease
- blue (#E0EBFF) — professionalism, trust, deep work
- orange (#FFE8D6) — enthusiasm, social warmth, momentum
- clear (#FAFAFA) — minimal, neutral canvas
- white_opaque (#FFFFFF) — clean plan board, structure
- black_opaque (#F5F5F5) — contrast, sophistication, editorial`;

const SYSTEM = `You are the board-design companion for Palette Plotting — warm, emotionally attuned, and practical. You help users build vision boards, home org boards, moodboards, kanban, and gantt boards.

You MUST respond with valid JSON only:
{
  "reply": "Short warm message (under 100 words) explaining what you placed and why the colors/vibe fit their goal",
  "actions": [ ...0-12 actions... ]
}

Action types (use normalized coords 0-1 for x,y,w,h on a 1080×1350 artboard):

1. set_color — change board background vibe
   { "type": "set_color", "color_key": "sky_blue" }

2. add_text — headline or label on canvas boards (vision, checklist scaffold, gallery)
   { "type": "add_text", "text": "Calm mornings", "x": 0.5, "y": 0.1, "font_size": 44, "color": "#171717" }

3. add_sticky — sticky note; use hex fill for emotional color accents
   { "type": "add_sticky", "text": "Sunday reset", "x": 0.12, "y": 0.35, "fill": "#FFF9C4" }

4. add_diagram — overlay diagram scaffold user can rearrange
   diagram: "eisenhower" | "checklist" | "zones" | "timeline"
   { "type": "add_diagram", "diagram": "eisenhower", "x": 0.52, "y": 0.52, "w": 0.42, "h": 0.38, "items": ["Do first","Schedule","Delegate","Drop"], "accent": "#2563EB" }

5. kanban_seed — ONLY when board layout_mode is kanban
   { "type": "kanban_seed", "columns": [{ "title": "Backlog", "cards": ["Task A"] }, { "title": "Doing", "cards": [] }] }

6. gantt_seed — ONLY when board layout_mode is gantt
   { "type": "gantt_seed", "tasks": [{ "name": "Phase 1", "start": 5, "width": 35 }] }

Rules:
- When user shares feelings, goals, or vibe — pick a color_key that matches AND place 2-6 concrete items (text, stickies, or a diagram).
- Prefer add_diagram for planning/priority/home-zone requests on vision boards.
- Use hex accent colors on stickies/diagrams that harmonize with the board color_key fill.
- Do NOT use kanban_seed/gantt_seed unless layout_mode matches.
- On mostly empty boards, place a hero text + diagram or stickies — Canva-style composition.
- Never mention subliminals, mirror work, or therapy.
- If user only wants to chat without placement, return empty actions array.

${COLOR_PALETTE}`;

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

    const body = await req.json();
    const board_id = body.board_id as string | undefined;
    const message = (body.message as string | undefined)?.trim();
    const history = (Array.isArray(body.history) ? body.history : []) as ChatTurn[];

    if (!board_id || !message) {
      return new Response(JSON.stringify({ error: "board_id and message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: board, error: boardErr } = await supabase
      .from("boards")
      .select("id, title, role, layout_mode, layout_json, color_key, workspace_id")
      .eq("id", board_id)
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (boardErr || !board) {
      return new Response(JSON.stringify({ error: "Board not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: siblings } = await supabase
      .from("boards")
      .select("title, role, layout_mode, color_key")
      .eq("workspace_id", board.workspace_id)
      .eq("user_id", userData.user.id)
      .order("sort_order", { ascending: true });

    const objects = (board.layout_json as { objects?: { type?: string; text?: string }[] })?.objects ?? [];
    const textSnippets = objects
      .map((o) => (typeof o.text === "string" ? o.text : ""))
      .filter((t) => t.trim().length > 1)
      .slice(0, 20);

    const structured = board.layout_json as { editor?: string; columns?: unknown[]; tasks?: unknown[] };
    const layoutHint =
      structured.editor === "kanban"
        ? `Kanban: ${JSON.stringify(structured.columns ?? []).slice(0, 600)}`
        : structured.editor === "gantt"
          ? `Gantt: ${JSON.stringify(structured.tasks ?? []).slice(0, 600)}`
          : textSnippets.length
            ? `Canvas text: ${textSnippets.join(" | ")}`
            : "Canvas is mostly empty.";

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({
          reply:
            "Tell me the vibe you're going for — calm, bold, cozy, focused — and I'll place labels, stickies, and a diagram on your board.",
          actions: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const context = `Active board: "${board.title}" (${board.role}, layout_mode: ${board.layout_mode ?? "vision"}, color_key: ${board.color_key}).
Workspace boards: ${(siblings ?? []).map((b) => `${b.title} [${b.color_key}/${b.layout_mode}]`).join(", ") || "none"}.
${layoutHint}`;

    const messages = [
      { role: "system", content: SYSTEM },
      { role: "user", content: `Board context:\n${context}` },
      ...history.slice(-8).map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.65,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      throw new Error("AI request failed");
    }

    const aiJson = await aiRes.json();
    const raw = aiJson.choices?.[0]?.message?.content?.trim() ?? "{}";
    let parsed: { reply?: string; actions?: unknown[] } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { reply: raw, actions: [] };
    }

    const reply =
      typeof parsed.reply === "string" && parsed.reply.trim()
        ? parsed.reply.trim()
        : "I added a few pieces to your board — tweak them anytime.";
    const actions = Array.isArray(parsed.actions) ? parsed.actions.slice(0, 14) : [];

    return new Response(JSON.stringify({ reply, actions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "chat failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
