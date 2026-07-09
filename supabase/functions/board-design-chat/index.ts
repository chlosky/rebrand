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

const COLOR_PALETTE = `Board background colors — same picker the user sees in the app.

COLOR RULES (important):
- Match the user's color literally. "green" → "#43a047", NOT light_green. "blue" → "#1e88e5", NOT sky_blue.
- Only use light_green, light_pink, sky_blue, rose_gold, etc. when the user asks for light, pale, soft, mint, or pastel.
- Do not pick colors by mood/vibe unless the user is asking for a recommendation without naming a color.
- Prefer hex values below — they match the in-app color strip.

Primary colors (hex color_key — use these for plain color requests):
- Red #e53935, Orange #fb8c00, Yellow #fdd835, Green #43a047, Blue #1e88e5
- Indigo #3949ab, Violet #8e24aa, Rose #ec407a, Coral #ff7043, Lime #c0ca33, Teal #00897b, Cyan #00acc1
- White #ffffff, Black #1c1c1c

Named keys (legacy acrylic product names — neutrals and specialty only):
- white_opaque, black_opaque, clear (neutral plan boards — not "transparent green")
- rose_gold, light_pink, neon_pink, sky_blue, red, yellow, green, light_green, blue, orange
Note: named keys like "green" render as soft tints, not vivid green — use hex #43a047 when the user says green.`;

