# Manifestation Routine, Charge, ATT & Settings — Full Handoff
**Date:** June 4, 2026  
**App:** Palette Plotting  
**Purpose:** Complete handoff for the manifestation intensity onboarding screen, ATT-only permissions screen, Manifestation Charge meter, Dashboard/Your Journey integration, Settings routing, post-onboarding routine settings, backend persistence, and OneSignal notification architecture.

---

## Critical: Migration Not Yet Applied

The following migration exists in the repo but **has not been run in production** (as of this handoff):

`supabase/migrations/20260604210000_user_preferences_manifestation_routine.sql`

Until applied, reads/writes to these columns will fail at runtime:

| Table | New columns |
|---|---|
| `user_preferences` | `manifestation_intensity`, `manifest_routine_items`, `notification_permission_status` |
| `profiles` | `manifestation_intensity`, `manifest_routine_items`, `notification_permission_status`, `app_notifications_enabled` |

**Apply via your normal Supabase migration flow** (`supabase db push`, linked project migrate, or run SQL in dashboard).

---

## Architecture Principles (Do Not Break)

1. **Notifications support the routine; they do not define it.** Disabling notifications must never erase `manifestation_intensity`, `manifest_routine_items`, or charge logic.
2. **Single notification backend path.** Use existing fields and functions — do not create a parallel notification system.
3. **Dual-write pattern** for routine + notification fields: `user_preferences` **and** `profiles`.
4. **Intensity drives charge target** (1 / 2 / 3 checkpoints), not embody / Inspired Actions.
5. **Routine/intensity is NOT stored on `user_setup_path`.** It lives in `user_preferences`, `profiles`, and onboarding session JSON (`setup_journey_v1`).
6. **No shared helper modules** for one-off wiring — extend existing files inline (e.g. `manifestationPowerSignals.ts`).

---

## Onboarding Flow Order

### Native suite funnel (`/onboarding/suite/setup/...` or native app default)

```
Guide → Manifestation intensity → ATT (iOS only) → Tool preference → Path loading → …
```

| Step | Route | File |
|---|---|---|
| Guide | `…/guide` | `src/pages/onboarding/setup/Guide.tsx` |
| **Manifestation intensity** | `…/manifestation-intensity` | `src/pages/onboarding/setup/ManifestationIntensity.tsx` |
| **ATT only (iOS)** | `…/notifications` | `src/pages/onboarding/setup/NotificationPrePermission.tsx` |
| Tool preference | `…/tool-preference` | `src/pages/onboarding/setup/ToolPreference.tsx` |

- **Android native:** Guide → Manifestation intensity → Tool preference (skips ATT).
- **iOS native:** Guide → Manifestation intensity → ATT → Tool preference.

### Web fast funnel (`/onboarding/setup/...`)

```
Begin journey → Manifestation intensity → Path loading → …
```

- Web fast does **not** show Guide or ATT.
- Tool preference comes **before** begin-journey in the web-fast route list (user picks tools earlier).

### Route registration

`src/App.tsx`:
- `/onboarding/setup/manifestation-intensity` → `SetupManifestationIntensity`
- `/onboarding/setup/notifications` → `SetupNotificationPrePermission`
- `/onboarding/suite/setup/manifestation-intensity` → suite variant
- `/onboarding/suite/setup/notifications` → suite variant
- `/dashboard/settings/manifestation-routine` → `ManifestationRoutineSettings`

Flow config: `src/lib/onboardingFlow.ts`, bottom scene: `src/lib/onboardingBottomSceneRoutes.ts`.

---

## Part 1 — Manifestation Intensity Onboarding Screen

**File:** `src/pages/onboarding/setup/ManifestationIntensity.tsx`  
**Routes:** `/onboarding/setup/manifestation-intensity`, `/onboarding/suite/setup/manifestation-intensity`

### UI

Three intensity cards:

| ID | Title | Charge target (post-onboarding) |
|---|---|---|
| `light` | Light | 1 qualifying signal row |
| `consistent` | Consistent (default) | 2 |
| `locked_in` | Locked In | 3 |

### CTAs

