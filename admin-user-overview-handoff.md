# Admin User Overview Table — Handoff
**Date:** June 4, 2026  
**App:** Palette Plotting  
**Purpose:** Handoff for the **admin ops snapshot table** `admin_user_overview` — includes manifestation routine + charge snapshot fields for admin ops (separate from the in-app user Dashboard UI).

---

## Critical: Migration Not Yet Applied

This migration exists in the repo but **has not been run** (as of this handoff):

`supabase/migrations/20260604200000_admin_user_overview.sql`

Until applied:
- Table `admin_user_overview` does not exist
- Function `refresh_admin_user_overview()` does not exist
- Any admin UI or query targeting this table will fail

**This is a different migration** from manifestation routine:

| Migration | Purpose | Applied? |
|---|---|---|
| `20260604200000_admin_user_overview.sql` | Admin snapshot table (incl. manifestation/charge fields) | **Not applied** (per user) |
| `20260604210000_user_preferences_manifestation_routine.sql` | Manifestation intensity / routine / notification columns on source tables | **Apply before admin overview** (user applied) |

Apply **`20260604210000` first**, then **`20260604200000`** (admin refresh reads manifestation columns from source tables).

---

## What This Is (and Is Not)

### What it is

An **internal admin snapshot table** — one denormalized row per user (`profiles.id`) that joins data an admin would need to inspect support, billing, onboarding, and attribution **without running heavy multi-table queries every time**.

Pattern:
1. **Read** live source tables (SELECT only — never mutates sources)
2. **Write** flattened rows into `admin_user_overview`
3. **Admin clients** SELECT from `admin_user_overview` only

Refresh is explicit: `SELECT refresh_admin_user_overview();` (service role).

### What it is NOT

| Not this | Clarification |
|---|---|
| User-facing `Dashboard.tsx` | End-user home screen UI; admin table mirrors charge logic but is not that page |
| Live charge meter | App meter reads `manifestation_power_daily_signals` live; admin snapshot does **not** include charge — studio queries signals and transforms in UI |
| A source of truth | Live tables remain authoritative; this is a refreshable cache/snapshot |

**No app code in `src/` reads this table yet.** It is database infrastructure for admin tooling (Supabase dashboard, future admin UI, scripts with service role).

---

## Why It Exists

Previously there may have been a **view** named `admin_user_overview`. Views recompute on every query and can be slow/fragile across many LEFT JOINs and LATERAL subqueries.

This migration:
1. `DROP VIEW IF EXISTS admin_user_overview`
2. Creates a **physical table** with the same conceptual purpose
3. Adds `refresh_admin_user_overview()` to rebuild the snapshot on demand
4. Runs an initial refresh at migration time
5. Adds RLS so only `admin_users` can SELECT

**Why snapshot instead of view:** predictable read performance for admin lists, sort/filter on indexed columns (`profiles_last_activity`, `support_has_admin_unread`), and controlled refresh cadence (manual, cron, or after support actions).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  SOURCE TABLES (unchanged — read only during refresh)       │
├─────────────────────────────────────────────────────────────┤
│  profiles                                                   │
│  user_preferences                                           │
│  onboarding_sessions                                        │
│  web_onboarding_sessions                                    │
│  user_plans                                                 │
│  support_cases                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │  refresh_admin_user_overview()
                           │  TRUNCATE + INSERT SELECT
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  admin_user_overview  (one row per profiles.id)             │
│  — denormalized snapshot                                    │
│  — refreshed_at timestamp                                   │
└──────────────────────────┬──────────────────────────────────┘
                           │  SELECT (RLS: admin_users only)
                           ▼
                    Admin tools / SQL / future admin UI