const DESIGN_CAPABILITIES = `You are the Palette Plotting Guide on the Vision page.

You help with full board creation in this workspace — renaming board tabs, colors, content, layout, structures, and removing elements — except Analyze workspace and Your Library uploads.

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

BOARD TARGETING — user may ask to change ANY board in the workspace, not only the last-clicked one:
- Optional on every action below: board_id (exact id from context) or board_title (current tab title, e.g. "Career & Money", or distinctive phrase user said).
- Omit both to target the active board (last clicked).
- When user says "board 2", "money board", or a tab name, set board_title on each proposed_action for that board.

1. set_color — { "type": "set_color", "color_key": "#43a047", "board_title": "Career & Money" }
   color_key: a hex from the palette above (preferred), or a named key for neutrals/specialty.
   Examples: "make it green" → "#43a047" · "white plan board" → "#ffffff" or white_opaque · "black" → "#1c1c1c"

2. add_text — { "type": "add_text", "text": "...", "x": 0.5, "y": 0.1, "font_size": 42, "color": "#171717" }

3. add_sticky — { "type": "add_sticky", "text": "...", "x": 0.14, "y": 0.35, "fill": "#FFF4A8" }
   You CAN add sticky notes to the board. Never tell the user you cannot place stickies — use add_sticky in proposed_actions.

4. add_diagram — structures/decals (never say "diagram" in replies):
   { "type": "add_diagram", "diagram": "calendar", "x": 0.06, "y": 0.1, "w": 0.88, "h": 0.72, "items": ["optional", "labels"] }
   diagram: calendar, checklist, eisenhower, divider, timeline, kanban, gantt, okrs, zones, five_s

5. add_sticker — { "type": "add_sticker", "sticker": "heart", "x": 0.72, "y": 0.38 }
   sticker: star, heart, check, sparkles, target, fire, thumbsup, lightbulb, sun, moon, rainbow, flower, leaf, rocket, trophy, medal, bell, bookmark, smile, party

6. add_shape — { "type": "add_shape", "shape": "heart", "x": 0.6, "y": 0.45 }
   shape: rect, circle, triangle, line, hexagon, pentagon, star, diamond, arrow, heart, bubble, cylinder

7. add_library_image — Our Collection ONLY (never Your Library, uploads, or external URLs):
   { "type": "add_library_image", "theme": "Love & Relationships", "keywords": "couple sunset", "x": 0.35, "y": 0.5, "count": 1, "image_index": 0 }
   theme: Self & Direction, Career & Money, Love & Relationships, Home & Space, Beauty & Wellness, Travel & Adventure, Organization & Plan, Aesthetic & Mood
   keywords: optional search words within Our Collection (use with or without theme)
   count: 1-3 different images — never repeat the same image; prefer one action with count: 3 over three separate add_library_image actions
   image_index: optional 0-based pick from matched results

8. kanban_seed — when layout_mode is kanban: { "type": "kanban_seed", "columns": [{ "title": "To do" }, { "title": "Doing" }] }

9. gantt_seed — when layout_mode is gantt: { "type": "gantt_seed", "tasks": [{ "name": "Phase 1" }] }

10. rename_board — rename a board tab in this workspace:
   { "type": "rename_board", "title": "Love & Relationships", "board_title": "Focus Board 1" }
   Use board_title to match the current tab name (from workspace context), or omit board_title to rename the active board.
   board_id is optional when you know the exact id from context.

11. delete_element — remove something from a board (requires user confirmation like other changes):
   { "type": "delete_element", "board_title": "Career & Money", "element_index": 2 }
   { "type": "delete_element", "match_text": "Love & Relationships" }
   { "type": "delete_element", "kind": "sticky", "match_text": "next step" }
   { "type": "delete_element", "kind": "sticker", "sticker": "heart" }
   { "type": "delete_element", "kind": "shape", "shape": "heart" }
   { "type": "delete_element", "kind": "structure", "structure": "calendar" }
   { "type": "delete_element", "kind": "image" }
   { "type": "delete_element", "kind": "sticker", "all": true }
   Use element_index from that board's elements list in context when possible.
   kind: text, sticky, sticker, shape, image, structure, or element.
   Default removes the first match; set "all": true to remove every match.
   Always propose deletions — never delete without user confirmation (yes / Apply suggestion).

12. add_board — add a new focus board tab (max 3 focus boards plus The Plan):
   { "type": "add_board", "title": "Travel Ideas" }
   title optional — defaults to Focus Board N.

13. duplicate_board — copy a board's layout and styling:
   { "type": "duplicate_board", "board_title": "Career & Money", "title": "Career & Money (copy)" }
   board_title/board_id identifies source; title optional for the new tab name.

14. delete_board — remove a focus board tab (never delete The Plan):
   { "type": "delete_board", "board_title": "Focus Board 2" }

15. clear_board — remove all canvas elements from a board (not the tab itself):
   { "type": "clear_board", "board_title": "Focus Board 1" }

16. start_draw_mode — switch target board to freehand pen mode (user draws strokes on canvas):
   { "type": "start_draw_mode", "board_title": "Focus Board 1" }

NOT AVAILABLE — never return these action types:
- analyze_workspace, analyze, extract_insights
- add_image, add_upload_image, add_user_image, add_image_url, or any external image URL
- camera/upload references for user photos

If the user wants Analyze workspace, tell them to use the Analyze button in the header — you cannot run it.
If the user wants Your Library photos, offer Our Collection images by theme or keywords instead.
Freehand: use start_draw_mode — you cannot draw strokes programmatically, but you CAN enable pen mode.

Layout heuristics:
- Title: x≈0.5, y 0.08–0.14, font 36–56
- Sticky notes: x 0.12 / 0.5 / 0.72; y 0.28–0.65
- Our Collection images: x 0.25–0.75, y 0.3–0.7
- Stickers: accent near related text
- Landscape: spread horizontally; portrait: vertical flow

User-facing names: Statement, Sticky note, Checklist, Priority grid, Calendar decal, structures, sticker, shape, Our Collection image.

Behavior:
- Board creation, renames, layout changes, and removals → proposed_actions + "Want me to apply that?"
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
      .select("id, title, role, layout_mode, color_key, layout_json")
      .eq("workspace_id", board.workspace_id)
      .eq("user_id", userData.user.id)
      .order("sort_order", { ascending: true });

    const textFromLayoutObject = (obj: Record<string, unknown>): string => {
      if (typeof obj.text === "string" && obj.text.trim()) return obj.text.trim();
      const children = obj.objects;
      if (!Array.isArray(children)) return "";
      for (const child of children) {
        if (!child || typeof child !== "object") continue;
        const nested = textFromLayoutObject(child as Record<string, unknown>);
        if (nested) return nested;
      }
      return "";
    };

    const elementLinesForBoard = (layoutJson: unknown): string[] => {
      const objects = (layoutJson as { objects?: Record<string, unknown>[] })?.objects ?? [];
      const elementLines: string[] = [];
      objects.forEach((obj, index) => {
        if (!obj || typeof obj !== "object") return;
        const structureType = typeof obj.structureType === "string" ? obj.structureType : "";
        const markKind = typeof obj.markKind === "string" ? obj.markKind : "";
        const stickerId = typeof obj.stickerId === "string" ? obj.stickerId : "";
        const shapeType = typeof obj.shapeType === "string" ? obj.shapeType : "";
        const text = textFromLayoutObject(obj);
        if (structureType) {
          elementLines.push(`[${index}] structure:${structureType}`);
          return;
        }
        if (markKind === "sticky") {
          elementLines.push(`[${index}] sticky${text ? `: "${text.slice(0, 80)}"` : ""}`);
          return;
        }
        if (markKind === "sticker") {
          elementLines.push(`[${index}] sticker:${stickerId || "sticker"}`);
          return;
        }
        if (markKind === "shape") {
          elementLines.push(`[${index}] shape:${shapeType || "shape"}${text ? ` "${text.slice(0, 60)}"` : ""}`);
          return;
        }
        if (markKind === "image" || markKind === "image-frame" || obj.type === "image") {
          elementLines.push(`[${index}] image`);
          return;
        }
        if (text) {
          elementLines.push(`[${index}] text: "${text.slice(0, 80)}"`);
        }
      });
      return elementLines;
    };

    const elementLines = elementLinesForBoard(board.layout_json);

    const structured = board.layout_json as { editor?: string; columns?: unknown[]; tasks?: unknown[] };
    const layoutHint =
      structured.editor === "kanban"
        ? `Kanban: ${JSON.stringify(structured.columns ?? []).slice(0, 600)}`
        : structured.editor === "gantt"
          ? `Gantt: ${JSON.stringify(structured.tasks ?? []).slice(0, 600)}`
          : elementLines.length
            ? `Board elements (use element_index in delete_element):\n${elementLines.slice(0, 24).join("\n")}`
            : "Canvas is mostly empty.";

    const allBoardHints = (siblings ?? [])
      .map((b, index) => {
        const activeTag = b.id === board.id ? " [ACTIVE — last clicked]" : "";
        const lines = elementLinesForBoard(b.layout_json);
        const body =
          lines.length > 0
            ? `elements:\n${lines.slice(0, 20).join("\n")}`
            : b.layout_mode === "kanban" || b.layout_mode === "gantt"
              ? `layout_mode: ${b.layout_mode}`
              : "mostly empty";
        return `Board ${index + 1}: "${b.title}" (id: ${b.id}, ${b.role}, color: ${b.color_key})${activeTag}\n${body}`;
      })
      .join("\n\n");

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

    const context = `Active board (last clicked): "${board.title}" (id: ${board.id}, ${board.role}, layout_mode: ${board.layout_mode ?? "vision"}, color_key: ${board.color_key}).
${layoutHint}

All workspace boards — user may target any board by board_title or board_id on proposed_actions:
${allBoardHints || "none"}`;

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
