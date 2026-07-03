# Studio — Primary Handoff (Separate Repo, Same Supabase)
**Date:** June 4, 2026  
**Product:** Palette Plotting (consumer app in `belief-craft-nexus`)  
**This document is the authoritative build spec for the `studio` project.**

> **For the agent:** Treat everything in this file as primary instructions. Do not build studio inside BCN. Do not use Next.js or Python. Match the consumer app’s **Vite + React + TypeScript** web stack.

---

## 0. Executive summary

Build a **separate GitHub repo** named **`studio`** — an internal workspace UI connected to the **same Supabase project** as the consumer app (`hyckwyjznishkjijrhcw`).

- **Primary data feed:** `public.admin_user_overview` (denormalized snapshot, one row per user)
- **Auth:** Supabase Auth + allowlist in `public.admin_users`
- **Refresh:** Edge Function `studio-refresh-user-overview` (service role server-side only)
- **Not in scope:** New database, consumer app changes, public/obvious naming (`admin`, `ops`, `Palette Plotting`, `BCN`)

---

## 1. Stack — stay aligned with consumer app (no Next.js, no Python)

The consumer app (`belief-craft-nexus`) is **`vite_react_shadcn_ts`** + Capacitor + Supabase Deno edge functions.

| Layer | Studio must use | Do NOT use |
|---|---|---|
| App | **Vite + React + TypeScript** | Next.js, Remix, CRA |
| Routing | **React Router** | Next app router |
| UI | **Tailwind + shadcn/ui (Radix)** — operational tables over decoration | New design system, heavy marketing UI |
| Data | **`@supabase/supabase-js`** | Python/FastAPI/Django, separate REST API |
| Server logic | **Supabase Edge Functions (Deno/TypeScript)** | Python lambdas, Express API |
| Auth | Supabase Auth (same project) | Separate auth |
| Deploy | Static `vite build` → private host or local | SSR frameworks |

**Studio = same web toolchain as BCN, minus Capacitor / RevenueCat / OneSignal / consumer onboarding.**

### Scalability path (later, optional)

```
studio/                    ← v1: separate repo (now)
belief-craft-nexus/        ← consumer app (unchanged)

# Later only if needed:
paletteplotting/
  apps/studio/
  apps/belief-craft-nexus/
  packages/supabase-types/   ← generated DB types only
```

Do not introduce a monorepo until copy-paste pain is real.

---

## 2. Hard constraints (do not conflict)

| Rule | Detail |
|---|---|
| Separate repo | Project name: **`studio`** |
| Not in consumer app | No studio routes in BCN, no changes to user `Dashboard.tsx` for studio |
| Same Supabase | Same URL + anon key; **never** new DB |
| No obvious naming | Avoid repo/package names: `admin`, `ops`, `support`, `billing`, `users`, `Palette Plotting`, `BCN` |
| Frontend secrets | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` **only** |
| No service_role in browser | Refresh via Edge Function only |
| Snapshot not live | Show `refreshed_at`; data stale until refresh |
| Source of truth | Live tables authoritative; `admin_user_overview` is cache |
| Drilldown rule | List/feed/filter from snapshot; query source tables only for support messages, notes, actions needing fresh detail |
| Support | Use existing `support_cases` architecture — inspect before inventing schema |
| Billing v1 | Read-only unless safe existing functions exist |
| Internal notes | Defer `admin_user_notes` table until core pages work |

---

## 3. Prerequisites (verify before building)

### Migrations (apply from BCN repo if missing)

| Order | File | Purpose |
|---|---|---|
| 1 | `20260604210000_user_preferences_manifestation_routine.sql` | Manifestation/notification cols on source tables |
| 2 | `20260604200000_admin_user_overview.sql` | Snapshot table + `refresh_admin_user_overview()` |

**Apply `20260604210000` before `20260604200000`.**

### Verify in SQL Editor

```sql
-- Table + function exist
SELECT COUNT(*) FROM public.admin_user_overview;
SELECT public.refresh_admin_user_overview();

-- Your user is allowlisted (replace UUID)
INSERT INTO public.admin_users (user_id) VALUES ('YOUR-AUTH-UUID') ON CONFLICT DO NOTHING;

-- RLS: admin can read, non-admin cannot
```

### Supabase project

| Setting | Value |
|---|---|
| Project ref | `hyckwyjznishkjijrhcw` |
| Dashboard | https://supabase.com/dashboard/project/hyckwyjznishkjijrhcw |

Copy `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from BCN `.env`.

---

## 4. Consumer app context (read-only)

