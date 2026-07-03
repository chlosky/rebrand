# Manifestation Charge, Intensity & Settings — Handoff

**Date:** June 7, 2026  
**App:** Palette Plotting (BCN)  
**Branch:** `Mobile-app` (latest relevant commits: `b02e1743` notification permission, `23e7cb39` PostPaywallLoading fix)  
**iOS build:** 236  

**Purpose:** Handoff for **Manifestation Charge** (daily meter), **manifesting intensity** (onboarding + DB), and **Settings → Manifestation routine** subpage. Use this doc as the source of truth for those three areas.

**Related docs:** `manifestation-routine-handoff.md` (broader ATT/onboarding flow), `docs/ONESIGNAL.md`, `onesignal-handoff.md`.

---

## Architecture principles (do not break)

1. **Intensity drives charge target** — not notifications, not embody, not Inspired Actions.
2. **Notifications support the routine; they do not define it.** Turning off push must never erase intensity, routine items, or charge logic.
3. **Dual-write** routine + notification fields to **`user_preferences`** and **`profiles`** (prefs win on read when merged).
4. **Intensity / routine is not on `user_setup_path`.** Lives in prefs/profiles + onboarding session JSON (`setup_journey_v1`).
5. **Charge = count of qualifying rows** in `manifestation_power_daily_signals` for **today (local timezone)** vs intensity target.
6. **No new shared helper modules** for one-off wiring — extend existing files inline.

---

## Part 1 — Manifestation Charge

### What it is

A daily progress meter shown on **Dashboard** and **Your Journey**. Users fill “checkpoints” by completing qualifying tool sessions. Target checkpoints depend on `manifestation_intensity`.

| Intensity | Daily charge target |
|-----------|---------------------|
| `light` | 1 |
| `consistent` (default if unset) | 2 |
| `locked_in` | 3 |

### Core logic — `src/lib/manifestationPowerSignals.ts`

| Export | Role |
|--------|------|
| `MANIFESTATION_CHARGE_SIGNAL_KINDS` | Only these DB `signal_kind` values count |
| `manifestationChargeCheckpointsFromSignalRows(rows)` | Count qualifying rows today (repeats count; not deduped) |
| `manifestationChargeTargetFromIntensity(intensity)` | Returns 1 / 2 / 3 |
| `manifestationChargePercent(checkpoints, target)` | 0–100 for “X% aligned today” |
| `manifestationPowerCalendarDateToday()` | Local `YYYY-MM-DD` for queries + inserts |
| `recordDailyManifestationSignal(kind)` | Insert row + dispatch meter refresh + bump activity stats |
| `manifestationMeterBarStyle(checkpoints, target)` | Inline width % for meter fill |
| `MANIFESTATION_POWER_METER_REFRESH_EVENT` | CustomEvent for same-tab refresh |
| `dispatchManifestationPowerMeterRefresh()` | Fires that event after insert |

**Qualifying signal kinds:**

| `signal_kind` | Fired from |
|---------------|------------|
| `affirm_visualize` | `Affirmations.tsx`, `AffirmationViewer.tsx` |
| `mirror_work` | `MirrorRehearsal.tsx`, `MirrorRehearsalAndroid.tsx` |
| `subliminal_listen` | `SubliminalAudioMobile.tsx` |
| `belief_view` | `Refactor.tsx` |

### Status labels (Dashboard + Your Journey)

```ts
checkpoints <= 0           → "Needs Persistence"
checkpoints >= chargeTarget → "Locked In"
else                       → "Aligned"
```

Display: **“{pct}% aligned today”** where `pct = manifestationChargePercent(checkpoints, target)`.

### UI locations

| Surface | File | Refresh trigger |
|---------|------|-----------------|
| Dashboard (desktop + mobile) | `src/pages/Dashboard.tsx` | `refreshManifestationChargeMeter()` on mount, tab visibility, `MANIFESTATION_POWER_METER_REFRESH_EVENT` |
| Your Journey | `src/pages/features/YourJourney.tsx` | Same pattern in `load()` |
| Meter styling | `src/lib/dashboardThemeStyles.ts` | `manifestationChargeZapIconClass`, `manifestationStatusBadgeClass`, `manifestationMeterBarClass`, `webDashboardManifestationCardClass` |