**Set my routine** (primary continue):
1. Saves selected intensity.
2. Builds `manifestRoutineItems` from `toolPreferences` in setup draft (affirmations, subliminals, mirror work, belief work, guide check-in, progress review — cadence/targets scale with intensity).
3. On **native only**: calls `requestOneSignalPushPermission(true)` from `src/services/oneSignal.ts`.
4. Writes setup draft:
   - `manifestationIntensity`
   - `manifestRoutineItems`
   - `appNotificationsConsent` → maps to `app_notifications_enabled` at activation
   - `notificationPermissionStatus` → `"granted"` | `"denied"` | `"skipped"`
5. Syncs OneSignal tags (native only):
   - `manifestation_intensity`
   - `notifications_enabled` (`"true"` / `"false"`)
   - `notification_permission_status`
6. **Denied OS permission does NOT block onboarding.**

**Not now** (secondary):
- Saves intensity (defaults to `consistent` if none selected).
- Builds routine items.
- `appNotificationsConsent = false`, `notificationPermissionStatus = "skipped"`.
- No OS permission prompt.

### Next route after screen

| Context | Next |
|---|---|
| iOS suite | `…/notifications` (ATT) |
| Android suite | `…/tool-preference` |
| Web fast | `…/plot-loading` |

### Back navigation

- Suite: → `…/guide`
- Web fast: → `…/begin-journey`

---

## Part 2 — ATT Screen (NotificationPrePermission)

**File:** `src/pages/onboarding/setup/NotificationPrePermission.tsx`  
**Route:** `…/notifications`

### What it is now

**ATT-only on iOS.** All push notification / reminder UI was removed from this screen.

- Non-iOS: `useEffect` redirects to `…/tool-preference` immediately; component returns `null`.
- iOS: Shows "Help Us Improve Palette Plotting" Yes/No for App Tracking Transparency via `TrackingAuthorization.request()`.
- Writes to setup draft: `trackingPrePermissionChoice`, `trackingAuthorizationStatus`, `trackingPermissionAskedAt`.
- **Does NOT** call `requestOneSignalPushPermission` or any push permission API.

### Navigation

- Back → `…/manifestation-intensity`
- Continue → `…/tool-preference`

### Do not refactor

ATT placement and behavior should stay as-is. Push permission moved to Manifestation Intensity screen.

---

## Part 3 — Manifestation Charge System

**Core lib:** `src/lib/manifestationPowerSignals.ts`

### Data source

Table: `manifestation_power_daily_signals`  
One row per successful tool completion today (local calendar date via `manifestationPowerCalendarDateToday()`).

### Qualifying signal kinds (charge checkpoints)

| `signal_kind` | Recorded from |
|---|---|
| `affirm_visualize` | `Affirmations.tsx`, `AffirmationViewer.tsx` |
| `mirror_work` | `MirrorRehearsal.tsx`, `MirrorRehearsalAndroid.tsx` |
| `subliminal_listen` | `SubliminalAudioMobile.tsx` |
| `belief_view` | `Refactor.tsx` |

**Repeats count.** Three `affirm_visualize` rows today = 3 checkpoints. No dedup by kind.

### What does NOT affect charge status

- `user_double_progress` / Inspired Actions / embody practices
- `dailyPracticeCount`
- Any field other than today's qualifying signal rows + `manifestation_intensity`

Inspired Actions grid remains **visible** on Dashboard and Your Journey — it just does not drive the charge badge.

### Helpers (in `manifestationPowerSignals.ts`)

```ts
manifestationChargeCheckpointsFromSignalRows(rows) // count qualifying rows, no cap
manifestationChargeTargetFromIntensity(intensity)  // light=1, consistent=2, locked_in=3
manifestationChargePercent(checkpoints, target)    // 0–100 for display
manifestationMeterBarStyle(checkpoints, target)    // CSS width for meter fill
recordDailyManifestationSignal(kind)               // DO NOT CHANGE — inserts row + dispatches refresh
MANIFESTATION_POWER_METER_REFRESH_EVENT            // DO NOT CHANGE — same-tab meter refresh
```

### Status labels (intensity-aware)

| Condition | Label |
|---|---|
| 0 checkpoints today | **Needs Persistence** |
| ≥1 checkpoint but below intensity target | **Aligned** |
| Checkpoints ≥ intensity target | **Locked In** |

### Intensity targets

