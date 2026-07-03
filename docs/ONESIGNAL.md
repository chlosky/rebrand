## OneSignal (push + in-app) — native apps

Palette Plotting uses OneSignal for:
- **Push notifications** (lock screen / notification center)
- **In-app messages** (shown while the app is open)

### 1) Required build environment variable (Codemagic)

Set this in Codemagic environment variables (encrypted):

- `VITE_ONESIGNAL_APP_ID` — OneSignal App ID (Dashboard → Settings → Keys & IDs)

This is read at runtime in `src/services/oneSignal.ts`.

### 2) OneSignal dashboard setup (required for delivery)

You still must configure platform credentials in OneSignal:
- **iOS (APNs)**: p8 token (recommended) or certificate
- **Android (FCM)**: Firebase credentials

### 3) User identity mapping

When a user is signed in, the app calls `OneSignal.login(<supabase_uuid>)` so you can target messages to a user across devices.
On logout, it calls `OneSignal.logout()`.

