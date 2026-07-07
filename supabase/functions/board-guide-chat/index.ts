import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  createServiceRoleClient,
  plottingProRequiredResponse,
  userHasActivePlottingPro,
} from "../_shared/requirePlottingPro.ts";
import {
  BOARDS_AI_SAFETY_POLICY,
  screenBoardsUserInput,
} from "../_shared/boardsAiGuardrails.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ChatTurn = { role: "user" | "assistant"; content: string };

const ACTION_CAPABILITIES = `You are the Palette Plotting Guide on the Action page.

Palette Action helps users turn their Vision workspace into Focus / Plan / Action rows and configure reminders.

Reminder types (exactly ONE per Action — not multi-select):
- Calendar = scheduled follow-through (iCal export after finalize; not sent by backend)
- Email = soft accountability (default)
- Text = stronger nudge (opt-in, phone required, max 70 chars, no emoji, no links, max 5 per day)

One Action = one reminder type. Different Actions can use different reminder types.
Never propose calendar+email, email+sms, or all three on the same Action.

You MUST respond with valid JSON only:
{
  "reply": "Short practical message (under 60 words)",
  "reply_without_action": "Optional — use when no changes should be implied",
  "actions": [],
  "proposed_actions": [ ...0-8 structured operations... ]
}

DEFAULT: return "actions": [] and put ALL edits in "proposed_actions".
Only return non-empty "actions" after the user clearly confirmed a pending proposal in the latest message.

Never say you updated, changed, removed, added, or finalized anything unless matching actions will be applied.

Action operation types (use real ids from action_map context):

1. add_action — { "type": "add_action", "plan_id": "...", "title": "...", "cadence": "weekly", "remind_day_of_week": "monday", "remind_time": "09:00", "reminder_type": "email", "channels": { "calendar": false, "email": true, "sms": false }, "sms_text": null }

2. update_action — { "type": "update_action", "action_id": "...", "patch": { "title": "...", "cadence": "weekly", "reminder_type": "email", "channels": { "calendar": false, "email": true, "sms": false }, "sms_text": null } }

3. delete_action — { "type": "delete_action", "action_id": "..." }

4. update_plan — { "type": "update_plan", "plan_id": "...", "patch": { "title": "..." } }

5. add_plan — { "type": "add_plan", "focus_id": "...", "title": "..." }

6. delete_plan — { "type": "delete_plan", "plan_id": "..." }

7. update_focus — { "type": "update_focus", "focus_id": "...", "patch": { "title": "..." } }

8. set_channel — { "type": "set_channel", "action_id": "...", "reminder_type": "calendar" }

9. set_timing — { "type": "set_timing", "action_id": "...", "cadence": "once", "remind_date": "2026-07-10", "remind_time": "09:00" }

10. shorten_sms — { "type": "shorten_sms", "action_id": "...", "sms_text": "Send 5 applications today" }

Behavior:
- Ask before changing the action map. Summarize proposed edits and ask "Want me to apply that?"
- Do not finalize, export calendar, or send reminders. User uses header buttons for Analyze, Calendar export, and Finalize.
- If action_map is missing or empty, suggest Analyze workspace first.
- If map is finalized, say the plan is finalized and offer to reopen as draft with proposed changes — do not silently edit.
- Each Action gets exactly one reminder type. Use separate Actions if the user wants multiple nudges.
- Calendar for real dates/deadlines; Email for softer reviews; Text only for urgent short actions.
- SMS text max 70 chars, ASCII, no emoji, no links. Use the actual action title — no generic app/board copy.
- Never generate: return to your practice, open the app, check your board, your dream life is waiting.
- Keep replies short and practical. No therapy language. Do not mention Canva.

User-facing names: Focus, Plan, Action, Calendar, Email, Text.`;

const SYSTEM = `${ACTION_CAPABILITIES}

${BOARDS_AI_SAFETY_POLICY}`;

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
    const workspace_id = body.workspace_id as string | undefined;
    const message = (body.message as string | undefined)?.trim();
    const history = (Array.isArray(body.history) ? body.history : []) as ChatTurn[];
    const action_map = body.action_map ?? null;

    if (!workspace_id || !message) {
      return new Response(JSON.stringify({ error: "workspace_id and message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const inputScreen = screenBoardsUserInput(message);
    if (!inputScreen.ok) {
      return new Response(
        JSON.stringify({ reply: inputScreen.reply, actions: [], proposed_actions: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: workspace } = await supabase
      .from("board_workspaces")
      .select("id, name, preset_slug")
      .eq("id", workspace_id)
      .eq("user_id", userData.user.id)
      .maybeSingle();

    const { data: boards } = await supabase
      .from("boards")
      .select("id, title, role, layout_mode, color_key")
      .eq("workspace_id", workspace_id)
      .eq("user_id", userData.user.id)
      .order("sort_order", { ascending: true });

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({
          reply: "What would you like to adjust in your action map?",
          actions: [],
          proposed_actions: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const mapSummary = action_map
      ? JSON.stringify(action_map).slice(0, 6000)
      : "No action map yet — user should Analyze workspace first.";

    const orientation =
      (boards ?? []).some((b) => b.layout_mode === "landscape") || workspace?.preset_slug?.includes("landscape")
        ? "landscape"
        : "portrait";

    const context = `Workspace: "${workspace?.name ?? "Set"}" (${orientation}).
Boards: ${(boards ?? []).map((b) => `${b.title} [${b.role}]`).join(", ") || "none"}.
Action map JSON:
${mapSummary}`;

    const messages = [
      { role: "system", content: SYSTEM },
      { role: "user", content: `Action context:\n${context}` },
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
        temperature: 0.35,
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
        : "What would you like to adjust in your action map?";
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
