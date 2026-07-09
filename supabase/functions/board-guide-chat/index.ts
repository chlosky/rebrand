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

2. update_action — patch may include: title, cadence (once|daily|weekly|monthly), remind_date (YYYY-MM-DD for once), remind_day_of_week, remind_day_of_month (1-31), remind_time (HH:mm), reminder_type, channels, sms_text

3. delete_action — { "type": "delete_action", "action_id": "..." }

4. update_plan — patch may include: title, cadence, remind_day_of_month, remind_day_of_week, remind_time

5. add_plan — { "type": "add_plan", "focus_id": "...", "title": "..." }

6. delete_plan — { "type": "delete_plan", "plan_id": "..." }

7. update_focus — { "type": "update_focus", "focus_id": "...", "patch": { "title": "..." } }

8. set_channel — { "type": "set_channel", "action_id": "...", "reminder_type": "calendar"|"email"|"sms" }

9. set_timing — { "type": "set_timing", "action_id": "...", "cadence": "once"|"daily"|"weekly"|"monthly", "remind_date", "remind_day_of_week", "remind_day_of_month", "remind_time" }

10. shorten_sms — { "type": "shorten_sms", "action_id": "...", "sms_text": "..." }

Use exact ids from id_reference in context. You may also set plan_title, focus_title, or action_title instead of ids when the user names a row.

When the user asks to add, edit, or delete plans/actions, always return proposed_actions that match their request — then ask "Want me to apply that?"
- Do not finalize, export calendar, or send reminders. User uses header buttons for Calendar export and Finalize.
- Do not run or offer Analyze workspace — tell the user to click Analyze in the header; you cannot run it.
- If action_map is missing or empty, explain they can use Analyze workspace in the header, then ask what to add to the draft.
- If map is finalized, say the plan is finalized and offer to reopen as draft with proposed changes — do not silently edit.
- Each Action gets exactly one reminder type. Use separate Actions if the user wants multiple nudges.
- Calendar for real dates/deadlines; Email for softer reviews; Text only for urgent short actions.
- SMS text max 70 chars, ASCII, no emoji, no links. Use the actual action title — no generic app/board copy.
- Never add filler actions like "Review [board]", "Progress toward…", "More [focus]", "Check your board", or motivational reminders unless the user explicitly asked for that exact wording.
- New actions must be concrete (book, buy, schedule, call, send, pay, etc.) and grounded in what the user said or what is already on their boards.
- Love, relationships, money, career, home, and planning are valid topics. Do not refuse them.
- Do not discuss other users, company internals, code, APIs, models, or how the app is built.
- Keep replies short and practical. No therapy language. Do not mention Canva.

User-facing names: Focus, Plan, Action, Calendar, Email, Text.`;

const ACTION_SCOPE_LOCK = `
SCOPE — Action page only (Focus / Plan / Action map and reminders).

You may help with:
- editing focus titles, plans, and actions in the current action map
- reminder type (Calendar, Email, Text), timing, and SMS copy
- explaining what to do next on the Action page

You must NOT:
- Run or offer Analyze workspace — user clicks Analyze in the header
- Finalize, export calendar, or send reminders — user uses header buttons
- Discuss other users, company internals, code, APIs, models, or how the app is built
- Add Vision board content (stickies, images, structures on canvas)
`.trim();

const SYSTEM = `${ACTION_CAPABILITIES}

${ACTION_SCOPE_LOCK}

