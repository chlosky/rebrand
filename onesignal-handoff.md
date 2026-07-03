# OneSignal — State of Integration Handoff
**Date:** June 3, 2026
**App:** Palette Plotting (Capacitor iOS + Android)
**Purpose:** Full picture of what is wired, what is missing, and what questions to answer before using OneSignal for push campaigns.

---

## What Is Already In Place

### Plugin
- `@onesignal/capacitor-plugin` installed in `package.json`
- `OneSignalCapacitorPlugin` registered in `ios/App/App/capacitor.config.json` `packageClassList`
- Registered in `android/app/src/main/assets/capacitor.plugins.json`

### Service: `src/services/oneSignal.ts`
Full service file. Exports:

| Function | What it does |
|---|---|
| `bootstrapOneSignal()` | Calls `OneSignal.initialize({ appId })` once. Reads App ID from `VITE_ONESIGNAL_APP_ID`. No-op on web. |
| `attachOneSignalListenersOnce()` | Attaches foreground notification listener (shows toast), notification click listener (follows URL), in-app message click listener (follows URL). |
| `requestOneSignalPushPermission(fallbackToSettings?)` | Shows OS permission dialog. Bootstraps first. Returns boolean. **Exported but not called anywhere yet.** |
| `oneSignalLogin(externalId)` | Calls `OneSignal.login(userId)` to tie Supabase UUID to OneSignal user. |
| `oneSignalLogout()` | Calls `OneSignal.logout()` on sign-out. |

### Bootstrap: `src/main.tsx`
Called on app start, before React renders:
```ts
void bootstrapOneSignal()
  .then(() => attachOneSignalListenersOnce())
  .catch((e) => console.warn("[OneSignal] init failed:", e));
```

### Identity: `src/contexts/AuthContext.tsx`
After auth state resolves with a user:
```ts
oneSignalLogin(user.id).catch(...)
```
On logout:
```ts
oneSignalLogout().catch(...)
```
So OneSignal user identity is linked to the Supabase UUID automatically.

### Permission prompt call sites
| File | Trigger |
|---|---|
| `src/pages/onboarding/setup/NotificationPrePermission.tsx` | User taps "Allow" in the pre-permission onboarding step. Calls `requestNativePushPermission()` (Capacitor PushNotifications, **not** OneSignal). |
| `src/pages/Settings.tsx` | User toggles notifications on. Also calls `requestNativePushPermission()` (Capacitor PushNotifications, **not** OneSignal). |

**Note:** Both call sites use `requestNativePushPermission()` from `pushNotifications.ts` (raw Capacitor `PushNotifications.requestPermissions()`), not `requestOneSignalPushPermission()` from `oneSignal.ts`. OneSignal's own permission request is exported but unused.

---

## Environment Variable

```
VITE_ONESIGNAL_APP_ID=
```

Defined in `.env.example`. Must be populated in the real `.env` / CI environment for OneSignal to initialize. If missing, `bootstrapOneSignal()` logs a warning and returns early — the app does not crash.

---

## What Is Missing / Open Questions

### 1. Permission request is split between two systems
The app calls `PushNotifications.requestPermissions()` (Capacitor's raw plugin) at the onboarding and settings call sites, but OneSignal has its own `Notifications.requestPermission()` which it uses to register the device with OneSignal's backend.

**Risk:** The OS permission dialog may fire via Capacitor, the user grants it, but OneSignal never receives the token because `requestOneSignalPushPermission()` was never called. The user is opted in at the OS level but invisible to OneSignal.

**Fix:** Replace `requestNativePushPermission()` call sites with `requestOneSignalPushPermission()` from `oneSignal.ts`, or call both in sequence.

### 2. No push token stored in the app's own DB
There is a `user_push_tokens` table (from migration `20260123000000_create_user_push_tokens.sql`) but nothing in the current codebase writes to it after OneSignal registers. OneSignal manages its own device registry — this may be fine if you only send via the OneSignal dashboard/API and don't need push tokens server-side.

### 3. No server-side send wired
There is no edge function or backend code that sends a OneSignal push. All sending would currently have to happen via the OneSignal dashboard or REST API manually.

### 4. In-app messages
The in-app message click listener is wired (`InAppMessages.addEventListener("click", ...)`). In-app messages are configured entirely in the OneSignal dashboard — no code changes needed to show them, assuming the App ID is correct and the user is identified.

---

## Summary: What Works Today vs. What Needs Work

| Capability | Status |
|---|---|
| SDK initializes on app launch | ✅ Working |
| User identity linked (Supabase UUID → OneSignal) | ✅ Working |
| Foreground notification toasts | ✅ Working |
| Notification click → URL navigation | ✅ Working |
| In-app message click → URL navigation | ✅ Working |
| OS push permission actually registers with OneSignal | ⚠️ Likely broken — wrong call site |
| Server-side push send (edge function) | ❌ Not built |
| Push tokens stored in app DB | ❌ Not written (may not be needed) |
| `VITE_ONESIGNAL_APP_ID` set in prod env | ❓ Needs confirmation |
