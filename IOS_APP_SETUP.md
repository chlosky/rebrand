# iOS App Setup Guide

This guide will help you build and submit the Palette Plotting iOS app to the App Store.

## ✅ What's Already Done

- ✅ Capacitor installed and configured
- ✅ iOS project initialized
- ✅ Camera and microphone permissions configured
- ✅ Build scripts added to package.json
- ✅ Web assets synced to iOS project

## 📋 Prerequisites

1. **Apple Developer Account** ($99/year)
   - Sign up at https://developer.apple.com
   - You'll need this for code signing and App Store submission

2. **Xcode** (if building locally)
   - Download from Mac App Store
   - Requires macOS Ventura (13.0) or later
   - **OR** use cloud build service (see below)

## 🚀 Build Options

### Option 1: Cloud Build (Recommended - No Mac Required)

Use a cloud build service to build without Xcode:

**Ionic Appflow:**
```bash
npm install -g @ionic/cli
ionic login
ionic link
ionic build ios --prod
```

**Codemagic:**
- Connect your GitHub repo
- Use their iOS build template
- Automatically handles certificates

### Option 2: Local Build (Requires Mac with Xcode)

1. **Build web assets:**
   ```bash
   npm run build
   ```

2. **Sync to iOS:**
   ```bash
   npm run cap:sync
   ```

3. **Open in Xcode:**
   ```bash
   npm run cap:ios
   ```
   Or manually: Open `ios/App/App.xcworkspace` in Xcode

4. **Configure in Xcode:**
   - Select your development team in Signing & Capabilities
   - Set Bundle Identifier (currently: `com.paletteplotting.app`)
   - Configure version and build number

5. **Build and Archive:**
   - Product → Archive
   - Distribute App → App Store Connect
   - Follow App Store Connect submission flow

## 📱 App Store Connect Setup

1. **Create App:**
   - Go to https://appstoreconnect.apple.com
   - My Apps → + → New App
   - Fill in app information

2. **Required Information:**
   - App Name: Palette Plotting
   - Primary Language: English
   - Bundle ID: com.paletteplotting.app
   - SKU: (unique identifier, e.g., `paletteplotting-ios-001`)

3. **App Information:**
   - Category: Health & Fitness or Lifestyle
   - Age Rating: Complete questionnaire
   - Privacy Policy URL: https://paletteplot.com/privacy

4. **Screenshots:**
   - Required sizes: 6.7", 6.5", 5.5" displays
   - Can use simulator or device screenshots

5. **App Review Information:**
   - Demo account (if needed)
   - Contact information
   - Notes for reviewer

## 🔧 Configuration

### App Icons (App Store / home screen)
`ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` must come from **`public/apple-ios-logo.png`** (opaque, white edges as Apple expects).

**Never** use `public/welcome-logo.png` for AppIcon — transparent artwork causes App Store rejection.

After changing the source PNG: `Copy-Item public/apple-ios-logo.png ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`

### Splash Screen (native launch only)
Launch logo: `ios/App/App/Assets.xcassets/SplashLogo.imageset/splash-logo.png` ← copy from **`public/welcome-logo.png`** (transparent; works on `#0a0812` in `LaunchScreen.storyboard`).

**Do not** use `apple-ios-logo.png` for splash (wrong asset; opaque white edges).

**Android native splash:** `android/app/src/main/res/drawable-nodpi/ic_paletteplotting_splash_wordmark.png` — wordmark-only transparent PNG (regenerate with `python scripts/extract-splash-wordmark.py` from `public/welcome-logo.png`). Referenced by `android/app/src/main/res/drawable/splash.xml` (full-bleed `#0a0812`, **dp** insets) plus `capacitor.config.ts` (`backgroundColor: #0a0812`, `androidScaleType: CENTER_INSIDE`). Do not use `apple-ios-logo.png` or the full `welcome-logo.png` tile for splash.

Capacitor splash plugin: `capacitor.config.ts` (`backgroundColor: #0a0812`, `launchAutoHide: false`). JS hide: `src/components/NativeAppRootRedirect.tsx`.

### Permissions
Already configured in `ios/App/App/Info.plist`:
- Camera: For board photo uploads
- Microphone: Optional support recordings
- Photo Library: For vision boards and private uploads

## 🔄 Development Workflow

1. **Make changes to web app** (in `src/`)
2. **Build web assets:**
   ```bash
   npm run build
   ```
3. **Sync to iOS:**
   ```bash
   npm run cap:sync
   ```
4. **Test in Xcode** or on device