```

**Important:** Refresh **truncates and rebuilds** the entire snapshot. It does not incrementally patch rows.

---

## Table: `admin_user_overview`

**Primary key:** `user_id` (= `profiles.id`)

### Column groups

#### Profile (`profiles`)

| Column | Source |
|---|---|
| `profiles_email` | `profiles.email` |
| `profiles_first_name` | `profiles.first_name` |
| `profiles_username` | `profiles.username` |
| `profiles_selected_character` | `profiles.selected_character` |
| `profiles_created_at` | `profiles.created_at` |
| `profiles_updated_at` | `profiles.updated_at` |
| `profiles_last_activity` | `profiles.last_activity` |

#### Preferences (`user_preferences`)

| Column | Source |
|---|---|
| `user_preferences_selected_character` | `user_preferences.selected_character` |

#### Manifestation routine (prefs/profile only — no charge in snapshot)

| Column | Source / logic |
|---|---|
| `manifestation_intensity` | `COALESCE(user_preferences, profiles)` — `light` / `consistent` / `locked_in` |
| `app_notifications_enabled` | `COALESCE(user_preferences, profiles)` |
| `notification_permission_status` | `COALESCE(user_preferences, profiles)` — `granted` / `denied` / `skipped` |
| `manifest_routine_items_count` | `jsonb_array_length(manifest_routine_items)` from prefs, profile fallback |

**Charge:** not denormalized here. Studio reads `manifestation_power_daily_signals` (`signal_date`, `signal_kind`) and derives checkpoints/status locally or via edge function. Migration refresh does not join that table.

#### Onboarding session (latest per user + derived flags)

Picked from latest `onboarding_sessions` row for `user_id` (by `updated_at` desc).

| Column | Meaning |
|---|---|
| `onboarding_session_*` | Raw fields from session (status, email, tier, billing, paid_at, consents, etc.) |
| `onboarding_has_session` | User has any linked onboarding session row |
| `onboarding_reached_checkout` | Status in `checkout_created`, `paid`, `account_created`, `active` |
| `onboarding_is_paid` | `paid_at` set or paid-ish status |
| `onboarding_account_created` | Status `account_created` or `active` |
| `onboarding_is_active` | Status `active` |

Includes `onboarding_session_app_notifications_consent` from session column — **onboarding-time consent**, not live `user_preferences.app_notifications_enabled`.

#### Web attribution (`onboarding_sessions.onboarding_answers` + `web_onboarding_sessions`)

| Column | Meaning |
|---|---|
| `web_onboarding_has_attribution` | Has `web_onboarding_v1` in session answers OR a `web_onboarding_sessions` row |
| `web_entry_path`, `web_page_path`, `web_referrer` | First-touch / COALESCE from session JSON and web tables |
| `web_utm_*` | UTM params |
| `web_from_tiktok`, `web_ttclid` | TikTok attribution |
| `web_is_mobile_viewport` | Mobile viewport flag |
| `web_make_my_subliminal_cta_clicked` | CTA click from session JSON or latest web session |
| `web_is_paid` | Paid flag from attribution |
| `web_attribution_recorded_at` | When attribution was recorded |
| `web_onboarding_client_visit_id` | First web session client visit id |

#### Billing / plan (`user_plans`)

| Column | Meaning |
|---|---|
| `user_plans_*` | Tier, billing period, status, trial flags, period end, payment sources |
| `user_plans_stripe_*` | Stripe customer/subscription ids (legacy/hybrid billing metadata) |
| `user_plans_apple_*` / `google_play_*` | Native store ids |
| `user_has_plan` | User has a `user_plans` row |

Payment source reflects **where the subscription was purchased** (apple / google_play / stripe / revenuecat web billing metadata) — not which paywall UI the user saw.

#### Support (`support_cases`)

| Column | Meaning |
|---|---|
| `support_open_case_count` | Count of open cases |
| `support_has_admin_unread` | Any case with `admin_unread = true` |
| `support_latest_case_updated_at` | Most recent case activity |

#### Meta

| Column | Meaning |
|---|---|
| `refreshed_at` | When this snapshot row was last built |

---

## Source Tables (what each is for)

| Table | Role in snapshot |
|---|---|
| **`profiles`** | Anchor — one overview row per profile. Identity, activity, character. |
| **`user_preferences`** | Selected character mirror (and live prefs exist separately for app features). |
| **`onboarding_sessions`** | Funnel state, consents at onboarding, tier/billing choice, paid_at, linked Stripe session metadata from legacy flow. |
| **`web_onboarding_sessions`** | Web attribution rows (UTM, TikTok, entry paths) when not only in session JSON. |
| **`user_plans`** | Entitlement / subscription gating source of truth in the app. |
| **`support_cases`** | Support inbox workload per user. |
| **`admin_users`** | Not joined into snapshot — used only for RLS (who may read the snapshot). |

`manifestation_power_daily_signals` is **not** joined during refresh. Studio reads it directly for charge.

Refresh function uses **LATERAL** subqueries to pick:
- First onboarding session with `web_onboarding_v1` attribution
- First and latest `web_onboarding_sessions` per user
- Latest `onboarding_sessions` per user
- Aggregated support stats per user

---

## Function: `refresh_admin_user_overview()`

```sql
SELECT public.refresh_admin_user_overview();
-- Returns: integer row count inserted
```

| Property | Value |
|---|---|
| Language | `plpgsql` |
| Security | `SECURITY DEFINER` |
| Mutates sources? | **No** — SELECT from sources, TRUNCATE + INSERT into snapshot only |
| Who can run | `service_role` only (REVOKE from PUBLIC) |
| Initial run | Migration calls it once at end |

### When to refresh

- After migration apply (automatic)
- Before admin review sessions
- On a schedule (pg_cron / external job) if you want near-live data
- After bulk support or billing changes if admins need fresh snapshot

Stale data is expected between refreshes — check `refreshed_at`.

---

## Security (RLS)

```sql
-- authenticated users in admin_users may SELECT
CREATE POLICY "admin_user_overview_select_admin"
  ON admin_user_overview FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid()));
