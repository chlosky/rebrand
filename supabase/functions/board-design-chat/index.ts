import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  createServiceRoleClient,
  plottingProRequiredResponse,
  userHasActivePlottingPro,
} from "../_shared/requirePlottingPro.ts";

import {
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

function hasElementTargetFields(a: Record<string, unknown>): boolean {
  if (typeof a.element_index === "number" && Number.isFinite(a.element_index)) return true;
  if (typeof a.match_text === "string" && a.match_text.trim().length > 0) return true;
  if (typeof a.kind === "string" && a.kind.trim().length > 0) return true;
  return false;
}

function normalizeProposedAction(raw: Record<string, unknown>): Record<string, unknown> {
  let type = raw.type;
  if (type === "frame_image" || type === "frame_element" || type === "apply_frame" || type === "image_frame") {
    type = "style_element";
  }
  if (type === "duplicate_element" || type === "copy") {
    type = "copy_element";
  }

  const normalized: Record<string, unknown> = { ...raw, type };

  if (typeof normalized.theme === "string" && normalized.theme === "Affixements") {
    normalized.theme = "Affixments";
  }

  if (type === "style_element") {
    if (!normalized.frame && typeof normalized.frame_shape === "string") {
      normalized.frame = normalized.frame_shape;
    }
    if (!normalized.frame && typeof normalized.frame_type === "string") {
      normalized.frame = normalized.frame_type;
    }
    const frameRaw = typeof normalized.frame === "string" ? normalized.frame.trim().toLowerCase() : "";
    const frameToken = normalizeFrameToken(frameRaw || normalized.frame);
    if (frameToken) normalized.frame = frameToken;
    else if (normalized.frame) delete normalized.frame;

    const imageStyle =
      typeof normalized.frame === "string" ||
      normalized.round === true ||
      normalized.round === false ||
      normalized.round === "toggle";

    if (imageStyle && !hasElementTargetFields(normalized)) {
      normalized.kind = "image";
    }
    if (normalized.all === true || normalized.target_all === true) {
      normalized.all = true;
    }
  }

  return normalized;
}

function normalizeProposedActions(actions: unknown[]): unknown[] {
  return actions
    .filter((action) => action && typeof action === "object")
    .map((action) => normalizeProposedAction(action as Record<string, unknown>));
}

const IMAGE_FRAME_TOKENS = new Set(["photo", "rect", "circle", "heart", "star", "hexagon", "diamond"]);

function normalizeFrameToken(frame: unknown): string | undefined {
  if (typeof frame !== "string") return undefined;
  const raw = frame.trim().toLowerCase();
  if (!raw) return undefined;
  if (raw.includes("polaroid") || raw.includes("photo")) return "photo";
  if (raw.includes("square") || raw.includes("rectangle")) return "rect";
  if (IMAGE_FRAME_TOKENS.has(raw)) return raw;
  for (const token of IMAGE_FRAME_TOKENS) {
    if (raw.includes(token)) return token;
  }
  return undefined;
}

function styleElementLooksValid(a: Record<string, unknown>): boolean {
  const frame = normalizeFrameToken(a.frame);
  if (frame) a.frame = frame;
  const hasStyle =
    !!frame ||
    a.round === true ||
    a.round === false ||
    a.round === "toggle" ||
    (typeof a.color === "string" && a.color.trim().length > 0) ||
    a.dash === true ||
    a.dash === false ||
    a.dash === "toggle";
  return hasStyle && hasElementTargetFields(a);
}

function repairProposedActions(
  userMessage: string,
  reply: string,
  actions: unknown[],
  history: { role: string; content: string }[] = [],
): unknown[] {
  const normalized = normalizeProposedActions(actions).map((action) => {
    const record = action as Record<string, unknown>;
    if (record.type === "style_element" && !hasElementTargetFields(record)) {
      record.kind = "image";
    }
    if (record.type === "style_element") {
      normalizeFrameToken(record.frame);
      if (typeof record.frame === "string") {
        const frame = normalizeFrameToken(record.frame);
        if (frame) record.frame = frame;
        else delete record.frame;
      }
    }
    return record;
  });

  const usable = normalized.filter((action) => {
    const record = action as Record<string, unknown>;
    if (record.type !== "style_element") return true;
    return styleElementLooksValid(record);
  });
  if (usable.length > 0) return usable;

  const contextHay = [
    ...history.slice(-6).map((turn) => turn.content),
    userMessage,
    reply,
  ]
    .join("\n")
    .toLowerCase();

  const offersApply =
    /want me to apply|want me to apply that|shall i apply|should i apply|i can apply|i'll apply|i will apply/i.test(
      reply,
    );
  if (!offersApply) return normalized;

  const wantsFrame =
    /\b(frame|framed|framing|polaroid|photo frame|photo style)\b/.test(contextHay) &&
    (/\b(image|images|photo|photos|picture|pictures|them|these|those)\b/.test(contextHay) ||
      /\bframe them\b/.test(contextHay));

  if (!wantsFrame) return normalized;

  const action: Record<string, unknown> = {
    type: "style_element",
    kind: "image",
    frame: "photo",
    all: true,
  };
  const boardMatch =
    reply.match(/\bon the\s+(.+?)\s+board\b/i) ??
    reply.match(/\bto the\s+(.+?)\s+board\b/i) ??
    reply.match(/\bfor the\s+(.+?)\s+board\b/i) ??
    contextHay.match(/\bon the\s+(.+?)\s+board\b/i);
  if (boardMatch?.[1]) action.board_title = boardMatch[1].trim();

  return [action];
}

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