## 📝 Important Notes

- **Bundle ID:** Use exactly `com.paletteplotting.app` (no space before or after) everywhere: Xcode, App Store Connect, RevenueCat.
- **Web version is unaffected:** Your PWA/web deployment continues to work exactly as before
- **Same codebase:** Both web and iOS use the same React code
- **iOS folder:** The `ios/` folder contains the native iOS project. It's in git but build artifacts are ignored.

## RevenueCat: Products and Offering (current dashboard)

RevenueCat doesn’t have a single “change identifiers” screen. You set things in two places:

### 1. Product identifier (App Store product ID)

This is set when you **create the product**, not in a separate “identifier” field.

- In the **left sidebar**, open **Product catalog**.
- Open the **Products** tab (under Product catalog).
- Click **+ New product** (or **Import products** if you’ve connected App Store Connect).
- **Product identifier:** type exactly (no spaces):  
  `com.paletteplotting.app.monthly` or `com.paletteplotting.app.annual`
- **Store:** choose **Apple App Store**.
- Save. Do the same for the other product.

That’s the only place you “set” the App Store product ID. There is no other screen to “change” it for a product; the identifier is the value you enter when creating the product.

### 2. Offering identifier and packages

- Still under **Product catalog**, open the **Offerings** tab.
- When you **create** a new offering, RevenueCat asks for an **Identifier** and Description. Enter exactly: **`Production Offering`** (this is what the app requests). The offering identifier **cannot be changed later**. (The paywall template can have a different name, e.g. "Production Paywall".)
- Inside that offering, click **+ Add package**. You’ll see a **dropdown** with package identifiers like **$rc_monthly**, **$rc_annual**, or custom. Those are **package** labels, not your App Store IDs.
- For each package (e.g. $rc_monthly), **attach** the **product** you created in step 1 (the one whose identifier is `com.paletteplotting.app.monthly`). “Attach” means: in that package’s configuration, select the product from the Products list. That links the package to your App Store product.
- Attach a **Paywall** (template) to the offering so the SDK can show a paywall.

**Summary:** App Store product IDs are set in **Product catalog → Products** when you add each product. The **$rc_monthly** / **$rc_annual** values are package identifiers; you then attach the real products (with your App Store IDs) to those packages.

### 3. App in RevenueCat

- Your app’s **Bundle ID** in RevenueCat should be exactly `com.paletteplotting.app` (no trailing space).

## Supabase: sync-revenuecat-entitlement (recommended – no device receipt)

After a purchase, the app first asks your backend to verify the user’s entitlement **via RevenueCat’s API** (no app receipt needed). This avoids sync failures when the device receipt isn’t ready yet.

1. **Deploy the function**
   ```bash
   npx supabase functions deploy sync-revenuecat-entitlement
   ```

2. **Set the secret**
   - RevenueCat Dashboard → **Project Settings** → **API keys** → create or copy a **Secret** key (starts with `sk_`).
   - Supabase Dashboard → **Project Settings** → **Edge Functions** → **Secrets**.
   - Add: **Name** `REVENUECAT_SECRET_KEY`, **Value** = the RevenueCat secret key (`sk_...`).
   - Save. The function uses it to call RevenueCat’s API and confirm the "Palette Plotting Pro" entitlement.

If this function is deployed and the secret is set, the app syncs `user_plans` from RevenueCat after purchase or restore (the native app calls `Purchases.syncPurchases()` then invokes this function). If the secret is missing, the function returns **501** and server-side billing sync will not run until you configure `REVENUECAT_SECRET_KEY`.

**Client keys:** The iOS app still needs the **public** RevenueCat SDK key (`VITE_REVENUECAT_IOS_API_KEY`) so `syncPurchases` can update the subscriber before the edge function runs.

## 🐛 Troubleshooting

**"Module not found" errors:**
- Run `npm run build` first
- Then `npm run cap:sync`

**Permissions not working:**
- Check `Info.plist` has the usage descriptions
- Rebuild and reinstall app

**Build errors in Xcode:**
- Clean build folder: Product → Clean Build Folder
- Delete DerivedData
- Re-run `npm run cap:sync`

## 📚 Resources

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [App Store Connect Guide](https://developer.apple.com/app-store-connect/)
- [Xcode Setup Guide](https://developer.apple.com/xcode/)

## 🎯 Next Steps

1. Set up Apple Developer account (if not done)
2. Choose build method (cloud or local)
3. Configure app icons and metadata
4. Test on physical device
5. Submit to App Store for review