The snapshot copies **prefs/profile fields only** for manifestation routine. **Charge is not in the snapshot** — studio reads `manifestation_power_daily_signals` and derives display locally (or via an edge function).

### Manifestation Charge (user app + studio source of truth)

- Table: `manifestation_power_daily_signals` — one row per qualifying completion
- Cols: `user_id`, `signal_date` (date the app wrote at record time), `signal_kind`, `created_at`
- Qualifying kinds: `affirm_visualize`, `mirror_work`, `subliminal_listen`, `belief_view`
- Intensity targets (from snapshot `manifestation_intensity`): `light`=1, `consistent`=2, `locked_in`=3
- Status labels: `Needs Persistence` (0), `Aligned` (≥1 below target), `Locked In` (≥ target)

Mirror consumer logic from `belief-craft-nexus/src/lib/manifestationPowerSignals.ts` in the **studio repo** when computing charge for display.

### Charge date semantics

| Layer | What it uses |
|---|---|
| **Stored rows** | `signal_date` exactly as written by the app (device local calendar day at record time) |
| **Admin snapshot** | **No charge columns** — migration does not touch `manifestation_power_daily_signals` |
| **Studio** | Query raw signals; apply **UTC \| Local** toggle when picking "today's" calendar day for counts, graphs, and filters |

Do not reinterpret dates in the migration refresh SQL.

### Manifestation routine (user app)

- Cols on prefs/profile: `manifestation_intensity`, `manifest_routine_items`, `app_notifications_enabled`, `notification_permission_status`
- Paywall activation: `sync-revenuecat-entitlement` + setup draft (RC paywall — not legacy Stripe Checkout)

---

## 5. `admin_user_overview` architecture

```
profiles, user_preferences, onboarding_sessions, web_onboarding_sessions,
user_plans, support_cases
        │  refresh_admin_user_overview()  [service_role]
        ▼
admin_user_overview  (1 row / profiles.id)
        │  SELECT  [RLS: admin_users]
        ▼
studio UI  (+ direct SELECT on manifestation_power_daily_signals for charge)
```

Refresh **TRUNCATE + rebuilds** entire snapshot. Do not poll refresh every few seconds without perf testing.

### RLS

Only users in `public.admin_users` may `SELECT` from `admin_user_overview`.

---

## 6. Schema reference — spec vs actual DB columns

Use **actual DB names** in queries. Where the page spec uses a shorthand, map here:

| Spec / UI label | Actual column in `admin_user_overview` |
|---|---|
| `user_plans_payment_source` | `user_plans_last_payment_source` (also `user_plans_first_payment_source`) |
| `user_plans_is_trial` | `user_plans_on_trial` |
| `user_plans_trial_ends_at` | **Not in snapshot** — query `user_plans` on drilldown if needed |
| `onboarding_session_billing_period` | `onboarding_session_billing` |

### Manifestation columns (in snapshot — routine only)

| Column | Meaning |
|---|---|
| `manifestation_intensity` | `light` / `consistent` / `locked_in` |
| `app_notifications_enabled` | Live toggle state (not onboarding consent) |
| `notification_permission_status` | `granted` / `denied` / `skipped` |
| `manifest_routine_items_count` | JSON array length |

**Charge (not in snapshot):** query `manifestation_power_daily_signals` per user (admin RLS policy in migration `20260604200000`); derive checkpoints + status in studio using intensity from snapshot + rows for the selected calendar day (UTC \| Local toggle).

### Full column list

See `belief-craft-nexus/supabase/migrations/20260604200000_admin_user_overview.sql` and `admin-user-overview-handoff.md` for grouped field reference.

---

## 7. Repo structure

```
studio/
  src/
    pages/
      Login.tsx
      Overview.tsx
      Funnel.tsx
      Users.tsx
      UserDetail.tsx
      SupportQueue.tsx
      SupportCaseDetail.tsx
      Billing.tsx
      Attribution.tsx
      System.tsx
    components/
      StudioLayout.tsx
      AccessGuard.tsx
      UserTable.tsx
      UserDetailDrawer.tsx
      RefreshButton.tsx
      MetricCard.tsx
      FilterBar.tsx
      StatusBadge.tsx
    lib/
      supabase.ts
      access.ts
      queries.ts
      formatters.ts
    App.tsx
    main.tsx
  supabase/functions/studio-refresh-user-overview/
  .env                    # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY only
  package.json
```

---

## 8. Environment variables

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

**Never** `SUPABASE_SERVICE_ROLE_KEY` in frontend `.env`.