| `manifestation_intensity` | Target checkpoints |
|---|---|
| `light` | 1 |
| `consistent` (default if null) | 2 |
| `locked_in` | 3 |

---

## Part 4 — Dashboard.tsx

**File:** `src/pages/Dashboard.tsx`

### Load (`refreshManifestationChargeMeter`)

Parallel fetch:
1. `manifestation_power_daily_signals` for today → checkpoint count
2. `user_preferences.manifestation_intensity`
3. `profiles.manifestation_intensity` (fallback)

Prefs override profile.

### Display

- **Manifestation Charge** card with status badge, `{chargePct}% aligned today`, meter bar.
- `chargeTarget = manifestationChargeTargetFromIntensity(manifestationIntensity)`
- Card glow when `checkpoints >= chargeTarget` via `webDashboardManifestationCardClass(theme, checkpoints, chargeTarget)` and mobile equivalent.
- **Inspired Actions** section below meter — still loads `user_double_progress.completed_actions` for grid display only.

### Refresh

Listens for `MANIFESTATION_POWER_METER_REFRESH_EVENT` (fired by `recordDailyManifestationSignal` after insert).

---

## Part 5 — YourJourney.tsx

**File:** `src/pages/features/YourJourney.tsx`

Same charge logic as Dashboard:
- Loads intensity from prefs + profile fallback
- Status: Needs Persistence / Aligned / Locked In
- Meter uses `manifestationMeterBarStyle(checkpoints, chargeTarget)`
- Card glow when `checkpoints >= chargeTarget`
- Inspired Actions grid preserved (embody progress separate from charge)

Session cache key: `yourJourney_{userId}` in `sessionStorage`.

---

## Part 6 — Settings.tsx

**File:** `src/pages/Settings.tsx`

### What changed

- **Removed:** Old combined "Notification Preferences" card (App Notifications + Email Marketing).
- **Removed:** `handleToggleAppNotifications` and `app_notifications_enabled` load from Settings.

### What exists now

**Manifestation routine** card (Settings tab):
- Title: Manifestation routine
- Description: Adjust your manifestation intensity, routine expectations, and routine notifications.
- Button: **Routine & intensity**
- Route: `/dashboard/settings/manifestation-routine`

**Email preferences** card remains separate (email marketing toggle only).

Settings does **not** request push permission or write notification fields directly anymore.

---

## Part 7 — ManifestationRoutineSettings.tsx (Post-Onboarding)

**File:** `src/pages/ManifestationRoutineSettings.tsx`  
**Route:** `/dashboard/settings/manifestation-routine`

### Manages

| Field | Tables |
|---|---|
| `manifestation_intensity` | `user_preferences`, `profiles` |
| `manifest_routine_items` | `user_preferences`, `profiles` |
| `app_notifications_enabled` | `user_preferences`, `profiles` |
| `notification_permission_status` | `user_preferences`, `profiles` |

### Load

Reads both `user_preferences` and `profiles`, merges (prefs override profile).

Toggle reflects `app_notifications_enabled`. If `notification_permission_status === "denied"`, shows:

> Notifications are off at the device level. Your routine and charge will still work.

Routine and intensity are **not** disabled when permission is denied.

### Routine notifications toggle

Uses **existing** architecture — same as onboarding:

| Action | Behavior |
|---|---|
| **Enable (native)** | `requestOneSignalPushPermission(true)` → granted: dual-write `app_notifications_enabled=true`, `notification_permission_status=granted`, OneSignal tags. Denied: `app_notifications_enabled=false`, `notification_permission_status=denied`, tags. |
| **Enable (web)** | Dual-write `app_notifications_enabled=true` only. No invented web permission flow. |
| **Disable** | Dual-write `app_notifications_enabled=false` only. Does **not** overwrite `notification_permission_status`. OneSignal tag `notifications_enabled=false`. Does **not** touch intensity or routine items. |

### Intensity save

Updates intensity + routine item targets in both tables. OneSignal tags (native):
- `manifestation_intensity`
- `notifications_enabled` (current toggle state)
- `notification_permission_status` (current saved status)

### Does NOT

- Route to onboarding or ATT screen
- Use onboarding-only routes for post-onboarding changes

---