const DESIGN_CAPABILITIES = `You are the palette plotting AI Guide on the Vision page.

You help with the Vision canvas: board titles, colors, marks, text, sticky notes, collection images, Found Objects, Affixments, image frame/round/recolor (style_element), shapes, stickers, freehand drawing, digital decals/structures, layout composition, and removing elements.
You understand Projects, Start New Set, Portrait set, Landscape set, Vision, Action, board orientation, curated image catalogs vs Your Library uploads, Analyze workspace, Focus / Plan / Action, Calendar, Email, Text, calendar export/iCal, email reminders, text reminders, SMS limits/consent, and Finalize plan, but you must respect the Vision page boundary.

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
- If your reply offers to apply a change ("Want me to apply that?"), proposed_actions MUST contain the matching action objects — never an empty proposed_actions array.
- Summarize what you plan to do and ask "Want me to apply that?"
- Never say you added, placed, changed, or created something unless actions were actually applied.
- For category requests (love, career, home, etc.), propose concrete board content and insert actions when possible.
- Even for direct commands, prefer a confirmation step unless it is a tiny harmless edit.
- If no action is applied, say "I can do that. Want me to apply it?"

PRODUCT LANGUAGE:
- Use Vision, Action, Projects, Start New Set, Portrait set, Landscape set, board, workspace, marks, structures, digital decals, Focus, Plan, Action, Calendar, Email, Text.
- Do not rename Focus, Plan, or Action. Do not call Action "Next steps".
- Do not rename structures to "layouts" in AI behavior. User-facing tabs may say Layouts if already present, but you understand them as digital decals/structures.
- Say Calendar decal, Numbered list decal, Checkbox decal, Bullet decal, Divider decal.
- Do not mention Canva.
- Do not touch speech-to-text/dictation behavior. Do not call it text-to-speech.

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

4. add_diagram — digital decals / structures (never say "diagram" in replies):
   { "type": "add_diagram", "diagram": "calendar", "x": 0.06, "y": 0.1, "w": 0.88, "h": 0.72, "items": ["optional", "labels"] }
   diagram (ONLY these — no kanban, gantt, timeline, OKRs, Eisenhower, zones, or priority grid):
   calendar, numbered_list, divider, checkbox, bullet
   Calendar = month grid users can mark dates on. Numbered list = editable numbered rows. Checkbox = single toggle box. Bullet = list marker dot. Divider = horizontal line.

5. add_sticker — { "type": "add_sticker", "sticker": "heart", "x": 0.72, "y": 0.38 }
   sticker: star, heart, check, sparkles, target, fire, thumbsup, lightbulb, sun, moon, rainbow, flower, leaf, rocket, trophy, medal, bell, bookmark, smile, party

6. add_shape — { "type": "add_shape", "shape": "heart", "x": 0.6, "y": 0.45 }
   shape: rect, circle, triangle, line, hexagon, pentagon, star, diamond, arrow, heart, bubble, cylinder
   Decorative shapes only — NEVER use add_shape to frame, border, or wrap images. Image frames use style_element (item 15).

7. add_library_image — place from curated catalogs only (Our Collection, Found Objects, or Affixments — NOT user uploads from Your Library):
   { "type": "add_library_image", "theme": "Love & Relationships", "keywords": "couple sunset", "x": 0.35, "y": 0.5, "count": 1, "image_index": 0 }
   Curated catalogs are read-only app assets — safe to add and safe to remove from the board canvas (delete_element kind:image). Never imply catalog images were deleted from the app or from the user's Your Library.
   theme (exact theme string for add_library_image):
   - Our Collection themes: Self & Direction, Career & Money, Love & Relationships, Home & Space, Beauty & Wellness, Travel & Adventure, Organization & Plan, Aesthetic & Mood
   - Found Objects (theme must be "Found Objects"): pressed flowers, sunflower, roses, bay leaf, lavender, blank check, ticket, map fragment, gift, diamond — use keywords for the specific object
   - Affixments (theme must be "Affixments"): magnets, binder clips, washi tape — keywords like magnet gold, binder clip silver, tape pink
   keywords: optional search words within the chosen theme (required for specific Found Object or Affixment picks)
   count: 1-3 different images — never repeat the same image; prefer one action with count: 3 over three separate add_library_image actions
   image_index: optional 0-based pick from matched results
   Use Found Objects for symbolic collage pieces; Affixments to suggest pinning/taping items on the board. If nothing matches, tell the user what to upload or search for.

8. rename_board — rename a board tab in this workspace:
   { "type": "rename_board", "title": "Love & Relationships", "board_title": "Focus Board 1" }
   Use board_title to match the current tab name (from workspace context), or omit board_title to rename the active board.
   board_id is optional when you know the exact id from context.

9. delete_element — remove something from a board (requires user confirmation like other changes):
   { "type": "delete_element", "board_title": "Career & Money", "element_index": 2 }
   { "type": "delete_element", "match_text": "Love & Relationships" }
   { "type": "delete_element", "kind": "sticky", "match_text": "next step" }
   { "type": "delete_element", "kind": "sticker", "sticker": "heart" }
   { "type": "delete_element", "kind": "shape", "shape": "heart" }
   { "type": "delete_element", "kind": "structure", "structure": "calendar" }
   { "type": "delete_element", "kind": "image" }
   Removing an image from the board deletes only that canvas element — never Our Collection, Affixments, Found Objects catalog files, and never the user's upload file in Your Library unless they delete it in the workspace.
   { "type": "delete_element", "kind": "sticker", "all": true }
   Use element_index from that board's elements list in context when possible.
   kind: text, sticky, sticker, shape, image, structure, or element.
   Default removes the first match; set "all": true to remove every match.
   Always propose deletions — never delete without user confirmation (yes / Apply suggestion).

10. add_board — add a new user-created focus board tab:
   { "type": "add_board", "title": "Travel Ideas" }
   title optional — defaults to Focus Board N.

11. duplicate_board — copy a board's layout and styling:
   { "type": "duplicate_board", "board_title": "Career & Money", "title": "Career & Money (copy)" }
   board_title/board_id identifies source; title optional for the new tab name.

12. delete_board — remove a focus board tab (never delete The Plan):
   { "type": "delete_board", "board_title": "Focus Board 2" }

13. clear_board — remove all canvas elements from a board (not the tab itself):
   { "type": "clear_board", "board_title": "Focus Board 1" }

14. start_draw_mode — switch target board to freehand pen mode (user draws strokes on canvas):
   { "type": "start_draw_mode", "board_title": "Focus Board 1" }

15. style_element — same radial-menu styling as long-press on an element (frame, round corners, recolor, dash, text size/font/align):
   Target with element_index, match_text, and/or kind (same as delete_element). Default first match; "all": true for every match.
   For image frame/round requests, ALWAYS include kind:"image" plus frame or round in proposed_actions.
   { "type": "style_element", "kind": "image", "frame": "photo" }
   { "type": "style_element", "kind": "image", "all": true, "frame": "photo" }
   { "type": "style_element", "kind": "image", "round": true }
   { "type": "style_element", "element_index": 3, "frame": "heart" }
   frame (images only): photo, rect, circle, heart, star, hexagon, diamond
   round: true (rounded corners), false (square), or "toggle"
   color: hex fill/stroke recolor (text, sticky, shape, line, structure accents)
   dash: true, false, or "toggle" (lines, dividers, freehand strokes)
   font_size: S, M, L, XL (text elements)
   text_align: left, center, right
   font: sans, serif, garamond, display, script
   Image frame requests → style_element with frame (photo, rect, circle, heart, star, hexagon, diamond). Same native Frame button as long-press on an image.
   NEVER use add_shape or add_sticker for framing. NEVER say "shapes around the images" or similar workarounds in reply text.

16. copy_element — duplicate a matched element (same targeting as delete_element):
   { "type": "copy_element", "kind": "sticky", "match_text": "next step" }
   { "type": "copy_element", "element_index": 2 }

NOT AVAILABLE — never return these action types or structures:
- analyze_workspace, analyze, extract_insights
- kanban_seed, gantt_seed, or any kanban/gantt/timeline/OKR/Eisenhower/zones layout mode
- unsupported external image URL actions
If the user asks for kanban or gantt, offer Calendar, Numbered list, or sticky notes instead.

If the user wants Analyze workspace, tell them to use the Analyze button in the header — you cannot run it.
If the user wants images, add/place them when supported by available app image context; otherwise explain what to upload or search for.
Freehand: use start_draw_mode — you cannot draw strokes programmatically, but you CAN enable pen mode.

Layout heuristics:
- Title: x≈0.5, y 0.08–0.14, font 36–56, center aligned when possible
- Sticky notes: x 0.12 / 0.5 / 0.72; y 0.28–0.65; avoid stacking or covering key images
- Calendar decal: landscape x 0.06, y 0.10, w 0.88, h 0.72; portrait x 0.08, y 0.16, w 0.84, h 0.58
- Numbered list: medium size unless user asks for full board
- Images / Found Objects / Affixments: x 0.25–0.75, y 0.3–0.7; use corners/sides for several items and leave room for text; place Affixments near what they would “hold”
- Stickers: accent near related text
- Landscape: wider horizontal composition, left/right zones, avoid tall stacked composition
- Portrait: vertical composition, title/top, visual center, notes/actions lower

User-facing names: Statement, Sticky note, Numbered list, Checkbox, Bullet, Calendar decal, Divider decal, Found Object, Affixment, sticker, shape, image, Frame (style_element on images).

Behavior:
- Board creation, renames, layout changes, and removals → proposed_actions + "Want me to apply that?"
- Meta questions (company, code, other users, AI model) → scope redirect, no actions
- Keep replies short and practical. No therapy-style language, fake testimonials, vague corporate language, or unsupported goals/dates/images.

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

    const layoutHint =
      elementLines.length > 0
        ? `Board elements (use element_index in delete_element, style_element, copy_element):\n${elementLines.slice(0, 24).join("\n")}`
        : "Canvas is mostly empty.";

    const allBoardHints = (siblings ?? [])
      .map((b, index) => {
        const activeTag = b.id === board.id ? " [ACTIVE — last clicked]" : "";
        const lines = elementLinesForBoard(b.layout_json);
        const body =
          lines.length > 0
            ? `elements:\n${lines.slice(0, 20).join("\n")}`
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

    let finalRes = aiRes;
    if (!finalRes.ok) {
      const errText = await finalRes.text().catch(() => "");
      console.error("board-design-chat OpenAI json mode error:", finalRes.status, errText.slice(0, 800));
      finalRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.4,
        }),
      });
    }

    if (!finalRes.ok) {
      const errText = await finalRes.text().catch(() => "");
      console.error("board-design-chat OpenAI error:", finalRes.status, errText.slice(0, 800));
      return new Response(
        JSON.stringify({
          error: "Guide could not respond right now.",
          actions: [],
          proposed_actions: [],
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiJson = await finalRes.json();
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

    const reply = typeof parsed.reply === "string" ? parsed.reply.trim() : "";
    if (!reply) {
      return new Response(
        JSON.stringify({
          error: "Guide returned an empty reply.",
          actions: [],
          proposed_actions: [],
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const reply_without_action =
      typeof parsed.reply_without_action === "string" && parsed.reply_without_action.trim()
        ? parsed.reply_without_action.trim()
        : undefined;
    const mergedActions = [
      ...(Array.isArray(parsed.proposed_actions) ? parsed.proposed_actions.slice(0, 14) : []),
      ...(Array.isArray(parsed.actions) ? parsed.actions.slice(0, 14) : []),
    ];
    const proposed_actions = repairProposedActions(message, reply, mergedActions, history);
    const actions: unknown[] = [];

    return new Response(JSON.stringify({ reply, reply_without_action, actions, proposed_actions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("board-design-chat error:", e);
    return new Response(
      JSON.stringify({
        error: "Guide hit a snag. Try again in a moment.",
        actions: [],
        proposed_actions: [],
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