Edge function secrets (Supabase dashboard): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

---

## 9. Authentication & AccessGuard

1. User logs in (Supabase Auth).
2. Get `auth.uid()`.
3. Query `public.admin_users` where `user_id = auth.uid()`.
4. Row exists → allow all `/studio/*`.
5. No row → block completely (no internal data flash while loading).
6. Wrap all `/studio` routes in **`AccessGuard`**.

Do not rely on UI hiding alone — RLS must protect `admin_user_overview`.

---

## 10. Routes

| Route | Page |
|---|---|
| `/login` | Login |
| `/studio` | Overview (default) |
| `/studio/funnel` | Funnel |
| `/studio/users` | Users |
| `/studio/users/:userId` | User Detail |
| `/studio/support` | Support Queue |
| `/studio/support/:caseId` | Support Case Detail |
| `/studio/billing` | Billing |
| `/studio/attribution` | Attribution |
| `/studio/system` | System / Refresh |

### Global layout (`StudioLayout`)

**Left sidebar:** Overview · Funnel · Users · Support · Billing · Attribution · System

**Top header:** logged-in email · latest `refreshed_at` · **UTC | Local** time toggle · **Refresh now** · sign out

**Design:** Operational readability — tables, sticky headers, filter chips, status badges, search, loading/empty/error states. Do not over-style.

Every page using snapshot data must show **`refreshed_at`** visibly.

### Time display mode — UTC vs Local (required)

Add a **global header toggle** next to **Refresh now** so ops can switch how timestamps and calendar-bound metrics are read. This is separate from refresh: refresh rebuilds snapshot data; the toggle only changes **how the UI interprets and displays** time.

| Mode | Meaning |
|---|---|
| **UTC** | All displayed timestamps and calendar-day buckets use UTC |
| **Local** | Use the **signed-in admin's browser timezone** (`Intl.DateTimeFormat().resolvedOptions().timeZone`); show the IANA name in the header when Local is active (e.g. `Local · America/New_York`) |

**Persistence:** `localStorage` key `studio-time-display-mode` (`'utc' | 'local'`). Default **`local`**.

**Implementation:** Provide via React context from `StudioLayout` (e.g. `TimeDisplayModeProvider`). Pages read `mode` + `formatTimestamp()` / `calendarDayKey()` helpers **defined in the studio repo** (small util file or inline in layout — not in BCN).

**What the toggle MUST affect**

- Table columns that show `timestamptz` (`profiles_created_at`, `profiles_last_activity`, `refreshed_at`, onboarding/support/billing dates, etc.)
- Calendar-bound filters and metric cards: **New today**, date-range filters on Funnel/Overview/Billing that mean "this calendar day"
- **Graphs and time-series** (signup funnel over time, daily active counts, any chart): bucket and label axes using the selected mode
- User Detail drill-downs that group or filter raw rows by day (e.g. listing `manifestation_power_daily_signals` by date)

**What stays unchanged regardless of toggle**

- **Refresh now** / `studio-refresh-user-overview` — server RPC unchanged; snapshot has no charge fields

**Charge display:** Query `manifestation_power_daily_signals` where `signal_date` equals the calendar day for "today" in the active mode (format `YYYY-MM-DD`). Compare row count to target from `manifestation_intensity`. `signal_date` in the table is authoritative — the toggle only picks which calendar day you are asking about for ops views.

**Edge cases**

- **New last 24h** = rolling 24 hours from `now()` — not affected by the toggle.
- When mode is **UTC**, show a subtle sitewide hint (e.g. `All times UTC`).

**UX sketch (header, left → right):** `refreshed_at` · `[ UTC | Local ]` · `Refresh now` · sign out

---

## 11. Default query pattern

```sql
SELECT *
FROM public.admin_user_overview
ORDER BY profiles_created_at DESC
LIMIT 100;
```

TypeScript example:

```typescript
const { data } = await supabase
  .from("admin_user_overview")
  .select("*")
  .order("profiles_created_at", { ascending: false })
  .limit(100);
```

---

## 12. Refresh strategy

### Manual — `studio-refresh-user-overview` Edge Function

1. User clicks **Refresh now**.
2. Frontend invokes `studio-refresh-user-overview` with user JWT.
3. Function verifies auth + `admin_users` membership.
4. Function uses **service_role** server-side.
5. Runs `SELECT public.refresh_admin_user_overview();`
6. Returns `{ row_count, refreshed_at }`.
7. UI reloads snapshot data.

**Must NOT:** accept arbitrary SQL from client; expose service_role to browser.

### Scheduled (later)