## Part 8 — Backend & Persistence

### Database columns (after migration)

**`user_preferences`:**
```sql
manifestation_intensity TEXT CHECK (light | consistent | locked_in)
manifest_routine_items JSONB DEFAULT '[]'
notification_permission_status TEXT CHECK (granted | denied | skipped)
app_notifications_enabled BOOLEAN  -- already existed
```

**`profiles`:** mirrors all four fields above.

### Setup draft fields (`src/lib/setupDraft.ts`)

| Draft field | DB / session mapping |
|---|---|
| `manifestationIntensity` | `manifestation_intensity` |
| `manifestRoutineItems` | `manifest_routine_items` |
| `appNotificationsConsent` | `app_notifications_enabled` / `app_notifications_consent` |
| `notificationPermissionStatus` | `notification_permission_status` |

**Do not change the meaning of `appNotificationsConsent`.**

### Activation paths (write prefs + profiles at account activation)

**Primary path (native + web RC paywall):**

| File | Role |
|---|---|
| `src/lib/gatherOnboardingPrefs.ts` | Collects setup draft + session → `onboarding_prefs` payload |
| `supabase/functions/sync-revenuecat-entitlement/index.ts` | **Only activation writer** for `manifestation_intensity`, `manifest_routine_items`, `app_notifications_enabled`, `notification_permission_status` on `user_preferences` + `profiles` |
| `src/lib/setupDraftBackendSync.ts` | Syncs draft to onboarding session (`app_notifications_consent`, `setup_journey_v1`) for session persistence — not the DB activation writer |

**Legacy (not used for manifestation routine / notifications):**

| File | Role |
|---|---|
| `supabase/functions/claim-onboarding-session/index.ts` | Legacy Stripe Checkout claim — **not invoked by current app**; does **not** write manifestation or notification fields |
| `supabase/functions/stripe-webhook/index.ts` | Legacy Stripe Checkout + subscription lifecycle — does **not** write manifestation or notification fields |

Current paywall: **RevenueCat** (native StoreKit/Play Billing + web RC Web Billing). Stripe is RC’s payment processor, not a separate app-owned Stripe Checkout flow.

### Onboarding session JSON shape

Written to `onboarding_answers.setup_journey_v1`:
```json
{
  "manifestation_intensity": "consistent",
  "manifest_routine_items": [ { "slug": "affirmations", "label": "…", "cadence": "daily", "target_per_week": 5 } ],
  "notification_permission_status": "granted"
}
```

`app_notifications_consent` is a **top-level** column on `onboarding_sessions` (not inside `setup_journey_v1`).

---

## Part 9 — OneSignal Integration

**Service:** `src/services/oneSignal.ts`

| Function | Used by |
|---|---|
| `bootstrapOneSignal()` | `src/main.tsx` on app start |
| `requestOneSignalPushPermission(fallbackToSettings?)` | ManifestationIntensity onboarding, ManifestationRoutineSettings |
| `oneSignalLogin(userId)` | `AuthContext` after auth |
| `oneSignalLogout()` | `AuthContext` on sign-out |

### Tags synced (string values)

| Tag | When |
|---|---|
| `manifestation_intensity` | Onboarding set routine, settings intensity save |
| `notifications_enabled` | `"true"` / `"false"` on consent change |
| `notification_permission_status` | `"granted"` / `"denied"` / `"skipped"` |

### Permission call sites (current — updated from older handoff)

| File | Trigger |
|---|---|
| `ManifestationIntensity.tsx` | "Set my routine" on native |
| `ManifestationRoutineSettings.tsx` | User enables routine notifications on native |

**NOT called from:** `NotificationPrePermission.tsx`, `Settings.tsx` (toggle removed).

See also: `onesignal-handoff.md` for broader OneSignal SDK state (some sections there are outdated on call sites — this doc is authoritative for manifestation routine permission routing).

---

## Part 10 — Card Styling

**File:** `src/lib/dashboardThemeStyles.ts`

- `webDashboardManifestationCardClass(theme, checkpoints, target?)` — glow when `checkpoints >= target`
- `dashboardMobileManifestationCardClass(theme, checkpoints, target?)` — same for mobile dashboard card
- `manifestationStatusBadgeClass`, `manifestationMeterBarClass`, meter track classes unchanged