**Dashboard load query (simplified):**

```ts
// Parallel:
manifestation_power_daily_signals  → signal_kind WHERE user_id + signal_date = todayLocal
user_preferences                 → manifestation_intensity
profiles                         → manifestation_intensity  // fallback
```

Intensity: `prefs.manifestation_intensity ?? profile.manifestation_intensity ?? null` → defaults target to **2** (consistent).

### Database

**Table:** `manifestation_power_daily_signals`

| Column | Notes |
|--------|-------|
| `user_id` | Supabase auth UUID |
| `signal_date` | `date`, local calendar day as string |
| `signal_kind` | One of four kinds above |

**Migrations (apply in prod if charge broken):**

- `20260509120000_manifestation_power_daily_signals.sql` — base table
- `20260510140000` … `20260522140000` — allow multiple same-kind per day, four kinds only, drop broken unique constraint

**Common insert errors:**

- `23505` — old UNIQUE still present → apply `20260522140000_drop_manifestation_power_unique_truncated_name.sql`
- `23514` — CHECK missing kind → apply charge kind migrations

### What does NOT affect charge

- `app_notifications_enabled` / push / OneSignal tags
- `manifest_routine_items` weekly targets (journey display only; charge uses daily signals)
- Embody / Inspired Actions / `user_double_progress` (separate journey UI)

---

## Part 2 — Manifesting intensity (onboarding)

### Screen

**File:** `src/pages/onboarding/setup/ManifestationIntensity.tsx`  
**Routes:** `/onboarding/setup/manifestation-intensity`, `/onboarding/suite/setup/manifestation-intensity`  
**Export name:** `SetupManifestationIntensity`

### Flow position

| Funnel | Order |
|--------|-------|
| Native suite (iOS) | Guide → **Intensity** → ATT (`NotificationPrePermission`) → Tool preference → … |
| Native suite (Android) | Guide → **Intensity** → Tool preference (no ATT) |
| Web fast | Begin journey → **Intensity** → Path loading |

### Copy (current)

**Header**

- Title: **Choose your manifesting intensity**
- Subtitle: **Set your routine intensity and optional notifications.**
- Continue: **Set my routine**

**Intensity tiles**

| ID | Title | Tagline | Description |
|----|-------|---------|-------------|
| `light` | Light | The recommended routine. | Light integration of manifesting, with daily notifications, if opted into. |
| `consistent` | Consistent | For experienced manifestors. | More moderate manifesting intensity. 2x daily notifications, if selected. |
| `locked_in` | Locked In | The highest-intensity routine. | For more intense manifesting goals. 3x daily notifications, if opted into. |

**Notifications block**

- Question: **Do you want in-app & push notifications to bring you back to the app for your routine?**
- Helper: **Notifications support your routine — they nudge you back into daily practice at the intensity you choose.**
- Choices: **Yes** / **Not now**
- If Yes: **Daily notifications time** + time pickers
- Footer: **You can customize your routine further in Settings.**

**Alert defaults (24h `HH:mm`)**

| Intensity | Times | Labels |
|-----------|-------|--------|
| `light` | `21:30` | Alert |
| `consistent` | `07:00`, `21:30` | 1st Alert, 2nd Alert |
| `locked_in` | `07:00`, `18:30`, `21:30` | 1st Alert, 2nd Alert, 3rd Alert |

### On continue (`persistAndContinue`)

1. Builds `manifestRoutineItems[]` from setup draft `toolPreferences` + intensity (affirmations, subliminals, mirror, belief, guide, progress — with per-slug cadence/targets).
2. If **Yes** + native: `requestOneSignalPushPermission(true)` → sets `appNotificationsConsent` + `notificationPermissionStatus` (`granted` / `denied`).
3. If **Not now**: `appNotificationsConsent: false`, `notificationPermissionStatus: "skipped"`, **no OS prompt**.
4. `writeSetupDraft({ ... }, { awaitBackendSync: true })` → localStorage + onboarding session + logged-in `user_setup_path` if applicable.
5. Native: `syncManifestationRoutineOneSignalTags(...)`.
6. Navigate to next route (ATT on iOS suite, else tool-preference or plot-loading).

