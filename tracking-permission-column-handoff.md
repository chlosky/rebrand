# Tracking Permission Column Handoff

## Current Decision

For this build, tracking permission metadata is **not** saved into `onboarding_answers`.

It is saved into nullable columns on `onboarding_sessions`:

- `tracking_pre_permission_choice TEXT`
- `tracking_authorization_status TEXT`
- `tracking_permission_asked_at TIMESTAMPTZ`

This avoids any risk of overwriting nested `onboarding_answers` JSON.

## Migration

`supabase/migrations/20260602150000_add_tracking_permission_onboarding_session_columns.sql`

```sql
ALTER TABLE public.onboarding_sessions
  ADD COLUMN IF NOT EXISTS tracking_pre_permission_choice TEXT,
  ADD COLUMN IF NOT EXISTS tracking_authorization_status TEXT,
  ADD COLUMN IF NOT EXISTS tracking_permission_asked_at TIMESTAMPTZ;
```

## App Behavior

In `src/pages/onboarding/setup/NotificationPrePermission.tsx`:

- Yes sets `trackingPrePermissionChoice: "yes"`, requests Apple ATT, then saves the returned status.
- No sets `trackingPrePermissionChoice: "no"` and `trackingAuthorizationStatus: "notRequested"`.
- Both paths save locally through `writeSetupDraft`.
- Continue writes the same values again with the notification choice.

## Backend Sync

In `src/lib/setupDraftBackendSync.ts`, tracking fields are direct patch fields:

```ts
if (draft.trackingPrePermissionChoice === "yes" || draft.trackingPrePermissionChoice === "no") {
  patch.tracking_pre_permission_choice = draft.trackingPrePermissionChoice;
}
if (typeof draft.trackingAuthorizationStatus === "string") {
  patch.tracking_authorization_status = draft.trackingAuthorizationStatus;
}
if (typeof draft.trackingPermissionAskedAt === "string") {
  patch.tracking_permission_asked_at = draft.trackingPermissionAskedAt;
}
```

The email save paths also patch these same direct fields:

- `src/pages/onboarding/setup/Email.tsx`
- `src/pages/onboarding/subliminal/SubliminalEmail.tsx`

## Edge Function

`supabase/functions/update-onboarding-session/index.ts` accepts and updates:

```ts
tracking_pre_permission_choice?: string | null;
tracking_authorization_status?: string | null;
tracking_permission_asked_at?: string | null;
```

These are written as top-level `onboarding_sessions` columns, not nested JSON.

## ATT Prompt

The Apple prompt is requested only in:

`ios/App/CapApp-SPM/Sources/CapApp-SPM/TrackingAuthorizationPlugin.swift`

```swift
ATTrackingManager.requestTrackingAuthorization { status in
    DispatchQueue.main.async {
        call.resolve(["status": self.mapStatus(status)])
    }
}
```

`ios/App/App/TikTokSdkBootstrap.swift` no longer contains the old TikTok ATT wrapper. TikTok initialization remains separate in `AppDelegate.swift`.