---

## File Index

| Area | Path |
|---|---|
| Onboarding intensity | `src/pages/onboarding/setup/ManifestationIntensity.tsx` |
| ATT only | `src/pages/onboarding/setup/NotificationPrePermission.tsx` |
| Setup exports | `src/pages/onboarding/setup/index.ts` |
| Flow routes | `src/lib/onboardingFlow.ts`, `src/lib/onboardingBottomSceneRoutes.ts` |
| Setup draft | `src/lib/setupDraft.ts` |
| Session sync | `src/lib/setupDraftBackendSync.ts` |
| Activation prefs | `src/lib/gatherOnboardingPrefs.ts` |
| Charge signals | `src/lib/manifestationPowerSignals.ts` |
| Dashboard | `src/pages/Dashboard.tsx` |
| Your Journey | `src/pages/features/YourJourney.tsx` |
| Settings link | `src/pages/Settings.tsx` |
| Routine settings | `src/pages/ManifestationRoutineSettings.tsx` |
| OneSignal service | `src/services/oneSignal.ts` |
| Card styles | `src/lib/dashboardThemeStyles.ts` |
| App routes | `src/App.tsx` |
| Migration (not applied) | `supabase/migrations/20260604210000_user_preferences_manifestation_routine.sql` |
| RC entitlement sync | `supabase/functions/sync-revenuecat-entitlement/index.ts` |

---

## Explicitly Unchanged (Do Not Touch)

- `recordDailyManifestationSignal()` implementation
- `manifestation_power_daily_signals` table schema
- Signal recording call sites (Affirmations, Mirror, Subliminal, Refactor)
- `MANIFESTATION_POWER_METER_REFRESH_EVENT` name/behavior
- ATT screen placement and tracking-only behavior
- Email marketing toggle in Settings (separate from routine notifications)

---

## Test Checklist

### Migration
- [ ] Apply `20260604210000_user_preferences_manifestation_routine.sql`
- [ ] Verify columns exist on `user_preferences` and `profiles`

### Onboarding (native iOS)
- [ ] Guide → Manifestation intensity → ATT → Tool preference
- [ ] "Set my routine" requests push permission; denied still continues
- [ ] "Not now" saves skipped consent, no OS prompt
- [ ] Draft + session receive intensity, routine items, consent fields

### Onboarding (native Android)
- [ ] Skips ATT; intensity → tool preference

### Onboarding (web fast)
- [ ] Begin journey → Manifestation intensity → path loading
- [ ] No ATT, no push prompt

### Activation
- [ ] After paywall/claim, `user_preferences` and `profiles` have intensity + routine + notification fields

### Post-onboarding settings
- [ ] Settings → Routine & intensity → `/dashboard/settings/manifestation-routine`
- [ ] Intensity save dual-writes both tables
- [ ] Enable notifications (native) uses OneSignal permission flow
- [ ] Disable notifications does not erase intensity/routine or overwrite permission status
- [ ] Denied copy shows; routine still visible

### Manifestation Charge
- [ ] light user: Locked In at 1 qualifying signal today
- [ ] consistent user: Locked In at 2
- [ ] locked_in user: Locked In at 3
- [ ] Repeats of same kind count (e.g. 3 affirm views = 3 checkpoints)
- [ ] Inspired Actions grid still renders; does not change charge badge
- [ ] Meter refreshes after tool use without full page reload

### OneSignal
- [ ] Tags update on onboarding and settings changes (native)
- [ ] `VITE_ONESIGNAL_APP_ID` set in env

---

## Summary

| Capability | Status |
|---|---|
| Manifestation intensity onboarding screen | ✅ Built |
| Push permission on intensity screen (native) | ✅ Uses `requestOneSignalPushPermission` |
| ATT screen stripped to tracking only | ✅ Built |
| Post-onboarding routine settings page | ✅ Built |
| Settings links to routine page (no app-notif toggle) | ✅ Built |
| Charge driven by signals + intensity | ✅ Dashboard + Your Journey |
| Dual-write prefs + profiles | ✅ Code ready |
| DB migration | ⚠️ **Not applied yet** |
| OneSignal tags for intensity + notifications | ✅ Wired on native |