### Post-paywall persistence

On purchase, `gatherOnboardingPrefs()` (`src/lib/gatherOnboardingPrefs.ts`) reads setup draft and sends to **`sync-revenuecat-entitlement`** edge function, which dual-writes:

- `manifestation_intensity`
- `manifest_routine_items`
- `app_notifications_enabled` (from `appNotificationsConsent`)
- `notification_permission_status`
- `routine_notification_times`

---

## Part 3 — Settings.tsx entry + subpage

### Settings card — `src/pages/Settings.tsx`

Located under **Settings** tab (`TabsContent value="settings"`).

| Element | Copy |
|---------|------|
| Card title | **Manifestation routine** (Zap icon) |
| Card description | Adjust your manifestation intensity, routine expectations, and routine notifications. |
| Button primary | **Routine & intensity** |
| Button secondary | Set routine intensity & notifications |
| Navigation | `navigate("/dashboard/settings/manifestation-routine")` |

**Note:** Email/SMS toggles in Settings are **marketing** — separate from routine push.

### Route — `src/App.tsx`

```tsx
<Route path="settings/manifestation-routine" element={<ManifestationRoutineSettings />} />
```

Full path: `/dashboard/settings/manifestation-routine`

### Subpage — `src/pages/ManifestationRoutineSettings.tsx`

Standalone tool-page shell (desktop sidebar + mobile sticky header + back to `/dashboard/settings`).

#### Header

- Title: **Manifestation routine**
- Subtitle: **Manifesting intensity and routine notifications**

#### Section 1 — Manifesting intensity

- Section title: **Manifesting intensity**
- Helper: **Adjust your manifesting intensity**
- Same three tiles as onboarding (Light / Consistent / Locked In)
- Changing intensity resets alert times to defaults for that level
- **Save intensity** button (only when selection ≠ saved) → dual-write:
  - `manifestation_intensity`
  - `manifest_routine_items` (recomputed targets from current items)
  - `routine_notification_times` (if notifications on)
- OneSignal tag sync on save (native)

#### Section 2 — Routine notifications

- Section title: **Routine notifications**
- Helper: Notifications support your routine… separate from email marketing in Settings.
- Toggle label: **In-app & push reminders**
- If on: **Daily notifications time** + per-slot time inputs (auto-save on change)
- If `notification_permission_status === "denied"`: device-level hint (routine/charge still work)

#### Load behavior

Parallel read `user_preferences` + `profiles`, merge (prefs override). Fields:

```
manifestation_intensity, manifest_routine_items, app_notifications_enabled,
notification_permission_status, routine_notification_times
```

#### Toggle ON (native)

1. `requestOneSignalPushPermission(permissionStatus === "denied")`
   - Skipped onboarding → OS prompt via `canRequestPermission`
   - Previously denied → may open iOS Settings
   - Capacitor fallback if OneSignal App ID missing
2. Granted → dual-write `app_notifications_enabled: true`, `notification_permission_status: "granted"`, sync tags, persist alert times
3. Denied → revert toggle, write `denied`, toast

#### Toggle OFF

Dual-write `app_notifications_enabled: false` only. Does **not** clear `notification_permission_status` or intensity.

#### Web/PWA toggle ON

Skips OS permission; writes `app_notifications_enabled: true` to both tables.

---

## Part 4 — Database columns & migrations

### Required for intensity + settings (apply in Supabase prod)

| Migration | Adds |
|-----------|------|
| `20260604210000_user_preferences_manifestation_routine.sql` | `manifestation_intensity`, `manifest_routine_items`, `notification_permission_status`; profile mirrors + `app_notifications_enabled` |
| `20260607120000_routine_notification_times.sql` | `routine_notification_times` JSONB on prefs + profiles |

### Column reference