```

- No INSERT/UPDATE/DELETE for app users on this table
- Refresh requires **service role** (edge function, SQL editor, backend job)
- Regular users cannot read other users’ overview rows

---

## Indexes

| Index | Purpose |
|---|---|
| `idx_admin_user_overview_profiles_last_activity` | Sort/filter admin list by recent activity |
| `idx_admin_user_overview_support_admin_unread` | Partial index where `support_has_admin_unread = true` |

---

## Apply Migration

**File:** `supabase/migrations/20260604200000_admin_user_overview.sql`

### Option A — Supabase SQL Editor
Paste full file contents → Run.

### Option B — CLI
```powershell
cd <repo-root>
supabase login
supabase link --project-ref hyckwyjznishkjijrhcw
supabase db push
```
(Pushes all pending migrations — confirm you want both admin + any other pending files.)

### Post-apply verification

```sql
-- Table exists
SELECT COUNT(*) FROM public.admin_user_overview;

-- Refresh works
SELECT public.refresh_admin_user_overview();

-- Sample row
SELECT user_id, profiles_email, user_has_plan, onboarding_is_active,
       support_open_case_count, refreshed_at
FROM public.admin_user_overview
LIMIT 5;
```

---

## Safety for Existing App

| Concern | Answer |
|---|---|
| Alters existing tables? | **No** — creates new table + function only |
| Drops data? | Drops old **view** if it existed; replaces with table |
| Breaks user app if not applied? | **No** — nothing in `src/` queries this yet |
| Breaks user app if applied? | **No** — additive; user app unchanged |
| Related to manifestation migration? | **No** — independent |

---

## Future Work (not built)

- Admin UI page reading `admin_user_overview`
- Scheduled refresh (cron)
- Edge function wrapper for refresh

---

## File Index

| Item | Path |
|---|---|
| Migration (not applied) | `supabase/migrations/20260604200000_admin_user_overview.sql` |
| Admin allowlist table | `supabase/migrations/20260528060000_inbox_threads_messages.sql` (`admin_users`) |
| Support cases source | `supabase/migrations/20260528120000_support_cases.sql` |

---

## Quick Reference

| Question | Answer |
|---|---|
| What is `admin_user_overview`? | Admin-only denormalized user snapshot table |
| User Dashboard Manifestation Charge? | Unrelated — different feature |
| Applied? | **Not yet** (separate from manifestation routine migration) |
| How to populate? | `SELECT refresh_admin_user_overview();` |
| App code using it? | None yet |
| Source tables modified? | No — read-only during refresh |
