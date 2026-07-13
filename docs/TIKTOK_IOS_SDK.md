# TikTok App Events SDK (iOS native)

Palette Plotting initializes the [TikTok Business iOS SDK](https://github.com/tiktok/tiktok-business-ios-sdk) on app launch. It auto-logs **Install**, **Launch**, **Retention**, and **Purchase** (StoreKit) when configured.

Official references:

- [How to integrate TikTok App Events SDK](https://ads.tiktok.com/help/article/how-to-integrate-tiktok-app-events-sdk)
- [TikTok Business iOS SDK (GitHub)](https://github.com/tiktok/tiktok-business-ios-sdk) — sample init in `TikTokBusinessSDKTestApp/InitViewController.swift`

TikTok does **not** publish Codemagic YAML or custom Info.plist key names. Credentials are passed in code via:

```swift
TikTokConfig(accessToken: appSecret, appId: appId, tiktokAppId: tiktokAppId)
TikTokBusiness.initializeSdk(config)
```

We store the three values in `Info.plist` at CI time so secrets are not committed to git.

## 1. TikTok Events Manager (Initialize app screen)

From **Tools → Events Manager → your iOS app → SDK setup**:

| TikTok UI label | SDK parameter | Info.plist key (CI inject only) |
|-----------------|---------------|----------------------------------|
| **App Secret** | `accessToken` | `TikTokAccessToken` |
| **App ID** (numeric from Events Manager) | `appId` | `TikTokAppId` |
| **TikTok App ID** (long numeric id) | `tiktokAppId` | `TikTokTikTokAppId` |

Do **not** use:

- Bundle id (`com.paletteplotting.app`) for `appId` — SDK expects the numeric **App ID** from Events Manager.
- Web pixel id for `tiktokAppId` — that is website-only (`index.html`).

## 2. Local Xcode / Info.plist

Edit `ios/App/App/Info.plist` (or inject via Codemagic for release):

| Key | Value |
|-----|--------|
| `TikTokAccessToken` | App Secret |
| `TikTokAppId` | App ID (numeric) |
| `TikTokTikTokAppId` | TikTok App ID |

While values are `REPLACE_*`, the SDK does not initialize (safe for local dev).

`NSUserTrackingUsageDescription` is required for ATT (same as TikTok test app `Info.plist`).

## 3. Codemagic (recommended for release)

In **Codemagic → Environment variables** (mark **Secure**), on the **Production** group:

| Codemagic variable | TikTok Events Manager source | Info.plist key |
|--------------------|------------------------------|----------------|
| `TIKTOK_IOS_APP_SECRET` | App Secret | `TikTokAccessToken` |
| `TIKTOK_IOS_APP_ID` | App ID (numeric) | `TikTokAppId` |
| `TIKTOK_IOS_TIKTOK_APP_ID` | TikTok App ID | `TikTokTikTokAppId` |

Legacy alias: `TIKTOK_IOS_ACCESS_TOKEN` is still accepted as App Secret if `TIKTOK_IOS_APP_SECRET` is unset.

Both **`ios-workflow`** (App Store) and **`ios-simulator-workflow`** inject after `cap sync ios`, then verify `NSUserTrackingUsageDescription` and that all three keys are non-placeholder. Values are never printed in logs.

**Xcode:** `-ObjC` and `-lc++` in `OTHER_LDFLAGS`; SDK via Swift Package Manager (`tiktok-business-ios-sdk` ≥ 1.6.0).

## 4. Verify in TikTok

1. Ship a TestFlight build with all three secrets injected.
2. On a **physical device**, open the app and accept ATT if prompted.
3. In Events Manager, use **Test event** (recommended) or debug mode — [TikTok help § Step 5](https://ads.tiktok.com/help/article/how-to-integrate-tiktok-app-events-sdk).
4. **Pending verification** should clear after TikTok receives Launch/Install.

## 5. SKAN

If TikTok SDK updates SKAN conversion values (no MMP), configure SKAN schema in Events Manager. If another SDK owns SKAN, call `disableSKAdNetworkSupport()` on config per TikTok docs.

## 6. Web vs app

- **Website:** TikTok Pixel in `index.html` (separate data source).
- **iOS app:** This native SDK only, after a store build with injected credentials.