- 1–5 min during launch/monitoring
- 5–15 min normally  
Manual button remains even with cron.

### Edge function sketch

```typescript
// supabase/functions/studio-refresh-user-overview/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: allowed } = await admin.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!allowed) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

  const { data: rowCount, error } = await admin.rpc("refresh_admin_user_overview");
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify({
    ok: true,
    row_count: rowCount,
    refreshed_at: new Date().toISOString(),
  }), { headers: { "Content-Type": "application/json" } });
});
```

Deploy: `supabase functions deploy studio-refresh-user-overview --project-ref hyckwyjznishkjijrhcw`

---

## 13. Pages (primary instructions)

### 13.1 Overview — `/studio`

**Data:** `admin_user_overview`

**Metric cards:** Total users · New today · New last 24h · Paid · Active · Reached checkout · Paid onboarding · Account created · Open support cases · Admin unread support · Latest `refreshed_at`

**New today** uses the header **UTC | Local** mode for calendar-day boundaries. **New last 24h** is always a rolling 24h window.

**Charts (if added):** Signups / funnel over time must bucket by the active time mode; axis labels must include `UTC` or the local IANA zone.

**Preview table** (recent users, `profiles_created_at desc`):

`profiles_email`, `profiles_first_name`, `profiles_username`, `profiles_created_at`, `profiles_last_activity`, `onboarding_session_status`, `onboarding_reached_checkout`, `onboarding_is_paid`, `onboarding_account_created`, `onboarding_is_active`, `user_has_plan`, `user_plans_tier`, `user_plans_status`, `user_plans_last_payment_source`, `manifestation_intensity`, `support_open_case_count`, `support_has_admin_unread`, `refreshed_at`

Row click → `/studio/users/:userId` or `UserDetailDrawer`.

---

### 13.2 Funnel — `/studio/funnel`

**Data:** `admin_user_overview` (onboarding + web attribution cols)

**Metrics:** counts for `onboarding_has_session`, `onboarding_reached_checkout`, `onboarding_is_paid`, `onboarding_account_created`, `onboarding_is_active`, `web_onboarding_has_attribution`, `web_from_tiktok`, `web_make_my_subliminal_cta_clicked`

**Filters:** date range (`profiles_created_at`), onboarding status, payment source, UTM source/campaign, TikTok, checkout/paid/created/active flags

Date range filters interpret **inclusive calendar days** in the header **UTC | Local** mode (not server UTC by default).

**Table cols:** `profiles_email`, `profiles_created_at`, onboarding flags, `onboarding_session_selected_tier`, `onboarding_session_billing`, web attribution cols (see schema)

---

### 13.3 Users — `/studio/users`

**Data:** `admin_user_overview`

**Default sort:** `profiles_created_at desc` (toggle `profiles_last_activity desc`)

**Search:** email, first name, username, `user_id`

**Filters:** new today/24h (today = UTC|Local mode; 24h = rolling), active, paid, trial (`user_plans_on_trial`), no plan, checkout/paid/created/active, TikTok, support flags, payment source, plan status, intensity (charge status filter: client-side from `manifestation_power_daily_signals` if needed)

**Columns:** identity, onboarding flags, plan fields, manifestation routine cols, support cols, `refreshed_at` (charge cols computed on User Detail from signals table)

Row → `/studio/users/:userId` or drawer.

---

### 13.4 User Detail — `/studio/users/:userId`

Start from snapshot row; drill to source tables only when needed.

**A. Identity** — profile fields

**B. Onboarding** — session + derived flags (`onboarding_session_app_notifications_consent` = onboarding-time, not live `app_notifications_enabled`)

**C. Attribution** — web_* cols

**D. Billing / plan** — `user_plans_*`, payment source ids

**E. Manifestation routine + charge**

- From snapshot: `manifestation_intensity`, `manifest_routine_items_count`, `app_notifications_enabled`, `notification_permission_status`
- Charge: query `manifestation_power_daily_signals` for this `user_id`; derive checkpoints/status in UI (UTC \| Local for which calendar day = "today"); list raw rows with `signal_date`, `signal_kind`, `created_at`

**F. Support** — snapshot flags + list from `support_cases` for this user

**G. Internal notes** — defer until `admin_user_notes` table exists:

```sql
-- Future (not v1):
-- admin_user_notes (id, user_id, admin_user_id, note, status_tag, created_at, updated_at)
-- Do NOT store notes in profiles.
```

---

### 13.5 Support Queue — `/studio/support`

**Queue flags from snapshot:** `support_open_case_count`, `support_has_admin_unread`, `support_latest_case_updated_at`