${BOARDS_AI_SAFETY_POLICY}`;

function summarizeActionMap(action_map: unknown): string {
  if (!action_map || typeof action_map !== "object") {
    return "No action map yet — user should Analyze workspace first.";
  }
  const map = action_map as Record<string, unknown>;
  const focuses = Array.isArray(map.focuses) ? map.focuses : [];
  const plans = Array.isArray(map.plans) ? map.plans : [];
  const actions = Array.isArray(map.actions) ? map.actions : [];
  if (!focuses.length && !plans.length && !actions.length) {
    return "No action map yet — user should Analyze workspace first.";
  }
  try {
    return JSON.stringify({
      finalized: map.finalized === true,
      id_reference: {
        focuses: focuses.map((f) => {
          const row = f as Record<string, unknown>;
          return { focus_id: row.id, title: row.title };
        }),
        plans: plans.map((p) => {
          const row = p as Record<string, unknown>;
          return {
            plan_id: row.id,
            focus_id: row.focus_id,
            title: row.title,
            cadence: row.cadence,
            remind_time: row.remind_time,
          };
        }),
        actions: actions.map((a) => {
          const row = a as Record<string, unknown>;
          return {
            action_id: row.id,
            plan_id: row.plan_id,
            title: row.title,
            cadence: row.cadence,
            reminder_type: row.reminder_type,
            remind_date: row.remind_date,
            remind_day_of_week: row.remind_day_of_week,
            remind_day_of_month: row.remind_day_of_month,
            remind_time: row.remind_time,
          };
        }),
      },
    }).slice(0, 4000);
  } catch {
    return "Action map present but could not be summarized.";
  }
}

function buildChatMessages(context: string, history: ChatTurn[], message: string) {
  const systemContent = `${SYSTEM}\n\n---\nLive action map context:\n${context}`;
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemContent },
  ];
  for (const h of history.slice(-8)) {
    if (!h || (h.role !== "user" && h.role !== "assistant")) continue;
    const content = typeof h.content === "string" ? h.content.trim() : "";
    if (!content) continue;
    messages.push({ role: h.role, content });
  }
  messages.push({ role: "user", content: message });
  return messages;
}

async function requestGuideCompletion(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  openaiKey: string,
): Promise<Response> {
  const base = {
    model: "gpt-4o-mini",
    messages,
    temperature: 0.35,
    max_tokens: 1200,
  };
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...base,
      response_format: { type: "json_object" },
    }),
  });
  if (res.ok) return res;

  const errText = await res.text().catch(() => "");
  console.error("board-guide-chat OpenAI json mode error:", res.status, errText.slice(0, 800));

  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(base),
  });
}

function parseGuideJson(raw: string): {
  reply?: string;
  reply_without_action?: string;
  actions?: unknown[];
  proposed_actions?: unknown[];
} {
  try {
    return JSON.parse(raw) as {
      reply?: string;
      reply_without_action?: string;
      actions?: unknown[];
      proposed_actions?: unknown[];
    };
  } catch {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1].trim());
      } catch {
        /* fall through */
      }
    }
    return { reply: raw.trim(), actions: [], proposed_actions: [] };
  }
}

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
          reply: "Guide AI is not configured. Try again later or edit the map directly.",
          actions: [],
          proposed_actions: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const mapSummary = summarizeActionMap(action_map);

    const orientation =
      (boards ?? []).some((b) => b.layout_mode === "landscape") || workspace?.preset_slug?.includes("landscape")
        ? "landscape"
        : "portrait";

    const context = `Workspace: "${workspace?.name ?? "Set"}" (${orientation}).
Boards: ${(boards ?? []).map((b) => `${b.title} [${b.role}]`).join(", ") || "none"}.
Action map JSON:
${mapSummary}`;

    const priorHistory = history
      .filter((h) => h && (h.role === "user" || h.role === "assistant") && typeof h.content === "string");

    const messages = buildChatMessages(context, priorHistory, message);

    const aiRes = await requestGuideCompletion(messages, openaiKey);

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => "");
      console.error("board-guide-chat OpenAI error:", aiRes.status, errText.slice(0, 800));
      return new Response(
        JSON.stringify({
          reply: "Guide couldn't plan that edit right now. Try again in a moment.",
          actions: [],
          proposed_actions: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiJson = await aiRes.json();
    const raw = aiJson.choices?.[0]?.message?.content?.trim() ?? "{}";
    const parsed = parseGuideJson(raw);

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
    const actions = Array.isArray(parsed.actions) ? parsed.actions.slice(0, 14) : [];
    const proposed_actions = Array.isArray(parsed.proposed_actions)
      ? parsed.proposed_actions.slice(0, 14)
      : [];

    return new Response(JSON.stringify({ reply, reply_without_action, actions, proposed_actions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("board-guide-chat error:", e);
    return new Response(
      JSON.stringify({
        reply: "Guide hit a snag. Try again in a moment.",
        actions: [],
        proposed_actions: [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
