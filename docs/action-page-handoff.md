# Action Page Handoff — Focuses | Plans | Actions

Single-file handoff. Copy into ChatGPT or another agent.

**Visible map zones (exact labels):** `Focuses | Plans | Actions`

**Do NOT use in visible UI:** Quarterly, Monthly, Weekly, Daily (as column headers), Goals, Tasks, "+ add line", AI badges/icons.

---

## Concept

Workflow diagram map (monday.com × Miro, softer). **Not** a table, form dashboard, or vertical goal tree.

```
Focuses → Plans → Actions
```

Top optional bar: **Review Cycle** (not "Quarterly") — title + date + time, default +3 months / 09:00.

---

## Layout

```txt
[LEFT RAIL] [MAP SURFACE min-w-[1180px] bg-[#f7f3ea]]

Headers: Focuses | Plans | Actions

Per focus lane:
  [Focus node] ──→ [Plan nodes stack] ──→ [Action nodes per plan]
```

Connectors: subtle `bg-neutral-300` lines between zones.

Buttons: `+ Add plan`, `+ Add action`, `+ Add micro-action`

---

## Data schema (v2)

```ts
review_cycle: { title, remind_date, remind_time }
focuses: { id, board_id, title }[]
plans: {
  id, focus_id, title,
  cadence: "monthly" | "weekly" | "daily",
  remind_day_of_month, remind_day_of_week, remind_time,
  status: "suggested" | "accepted" | "rejected"
}[]
actions: {
  id, plan_id, title,
  cadence, remind_day_of_month, remind_day_of_week, remind_time,
  status, kind: "action" | "micro"
}[]
```

`normalizeAccountabilityMap()` migrates legacy `monthly_goals` / `weekly_actions` / `daily_actions` / `quarterly_reset`.

Reminders use cadence fields + `reminderToIso()` — no `days_from_now`.

---

## Cadence inside nodes (not page columns)

| Cadence | Controls |
|---------|----------|
| Monthly | Day 1–31 or Last day (-1) + time |
| Weekly | Monday–Sunday + time |
| Daily | Time only (datalist quick picks) |

---

## Files

| File | Role |
|------|------|
| `src/lib/boards/accountabilityMap.ts` | Types, normalize, finalize, reminders |
| `src/components/boards/BoardAccountabilityFlow.tsx` | Map UI |
| `src/pages/features/BoardAccountability.tsx` | Page + rail + Analyze/Finalize |
| `supabase/functions/board-accountability-map/index.ts` | Analyze → plans/actions JSON |

Route: `/dashboard/boards/accountability`

Auth: `refreshSession()` + `Authorization: Bearer` on invoke.

Deploy: `supabase functions deploy board-accountability-map --project-ref essjyrhhaiywotvgjkcg`

Test: `support@test.com` / `Test!123`

---

## Do not touch

Vision, canvas, stickies, radial palette, Guide chat, structures, color picker, stickers, shapes.