**Case details from source:** `support_cases` + existing message/thread tables (inspect BCN migrations first)

**Views:** Admin unread · Open · Recently updated · Paid + open · Open + no plan · All

**v1:** Read cases; respond only if existing schema supports it — report gaps before new schema.

---

### 13.6 Support Case Detail — `/studio/support/:caseId`

Load case by id · user from snapshot · messages from existing tables · identity/plan panel · reply if schema allows · update `admin_unread`/status per existing patterns · refresh snapshot after actions if needed.

---

### 13.7 Billing — `/studio/billing`

**Data:** `admin_user_overview` — read-only v1

**Views:** Active · Trial · Paid · Stripe / Apple / Google Play · No plan · Period ending soon · Onboarding paid but no plan (if detectable)

Use `user_plans_last_payment_source`, `user_plans_on_trial`, `user_plans_current_period_end`, etc.

No destructive billing actions without explicit approval.

---

### 13.8 Attribution — `/studio/attribution`

**Data:** `admin_user_overview` web + funnel cols

**Views:** TikTok · ttclid · UTM breakdown · mobile viewport · CTA clicked · paid by source

**Filters:** date, UTM, TikTok, paid/checkout/created/active (date range uses UTC|Local mode)

---

### 13.9 System — `/studio/system`

Show: latest `refreshed_at`, row count, refresh status, **Refresh now**, active **UTC | Local** mode + IANA zone when Local, current user, access check result, project URL hint.

---

## 14. Implementation order

1. Create GitHub repo **`studio`**
2. Vite + React + TypeScript + Tailwind + shadcn + React Router
3. Supabase client (`VITE_*` env)
4. `Login.tsx`
5. `AccessGuard` (auth + `admin_users`)
6. `StudioLayout` (sidebar + header + **UTC | Local** toggle + time display context)
7. `/studio` Overview
8. `/studio/users` + `/studio/users/:userId`
9. `/studio/support` queue
10. `/studio/system` + **`studio-refresh-user-overview`** Edge Function
11. `/studio/funnel`
12. `/studio/billing`
13. `/studio/attribution`
14. Support reply — **only after** inspecting existing support schema
15. `admin_user_notes` — later

---

## 15. Testing checklist

**Repo / env:** runs locally · anon key only · no service_role in frontend

**Auth:** logged-out → login · allowlisted user in · non-admin blocked · no data flash before access check

**Data:** overview metrics · users table · search/filters · user detail · support · billing · attribution · `refreshed_at` visible

**Time mode:** UTC | Local toggle persists · timestamps, date filters, charts, and charge day selection respect selected mode · charge from raw `signal_date` rows · rolling 24h unchanged

**Refresh:** button → Edge Function → admin check → RPC → row count → UI reload · non-admin denied

**Support:** view cases · open detail · respond only if schema supports · report gaps otherwise

**Security:** RLS on snapshot · no service_role client · no studio code in BCN · no destructive billing · no arbitrary SQL endpoint

---

## 16. Deployment

- Separate deploy from consumer app
- Static `vite build`
- Private URL + Supabase auth + `admin_users` — do not expose publicly without both guards

---

## 17. BCN reference files (do not copy whole repo)

| Item | Path in BCN |
|---|---|
| Admin snapshot migration | `supabase/migrations/20260604200000_admin_user_overview.sql` |
| Manifestation cols migration | `supabase/migrations/20260604210000_user_preferences_manifestation_routine.sql` |
| Charge logic (consumer) | `src/lib/manifestationPowerSignals.ts` |
| Support schema | `supabase/migrations/20260528120000_support_cases.sql` |
| Admin allowlist | `supabase/migrations/20260528060000_inbox_threads_messages.sql` |

---

## 18. Kickoff prompt (copy into new repo workspace)

```
Read studio-handoff.md in full — it is the primary spec.

Create repo "studio": Vite + React + TypeScript + Tailwind + shadcn + React Router.
Same Supabase project as belief-craft-nexus (anon key only in frontend).
No Next.js. No Python. Do not modify belief-craft-nexus.

Build Login, AccessGuard (admin_users), StudioLayout (header: UTC|Local toggle + Refresh now), and pages per handoff.
Primary data: admin_user_overview. Edge Function: studio-refresh-user-overview.

Verify migration 20260604200000 applied before querying snapshot.
Implement in the handoff implementation order. v1 billing read-only.
Inspect support_cases schema before building replies.
```

Copy this file into the new repo as `HANDOFF.md` when starting.
