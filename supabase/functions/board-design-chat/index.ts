import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  createServiceRoleClient,
  plottingProRequiredResponse,
  userHasActivePlottingPro,
} from "../_shared/requirePlottingPro.ts";

import {
  DEFAULT_BOARD_FALLBACK,
  PALETTE_GUIDE_EXAMPLES,
  PALETTE_GUIDE_SCOPE_LOCK,
  PALETTE_GUIDE_SYSTEM_PROMPT,
  screenBoardsUserInput,
} from "../_shared/boardsAiGuardrails.ts";

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

const DESIGN_CAPABILITIES = `You are the Palette Plotting Guide on the Vision page.

You help with everything on this board page except Analyze workspace and Your Library uploads.

You MUST respond with valid JSON only:
{
  "reply": "Short practical message (under 80 words)",
  "reply_without_action": "Optional — use when actions is empty and reply should not imply anything was added",
  "actions": [ ...usually empty — apply only after user confirmed... ],
  "proposed_actions": [ ...0-8 actions to suggest but NOT apply until user confirms... ]
}

DEFAULT BEHAVIOR:
- Put almost all board changes in "proposed_actions", NOT "actions".
- Return "actions": [] unless the user's latest message clearly confirms a pending proposal (yes, okay, do it, apply it, etc.).
- Summarize what you plan to do and ask "Want me to apply that?"
- Never say you added, placed, changed, or created something unless actions were actually applied.
- For category requests (love, career, home, etc.), propose concrete board content and insert actions when possible.

ALLOWED action types (normalized coords 0-1 on artboard):

1. set_color — { "type": "set_color", "color_key": "orange" }
   color_key: rose_gold, light_pink, neon_pink, sky_blue, red, yellow, green, light_green, blue, orange, clear, white_opaque, black_opaque

2. add_text — { "type": "add_text", "text": "...", "x": 0.5, "y": 0.1, "font_size": 42, "color": "#171717" }

3. add_sticky — { "type": "add_sticky", "text": "...", "x": 0.14, "y": 0.35, "fill": "#FFF4A8" }

4. add_diagram — structures/decals (never say "diagram" in replies):
   { "type": "add_diagram", "diagram": "calendar", "x": 0.06, "y": 0.1, "w": 0.88, "h": 0.72, "items": ["optional", "labels"] }
   diagram: calendar, checklist, eisenhower, divider, timeline, kanban, gantt, okrs, zones, five_s

5. add_sticker — { "type": "add_sticker", "sticker": "heart", "x": 0.72, "y": 0.38 }
   sticker: star, heart, check, sparkles, target, fire, thumbsup, lightbulb, sun, moon, rainbow, flower, leaf, rocket, trophy, medal, bell, bookmark, smile, party

6. add_shape — { "type": "add_shape", "shape": "heart", "x": 0.6, "y": 0.45 }
   shape: rect, circle, triangle, line, hexagon, pentagon, star, diamond, arrow, heart, bubble, cylinder

7. add_library_image — Our Collection ONLY (never Your Library, uploads, or external URLs):
   { "type": "add_library_image", "theme": "Love & Relationships", "x": 0.35, "y": 0.5, "count": 1 }
   theme: Self & Direction, Career & Money, Love & Relationships, Home & Space, Beauty & Wellness, Travel & Adventure, Organization & Plan, Aesthetic & Mood
   count: 1-3; offset positions when count > 1

8. kanban_seed — when layout_mode is kanban: { "type": "kanban_seed", "columns": [{ "title": "To do" }, { "title": "Doing" }] }

9. gantt_seed — when layout_mode is gantt: { "type": "gantt_seed", "tasks": [{ "name": "Phase 1" }] }

NOT AVAILABLE — never return these action types:
- analyze_workspace, analyze, extract_insights
- add_image, add_upload_image, add_user_image, add_image_url, or any external image URL
- draw, freehand, or camera/upload references

If the user wants Analyze workspace, tell them to use the Analyze button in the header — you cannot run it.
If the user wants Your Library photos, offer Our Collection images by theme instead.

Layout heuristics:
- Title: x≈0.5, y 0.08–0.14, font 36–56
- Sticky notes: x 0.12 / 0.5 / 0.72; y 0.28–0.65
- Our Collection images: x 0.25–0.75, y 0.3–0.7
- Stickers: accent near related text
- Landscape: spread horizontally; portrait: vertical flow

User-facing names: Statement, Sticky note, Checklist, Priority grid, Calendar decal, structures, sticker, shape, Our Collection image.

Behavior:
- Board creation and layout changes → proposed_actions + "Want me to apply that?"
- Meta questions (company, code, other users, AI model) → scope redirect, no actions
- Keep replies short and practical. No therapy language.

${COLOR_PALETTE}`;

const SYSTEM = `${PALETTE_GUIDE_SYSTEM_PROMPT}

${PALETTE_GUIDE_SCOPE_LOCK}

${DESIGN_CAPABILITIES}

${PALETTE_GUIDE_EXAMPLES}`;

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

    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
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

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
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

    const inputScreen = screenBoardsUserInput(message);
    if (!inputScreen.ok) {
      return new Response(JSON.stringify({ reply: inputScreen.reply, actions: [] }), {
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
          reply: "What would you like to add or change on this board?",
          actions: [],
          proposed_actions: [],
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
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      throw new Error("AI request failed");
    }

    const aiJson = await aiRes.json();
    const raw = aiJson.choices?.[0]?.message?.content?.trim() ?? "{}";
    let parsed: {
      reply?: string;
      reply_without_action?: string;
      actions?: unknown[];
      proposed_actions?: unknown[];
    } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { reply: raw, actions: [], proposed_actions: [] };
    }

    const reply =
      typeof parsed.reply === "string" && parsed.reply.trim()
        ? parsed.reply.trim()
        : DEFAULT_BOARD_FALLBACK;
    const reply_without_action =
      typeof parsed.reply_without_action === "string" && parsed.reply_without_action.trim()
        ? parsed.reply_without_action.trim()
        : undefined;
    const actions = Array.isArray(parsed.actions) ? parsed.actions.slice(0, 14) : [];
    const proposed_actions = Array.isArray(parsed.proposed_actions)
      ? parsed.proposed_actions.slice(0, 14)
      : [];

    return new Response(JSON.stringify({ reply, reply_without_action, actions, proposed_actions }), {
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