| Column | Tables | Values / notes |
|--------|--------|----------------|
| `manifestation_intensity` | prefs, profiles | `light` \| `consistent` \| `locked_in` |
| `manifest_routine_items` | prefs, profiles | JSON array of `{ slug, label, cadence, target_per_week }` |
| `app_notifications_enabled` | prefs, profiles | boolean — user wants routine reminders |
| `notification_permission_status` | prefs, profiles | `granted` \| `denied` \| `skipped` |
| `routine_notification_times` | prefs, profiles | `["HH:mm", ...]` length 1/2/3 by intensity |

---

## Part 5 — OneSignal (native only)

**File:** `src/services/oneSignal.ts`  
**Build env:** `VITE_ONESIGNAL_APP_ID` (Codemagic Production group)  
**iOS:** `App.entitlements` includes `aps-environment: production`

**Tags set by `syncManifestationRoutineOneSignalTags`:**

| Tag | Example |
|-----|---------|
| `manifestation_intensity` | `consistent` |
| `notifications_enabled` | `true` / `false` |
| `notification_permission_status` | `granted` / `denied` / `skipped` |
| `routine_alert_count` | `2` |
| `routine_notification_times` | `07:00,21:30` |
| `routine_alert_1` … `routine_alert_3` | individual times |

**Call sites:** onboarding intensity, settings subpage, `AuthContext` on login (refresh tags from DB).

**Delivery:** App sets tags only. Scheduled sends require OneSignal dashboard Journeys + APNs/FCM credentials.

---

## Part 6 — File map (quick reference)

| Area | Primary files |
|------|----------------|
| Charge logic | `src/lib/manifestationPowerSignals.ts` |
| Charge UI | `src/pages/Dashboard.tsx`, `src/pages/features/YourJourney.tsx` |
| Charge styling | `src/lib/dashboardThemeStyles.ts` |
| Intensity onboarding | `src/pages/onboarding/setup/ManifestationIntensity.tsx` |
| Setup draft types | `src/lib/setupDraft.ts` |
| Onboarding → paywall prefs | `src/lib/gatherOnboardingPrefs.ts`, `src/lib/setupDraftBackendSync.ts` |
| Settings entry | `src/pages/Settings.tsx` (~lines 883–913) |
| Settings subpage | `src/pages/ManifestationRoutineSettings.tsx` |
| Route | `src/App.tsx` |
| OneSignal | `src/services/oneSignal.ts`, `src/contexts/AuthContext.tsx` |
| Edge activation | `supabase/functions/sync-revenuecat-entitlement/index.ts` |

---

## Part 7 — Behavior matrix (settings vs onboarding)

| Action | DB fields touched | Charge affected? | OS prompt? |
|--------|-------------------|------------------|------------|
| Onboarding: pick intensity + Not now | intensity, routine items, `app_notifications_enabled=false`, `permission_status=skipped` | Yes (target on next dashboard load) | No |
| Onboarding: pick intensity + Yes (native) | + consent true, permission granted/denied, alert times | Yes | Yes (if Yes) |
| Settings: Save intensity | intensity, routine items, alert times if notifs on | Yes (target changes) | No |
| Settings: Toggle notifs ON (native, was skipped) | consent true, permission granted/denied, alert times | No | Yes |
| Settings: Toggle notifs OFF | `app_notifications_enabled=false` only | No | No |

---

## Part 8 — Testing checklist

- [ ] Migrations `20260604210000` + `20260607120000` applied in prod
- [ ] Charge migrations through `20260522140000` applied
- [ ] Onboarding intensity saves to draft; after paywall, prefs/profiles populated
- [ ] Dashboard meter: 0 → Needs Persistence; partial → Aligned; at target → Locked In
- [ ] Affirmation / mirror / subliminal / belief view increments meter same day
- [ ] Settings subpage loads without column errors
- [ ] Toggle ON after “Not now” shows OS permission (build 236+)
- [ ] Intensity change requires Save; notification toggle is immediate
- [ ] `VITE_ONESIGNAL_APP_ID` set in Codemagic for tag sync + permission

---

## Part 9 — Known gaps / out of scope

- Admin overview migrations (`20260607130000`, `20260607140000`) — local only, not deployed
- OneSignal Journeys for alert-time delivery — dashboard config, not app code
- `manifest_routine_items` weekly targets on Your Journey — display/routine UX; charge uses daily signals only
