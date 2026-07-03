# Apple Smart App Banner + App Store handoff

Generated: 2026-05-31 17:59
Branch: Mobile-app
Commit: 4110724a

---

## What the user sees (Safari screenshots)

On **mobile Safari**, iOS renders a **native system banner** at the top of every page:

- App icon, name ("Palette Plotting: Manifesta…"), subtitle, blue **Get** button
- This is **not** React UI — Safari reads `<meta name="apple-itunes-app">` from the document head
- Shows on **homepage, welcome, onboarding setup, dashboard web**, etc. — any route that loads the SPA shell
- User can dismiss with **X**; Apple controls re-show behavior

---

## Single source of truth for App Store ID

| Constant | Value | File |
|----------|-------|------|
| `PALETTE_PLOTTING_APP_STORE_ID` | `6759469696` | `src/lib/appStore.ts` |
| Smart App Banner meta | `app-id=6759469696` | `index.html` (must stay in sync) |
| App Store HTTPS URL | `https://apps.apple.com/app/id6759469696` | `appStore.ts` (id-only; slug URLs 500 on desktop) |
| Native iOS handoff | `itms-apps://itunes.apple.com/app/id6759469696` | `mobileStoreHandoff.ts` |

**There is no React component for the Smart App Banner.** Do not search for one.

---

## How it is "presented throughout" the site

### 1. Static meta in `index.html` (global, all routes)

```html
<meta name="apple-itunes-app" content="app-id=6759469696" />
```

- Loaded once when the Vite SPA bootstraps (`index.html` is the entry for every client route)
- **Never removed or updated** by JavaScript in this repo
- **Not** scoped to homepage only — welcome/onboarding get the same banner in Safari

Optional Apple params **not used today**: `app-argument=...` (deep link into app after install/open).

### 2. Related Apple `<head>` tags (NOT the Smart Banner, but same install ecosystem)

| Meta / link | Purpose |
|-------------|---------|
| `apple-mobile-web-app-capable` | Add to Home Screen / standalone PWA behavior |
| `apple-mobile-web-app-title` | Home screen label |
| `apple-mobile-web-app-status-bar-style` | Status bar; updated by `syncStatusBar()` in `index.html` + `marketingSiteChrome.ts` |
| `apple-touch-icon` | Icon when saving to home screen |
| `link rel="preconnect" tools.applemediaservices.com` | Warm CDN for **Download on the App Store** badge images |
| `public/manifest.json` | PWA manifest (separate from Smart Banner) |

### 3. `index.html` `syncStatusBar()` script (indirect)

- Polls `pathname` + watches `data-app-appearance` on `<html>`
- Updates `theme-color` and `apple-mobile-web-app-status-bar-style` per route (marketing black, onboarding cosmic, dashboard light/dark)
- **Does not touch** `apple-itunes-app` — banner meta is unchanged across routes

### 4. Explicit store CTAs (separate from Smart Banner)

When users tap **your** download UI (badges, hero CTAs, post-purchase dialog):

- `appStore.ts` — URLs + badge CDN assets (`tools.applemediaservices.com`)
- `mobileStoreHandoff.ts` — `https://` vs `itms-apps://` per browser
- `inAppBrowserDetection.ts` — TikTok/IG/Meta WebViews block plain App Store URLs
- `useMarketingStoreCta.tsx` + `MobileStoreFallbackSheet.tsx` — homepage badge taps + fallback sheet

These run on **homepage/marketing CTAs only** unless wired elsewhere. They do **not** control the Smart Banner.

---

## Where Smart Banner works vs does not

| Browser / context | Smart App Banner |
|-------------------|------------------|
| **Mobile Safari** (direct, organic, retargeting) | **Yes** — system UI |
| **TikTok / Instagram / Facebook in-app WebView** | **No** — meta is ignored |
| **Chrome iOS** | **No** — Apple banner is Safari-only |
| **Capacitor native app** | N/A — user already in app; same `index.html` loads in WebView but banner irrelevant |
| **Desktop Safari** | Typically no (mobile-oriented feature) |

For TikTok traffic, use explicit badge handoff (`itms-apps://`) + `MobileStoreFallbackSheet` on pages where `MarketingStoreCtaProvider` is mounted — **not** on `/onboarding/*` today.

---

## Architecture diagram

```
index.html (every SPA route)
  └── <meta apple-itunes-app app-id=6759469696>  ← Smart Banner (Safari only)
  └── syncStatusBar()                             ← theme-color / status bar (all routes)
  └── apple-touch-icon, PWA manifest

src/lib/appStore.ts                               ← canonical ID + HTTPS store URL + badge CDN
src/lib/mobileStoreHandoff.ts                     ← itms-apps + intent:// for in-app browsers
src/lib/inAppBrowserDetection.ts                  ← TikTok etc. → blocksAppStore

Homepage only:
  useMarketingStoreCta → MarketingStoreBadges → getMobileStoreHref()
  MobileStoreFallbackSheet (when WebView blocks store)

Onboarding / welcome:
  Smart Banner only (Safari) — no MarketingStoreCtaProvider
```

---

## Changing the App Store ID

1. Update `PALETTE_PLOTTING_APP_STORE_ID` in `src/lib/appStore.ts`
2. Update `index.html` `apple-itunes-app` `app-id=` to match
3. Rebuild + redeploy web
4. Verify in **mobile Safari** on welcome + homepage
5. TikTok/native SDK IDs are separate (see `tiktok-sdk-handoff.md`)

---

## Files in this handoff

- index.html
- src/lib/appStore.ts
- src/lib/mobileStoreHandoff.ts
- src/lib/inAppBrowserDetection.ts
- src/lib/marketingSiteChrome.ts
- src/lib/marketingSitePaths.ts
- src/lib/appDocumentChrome.ts
- public/manifest.json
- src/components/marketing/MarketingStoreBadges.tsx
- src/components/marketing/MarketingAppDownload.tsx
- src/hooks/useMarketingStoreCta.tsx
- src/components/marketing/MobileStoreFallbackSheet.tsx
- src/lib/marketingGetApp.ts
- src/pages/GetAppStore.tsx
- src/components/WebGetAppAfterPurchaseDialog.tsx

## FILE: index.html

```html
<!doctype html>
<html lang="en">
<head>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-N6QFTP58');</script>
<!-- End Google Tag Manager -->
<!-- TikTok Pixel Code Start -->
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};


  ttq.load('D5N27FBC77U6J0PHGJ1G');
  ttq.page({ content_id: window.location.pathname || '/' });
}(window, document, 'ttq');
</script>
<!-- TikTok Pixel Code End -->
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-QQX552G8JN"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-QQX552G8JN');
</script>
<meta charset="UTF-8" />
<!--
  `interactive-widget=overlays-content` tells Chrome / Android WebView to overlay the on-screen
  keyboard on top of existing layout instead of shrinking the visual viewport. Stops fixed footers
  (Back / Continue on onboarding form pages) from lifting above the keyboard. iOS WKWebView already
  behaves this way under Capacitor `KeyboardResize.None`, so this is a no-op on iOS.
-->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=overlays-content" />
<link rel="preconnect" href="https://play.google.com" crossorigin />
<link rel="preconnect" href="https://tools.applemediaservices.com" crossorigin />
<meta name="color-scheme" content="light">
<script>
(function () {
  try {
    if (/Capacitor/i.test(navigator.userAgent)) {
      document.documentElement.classList.add("capacitor-native");
      var stored = localStorage.getItem("theme");
      var isDark = stored !== "light";
      if (isDark) document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";
      var bg = isDark ? "#0f0d14" : "#ffffff";
      document.documentElement.style.backgroundColor = bg;
    }
  } catch (e) {}
})();
</script>
<style>
/* Font smoothing */
* {
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
}

html {
-webkit-text-size-adjust: 100%;
text-size-adjust: 100%;
}

/* Prevent Android WebView filters - but allow normal theming */
html, body, #root {
filter: none !important;
}

/* Native app: respect light/dark appearance (dashboard + chat). */
html.capacitor-native.dark,
html.capacitor-native.dark body,
html.capacitor-native.dark #root {
color-scheme: dark;
background-color: #0f0d14 !important;
}

html.capacitor-native:not(.dark),
html.capacitor-native:not(.dark) body,
html.capacitor-native:not(.dark) #root {
color-scheme: light;
background-color: #ffffff !important;
}

html.capacitor-native[data-app-appearance="cosmic"],
html.capacitor-native[data-app-appearance="cosmic"] body,
html.capacitor-native[data-app-appearance="cosmic"] #root {
color-scheme: dark;
background-color: #0a0812 !important;
}

/* Light mode defaults (when no .dark class) */
html:not(.dark):not(.capacitor-native) {
color-scheme: light;
background-color: #ffffff;
}

html:not(.dark):not(.capacitor-native) body {
background-color: #ffffff;
}

/* Dark mode (when .dark class is present) */
html.dark {
color-scheme: dark;
background-color: #09090b;
}

html.dark body {
background-color: #09090b;
}
</style>
<title>Palette Plotting</title>
<meta name="description" content="Palette Plotting: Build confidence with AI-powered affirmations, Mirror Work, subliminal audio creation, and daily reflection tools. Start your personal growth journey today." />
<meta name="author" content="Palette Plotting" />
<meta name="keywords" content="affirmations, self-improvement, personal growth, goal setting, reflection, visualization, audio creation, Mirror Work, subliminal audio, AI affirmations" />
<link rel="canonical" href="https://paletteplot.com" />

<meta property="og:title" content="Palette Plotting" />
<meta property="og:description" content="Palette Plotting: Build confidence with AI-powered affirmations, Mirror Work, subliminal audio creation, and daily reflection tools. Start your personal growth journey today." />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://paletteplot.com" />
<meta property="og:site_name" content="Palette Plotting" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@paletteplotting" />
<meta name="twitter:title" content="Palette Plotting" />
<meta name="twitter:description" content="Build confidence with AI-powered affirmations, Mirror Work, subliminal audio creation, and daily reflection tools." />

<!-- PWA Meta Tags -->
<meta name="theme-color" content="#000000" />
    <meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Palette Plotting" />

<!--
  Apple Smart App Banner — shows a native banner at the top of mobile Safari
  with one-tap install / open. Only renders when Safari is the active browser
  (it's a no-op in TikTok / IG / FB webviews, but it's a major install lift
  for organic + retargeting traffic that does land in Safari).
  app-id derived from PALETTE_PLOTTING_APP_STORE_URL (id6759469696).
-->
<meta name="apple-itunes-app" content="app-id=6759469696" />

<!-- Manifest: mobile gets real manifest; desktop gets a blank manifest + SW unregister + SW register noop -->
<script>
(function() {
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
// Remove any existing manifest links first
document.querySelectorAll('link[rel="manifest"]').forEach(l => l.remove());

const link = document.createElement('link');
link.rel = 'manifest';
        link.href = isMobile ? '/manifest.json' : 'data:application/manifest+json,{}';
        // For desktop, use a minimal valid manifest to avoid parsing errors
        link.href = isMobile ? '/manifest.json' : 'data:application/manifest+json;charset=utf-8,' + encodeURIComponent('{"name":"","display":"browser"}');
document.head.appendChild(link);

// Unregister stale service workers on all devices (mobile PWA cache can serve old CSS/JS).
if ('serviceWorker' in navigator) {
navigator.serviceWorker.getRegistrations().then(function(regs) {
  regs.forEach(function(reg) { reg.unregister(); });
}).catch(function() {});
var originalRegister = navigator.serviceWorker.register ? navigator.serviceWorker.register.bind(navigator.serviceWorker) : null;
navigator.serviceWorker.register = function() {
console.warn('Service worker registration blocked to prevent stale homepage cache', arguments[0]);
return Promise.reject(new Error('SW registration blocked'));
};
if (navigator.serviceWorker.ready) {
navigator.serviceWorker.ready.catch(function() {});
}
}

// Viewport parity debug — open homepage with ?debug=viewport (console + optional on-screen overlay).
if (/[?&]debug=viewport/.test(window.location.search)) {
function logViewportDebug() {
  var vv = window.visualViewport;
  var moduleScript = document.querySelector('script[type="module"]');
  var cssLink = document.querySelector('link[rel="stylesheet"]');
  var payload = {
    innerWidth: window.innerWidth,
    clientWidth: document.documentElement.clientWidth,
    visualViewportWidth: vv ? vv.width : null,
    visualViewportScale: vv ? vv.scale : null,
    devicePixelRatio: window.devicePixelRatio,
    isMobileUa: isMobile,
    isMobileBreakpoint: window.innerWidth < 768,
    assetJs: moduleScript ? moduleScript.getAttribute('src') : null,
    assetCss: cssLink ? cssLink.getAttribute('href') : null,
    viewportMeta: document.querySelector('meta[name="viewport"]') ? document.querySelector('meta[name="viewport"]').getAttribute('content') : null,
  };
  console.info('[paletteplotting viewport debug]', payload);
  var el = document.getElementById('sv-viewport-debug');
  if (!el) {
    el = document.createElement('pre');
    el.id = 'sv-viewport-debug';
    el.style.cssText = 'position:fixed;left:0;right:0;bottom:5rem;z-index:9999;margin:0;padding:8px;font:11px/1.35 monospace;background:rgba(0,0,0,0.88);color:#0f0;white-space:pre-wrap;pointer-events:none;max-height:40vh;overflow:auto;';
    document.body.appendChild(el);
  }
  el.textContent = JSON.stringify(payload, null, 2);
}
document.addEventListener('DOMContentLoaded', logViewportDebug);
window.addEventListener('resize', logViewportDebug);
if (window.visualViewport) window.visualViewport.addEventListener('resize', logViewportDebug);
}
})();
</script>
<script>
// Sync meta theme-color with dashboard appearance (PWA status bar, mobile browser chrome, Capacitor WebView).
(function() {
function syncStatusBar() {
var themeMeta = document.querySelector('meta[name="theme-color"]');
if (!themeMeta) return;

// Marketing pages: black chrome (status bar / safe area). Not dashboard, onboarding, or login.
function isMarketingSitePath(pathname) {
var path = pathname === '/' ? '/' : pathname.replace(/\/$/, '') || '/';
if (path === '/login') return false;
if (path.indexOf('/dashboard') === 0) return false;
if (path.indexOf('/onboarding') === 0) return false;
var exact = ['/', '/faq', '/what-is-palette-plotting', '/terms', '/privacy', '/acceptable-use', '/contact', '/billing', '/dmca'];
if (exact.indexOf(path) !== -1) return true;
if (path.indexOf('/blog') === 0) return true;
return false;
}
if (isMarketingSitePath(window.location.pathname)) {
themeMeta.setAttribute('content', '#000000');
var appleStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
if (appleStatus) appleStatus.setAttribute('content', 'black-translucent');
document.documentElement.style.colorScheme = 'dark';
document.documentElement.style.backgroundColor = '#000000';
if (document.body) document.body.style.backgroundColor = '#000000';
if (document.documentElement.classList.contains('dark')) {
document.documentElement.classList.remove('dark');
}
return;
}

var path = window.location.pathname.replace(/\/$/, '') || '/';
if (path === '/onboarding/welcome' || path.indexOf('/onboarding/setup/') === 0) {
var onboardingShellBg = 'linear-gradient(180deg, #0a0812 0%, #0f0d14 50%, #0a0812 100%)';
themeMeta.setAttribute('content', '#0f0d14');
var appleOnboarding = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
if (appleOnboarding) appleOnboarding.setAttribute('content', 'black-translucent');
document.documentElement.style.colorScheme = 'dark';
document.documentElement.style.setProperty('background', onboardingShellBg, 'important');
document.documentElement.style.setProperty('background-color', '#0f0d14', 'important');
if (document.body) {
document.body.style.setProperty('background', onboardingShellBg, 'important');
document.body.style.setProperty('background-color', '#0f0d14', 'important');
}
var onboardingRoot = document.getElementById('root');
if (onboardingRoot) {
onboardingRoot.style.setProperty('background', onboardingShellBg, 'important');
onboardingRoot.style.setProperty('background-color', '#0f0d14', 'important');
}
return;
}

document.documentElement.style.removeProperty('background');
document.documentElement.style.removeProperty('background-color');
if (document.body) {
document.body.style.removeProperty('background');
document.body.style.removeProperty('background-color');
}
var appRoot = document.getElementById('root');
if (appRoot) {
appRoot.style.removeProperty('background');
appRoot.style.removeProperty('background-color');
}
var appleStatusDefault = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
if (appleStatusDefault) appleStatusDefault.setAttribute('content', 'default');

var appearance = document.documentElement.getAttribute('data-app-appearance');
if (appearance === 'cosmic') {
themeMeta.setAttribute('content', '#0a0812');
if (appleStatusDefault) appleStatusDefault.setAttribute('content', 'black-translucent');
document.documentElement.style.colorScheme = 'dark';
return;
}

if (path.indexOf('/dashboard') === 0) {
if (appearance === 'dark') {
themeMeta.setAttribute('content', '#0f0d14');
if (appleStatusDefault) appleStatusDefault.setAttribute('content', 'black-translucent');
document.documentElement.style.colorScheme = 'dark';
} else {
themeMeta.setAttribute('content', '#ffffff');
if (appleStatusDefault) appleStatusDefault.setAttribute('content', 'default');
document.documentElement.style.colorScheme = 'light';
}
return;
}

var isDark = document.documentElement.classList.contains('dark');
if (isDark) {
themeMeta.setAttribute('content', '#09090b');
return;
}

themeMeta.setAttribute('content', '#ffffff');
}

// Watch for theme / appearance changes (React sets data-app-appearance on the document element)
var observer = new MutationObserver(syncStatusBar);
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-app-appearance'] });
syncStatusBar();

// Watch for route changes
let lastPath = window.location.pathname;
const checkRoute = () => {
if (window.location.pathname !== lastPath) {
lastPath = window.location.pathname;
syncStatusBar();
}
};
window.addEventListener('popstate', checkRoute);
setInterval(checkRoute, 100);

// Also sync after DOM is ready and after a delay (React needs time to set theme)
document.addEventListener('DOMContentLoaded', function() {
syncStatusBar();
setTimeout(syncStatusBar, 100);
setTimeout(syncStatusBar, 500);
});
})();
</script>
<link rel="apple-touch-icon" href="/icon-196.png" />
<link rel="icon" type="image/png" sizes="196x196" href="/icon-196.png?v=5" />
<link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png?v=5" />
<link rel="shortcut icon" href="/icon-196.png?v=5" />

<link rel="preconnect" href="https://fonts.cdnfonts.com">
<link href="https://fonts.cdnfonts.com/css/satoshi" rel="stylesheet">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..700&display=swap" rel="stylesheet">

<!-- Structured Data (JSON-LD) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Palette Plotting",
  "url": "https://paletteplot.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://paletteplot.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Palette Plotting",
  "applicationCategory": "HealthApplication",
  "operatingSystem": "Web, iOS, Android",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "Build confidence with AI-powered affirmations, Mirror Work, subliminal audio creation, and daily reflection tools. Start your personal growth journey today.",
  "url": "https://paletteplot.com"
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Palette Plotting",
  "url": "https://paletteplot.com",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-847-563-4944",
    "contactType": "customer service",
    "email": "support@paletteplot.com",
    "areaServed": "US",
    "availableLanguage": "English"
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1 North State Street Ste 1500",
    "addressLocality": "Chicago",
    "addressRegion": "IL",
    "postalCode": "60602",
    "addressCountry": "US"
  },
  "sameAs": [
    "https://twitter.com/paletteplotting"
  ]
}
</script>

</head>

<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-N6QFTP58"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
<!-- Force remove dark class immediately on page load -->
<script>
(function() {
  // Remove dark class if it exists
  document.documentElement.classList.remove('dark');

  // Store the original add and remove methods
  const originalClassListAdd = DOMTokenList.prototype.add;
  const originalClassListRemove = DOMTokenList.prototype.remove;

  // Get the original classList descriptor
  const originalClassListDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'classList') || 
                                      Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'classList');
  
  // Override the classList property on Element.prototype
  Object.defineProperty(Element.prototype, 'classList', {
    get: function() {
      const self = this; // Capture the element instance
      
      // Get the actual classList using the original getter
      const actualClassList = originalClassListDescriptor ? 
                              originalClassListDescriptor.get.call(self) : 
                              self.classList;

      // Create a proxy for the classList that calls the original methods
      // with the correct context (the element's actual classList)
      const customClassList = {
        add: function(...args) {
          // Block dark class from being added to html element on non-dashboard pages
          if (self === document.documentElement &&
              args.includes('dark') &&
              !window.location.pathname.startsWith('/dashboard')) {
            console.log('Blocked dark class on non-dashboard page');
            return;
          }
          // Call the original add method, ensuring 'this' context is the actual classList
          return originalClassListAdd.apply(actualClassList, args);
        },
        remove: function(...args) {
          // Call the original remove method, ensuring 'this' context is the actual classList
          return originalClassListRemove.apply(actualClassList, args);
        },
        toggle: function(...args) {
          return actualClassList.toggle.apply(actualClassList, args);
        },
        contains: function(...args) {
          return actualClassList.contains.apply(actualClassList, args);
        },
        item: function(...args) {
          return actualClassList.item.apply(actualClassList, args);
        },
        replace: function(...args) {
          return actualClassList.replace.apply(actualClassList, args);
        },
        get length() {
          return actualClassList.length;
        },
        get value() {
          return actualClassList.value;
        },
        set value(val) {
          actualClassList.value = val;
        },
        forEach: function(...args) {
          return actualClassList.forEach.apply(actualClassList, args);
        },
        entries: function() {
          return actualClassList.entries();
        },
        keys: function() {
          return actualClassList.keys();
        },
        values: function() {
          return actualClassList.values();
        },
        [Symbol.iterator]: function() {
          return actualClassList[Symbol.iterator]();
        },
        toString: function() {
          return actualClassList.toString();
        }
      };

      return customClassList;
    },
    configurable: true, // Allow the property to be redefined
  });
})();
</script>
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

---

## FILE: src/lib/appStore.ts

```typescript
/** Canonical App Store link (id-only — slug URLs often 500 on desktop App Store web). */
export const PALETTE_PLOTTING_APP_STORE_ID = "6759469696";

/** Opens in the App Store app on iPhone / iPad when tapped from Safari or many in-app browsers */
export const PALETTE_PLOTTING_APP_STORE_URL = `https://apps.apple.com/app/id${PALETTE_PLOTTING_APP_STORE_ID}`;

/** Google Play listing (package: com.paletteplotting.app) */
export const PALETTE_PLOTTING_GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.paletteplotting.app";

/** White badge for dark backgrounds (Apple Marketing Resources API). */
export const APP_STORE_BADGE_WHITE_URL =
  "https://tools.applemediaservices.com/api/badges/download-on-the-app-store/white/en-us?size=250x83";

/** Standard Google Play badge (English). */
export const GOOGLE_PLAY_BADGE_URL =
  "https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png";

/** Display height (px) — keep in sync with MarketingStoreBadges. */
export const STORE_BADGE_APPLE_HEIGHT_PX = 40;
export const STORE_BADGE_GOOGLE_HEIGHT_PX = 57;
/** Intrinsic assets: 250×83 (Apple), 646×250 (Google). */
export const STORE_BADGE_APPLE_WIDTH_PX = Math.round(
  (250 / 83) * STORE_BADGE_APPLE_HEIGHT_PX,
);
export const STORE_BADGE_GOOGLE_WIDTH_PX = Math.round(
  (646 / 250) * STORE_BADGE_GOOGLE_HEIGHT_PX,
);
export const STORE_BADGE_ROW_HEIGHT_PX = STORE_BADGE_GOOGLE_HEIGHT_PX;

let storeBadgePreloadStarted = false;

/** Warm badge CDN images; Google first — it is larger and often paints last. */
export function preloadStoreBadgeImages(googleFirst = true): void {
  if (typeof window === "undefined") return;
  const urls = googleFirst
    ? [GOOGLE_PLAY_BADGE_URL, APP_STORE_BADGE_WHITE_URL]
    : [APP_STORE_BADGE_WHITE_URL, GOOGLE_PLAY_BADGE_URL];
  for (const src of urls) {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  }
}

/** Call once per page load (e.g. marketing homepage) so badges are cached before tap. */
export function preloadStoreBadgeImagesOnce(): void {
  if (storeBadgePreloadStarted) return;
  storeBadgePreloadStarted = true;
  preloadStoreBadgeImages(true);
}

```

---

## FILE: src/lib/mobileStoreHandoff.ts

```typescript
import {
  PALETTE_PLOTTING_APP_STORE_ID,
  PALETTE_PLOTTING_APP_STORE_URL,
  PALETTE_PLOTTING_GOOGLE_PLAY_URL,
} from "@/lib/appStore";
import type { InAppBrowserDetection } from "@/lib/inAppBrowserDetection";
import type { MobileWebStore } from "@/lib/marketingGetApp";

export { PALETTE_PLOTTING_APP_STORE_ID };
export const PALETTE_PLOTTING_ANDROID_PACKAGE = "com.paletteplotting.app";

/** Opens App Store app on iOS — preferred over https in embedded WebViews. */
export const ITMS_APP_STORE_URL = `itms-apps://itunes.apple.com/app/id${PALETTE_PLOTTING_APP_STORE_ID}`;

function buildAndroidPlayIntentUrl(fallbackHttps: string): string {
  const encodedFallback = encodeURIComponent(fallbackHttps);
  return `intent://play.google.com/store/apps/details?id=${PALETTE_PLOTTING_ANDROID_PACKAGE}#Intent;scheme=https;package=com.android.vending;S.browser_fallback_url=${encodedFallback};end`;
}

/**
 * Best href for a store badge / CTA on this device.
 *
 * In TikTok / Meta / IG WebViews, plain https store URLs often do nothing.
 * Native schemes (`itms-apps://`, Play `intent://`) on a real `<a>` tap are
 * the standard handoff — no instruction sheets required.
 */
export function getMobileStoreHref(
  store: MobileWebStore,
  detection?: InAppBrowserDetection,
): string {
  const inRestrictedWebView = Boolean(detection?.isInAppBrowser && detection.blocksAppStore);

  if (store === "apple") {
    if (inRestrictedWebView && detection?.isIos) return ITMS_APP_STORE_URL;
    return PALETTE_PLOTTING_APP_STORE_URL;
  }

  if (inRestrictedWebView && detection?.isAndroid) {
    return buildAndroidPlayIntentUrl(PALETTE_PLOTTING_GOOGLE_PLAY_URL);
  }
  return PALETTE_PLOTTING_GOOGLE_PLAY_URL;
}

/** HTTPS URL for clipboard — always paste-friendly in Safari/Chrome. */
export function getCopyableStoreUrl(store: MobileWebStore): string {
  return store === "apple" ? PALETTE_PLOTTING_APP_STORE_URL : PALETTE_PLOTTING_GOOGLE_PLAY_URL;
}

/** Fallback when a button (not an anchor) triggers store open — clicks a transient link. */
export function openMobileStoreViaAnchor(
  store: MobileWebStore,
  detection?: InAppBrowserDetection,
): void {
  if (typeof document === "undefined") return;

  const anchor = document.createElement("a");
  anchor.href = getMobileStoreHref(store, detection);
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

```

---

## FILE: src/lib/inAppBrowserDetection.ts

```typescript
/**
 * In-app browser (a.k.a. social webview) detection.
 *
 * Why this exists: TikTok, Instagram, Facebook, Snapchat, LinkedIn etc. wrap
 * external links in their own embedded WebView. Those WebViews silently break
 * App Store / Play Store handoff (apps.apple.com / play.google.com), strip
 * referrers, block target="_blank", and disallow itms-apps:// schemes.
 *
 * For paid social traffic (TikTok especially) this is the single biggest
 * conversion leak — users tap "Download" and nothing happens.
 *
 * Mitigation: native store schemes on real `<a href>` tags (`itms-apps://`,
 * Play `intent://`) — see mobileStoreHandoff.ts.
 */

export type InAppBrowserKind =
  | "tiktok"
  | "instagram"
  | "facebook"
  | "snapchat"
  | "linkedin"
  | "twitter"
  | "pinterest"
  | "line"
  | "wechat"
  | "other";

export type InAppBrowserDetection = {
  isInAppBrowser: boolean;
  kind: InAppBrowserKind | null;
  /** True when this in-app browser is known to break apps.apple.com handoff. */
  blocksAppStore: boolean;
  /** Convenience: iOS detection — switches "Open in Safari" vs "Open in Chrome" copy. */
  isIos: boolean;
  /** Convenience: Android detection — switches Play Store fallback. */
  isAndroid: boolean;
};

const NULL_DETECTION: InAppBrowserDetection = {
  isInAppBrowser: false,
  kind: null,
  blocksAppStore: false,
  isIos: false,
  isAndroid: false,
};

function getUserAgent(): string {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent || "";
}

function detectKind(ua: string): InAppBrowserKind | null {
  // TikTok signatures: "musical_ly", "Bytedance", "BytedanceWebview", "TikTok"
  if (/musical_ly|Bytedance|BytedanceWebview|TikTok/i.test(ua)) return "tiktok";

  // Instagram embeds "Instagram" string in UA
  if (/Instagram/i.test(ua)) return "instagram";

  // Facebook embeds "FBAN" (iOS) / "FBAV" / "FB_IAB" (Android)
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) return "facebook";

  if (/Snapchat/i.test(ua)) return "snapchat";
  if (/LinkedInApp/i.test(ua)) return "linkedin";
  if (/Twitter/i.test(ua)) return "twitter";
  if (/Pinterest/i.test(ua)) return "pinterest";
  if (/Line\//i.test(ua)) return "line";
  if (/MicroMessenger/i.test(ua)) return "wechat";

  return null;
}

/**
 * Detect at call-time. Cheap, no caching — UA can't change mid-session.
 * Server-rendering safe (returns a null detection).
 */
export function detectInAppBrowser(): InAppBrowserDetection {
  const ua = getUserAgent();
  if (!ua) return NULL_DETECTION;

  const kind = detectKind(ua);
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  if (!kind) {
    return { isInAppBrowser: false, kind: null, blocksAppStore: false, isIos, isAndroid };
  }

  /**
   * TikTok / Instagram / Facebook / Snapchat / WeChat WebViews block plain
   * https store URLs — use native schemes when these are detected.
   */
  const blocksAppStore = kind === "tiktok" || kind === "instagram" || kind === "facebook" || kind === "snapchat" || kind === "wechat";

  return { isInAppBrowser: true, kind, blocksAppStore, isIos, isAndroid };
}

/** Human-friendly label for the prompt copy, e.g. "TikTok". */
export function inAppBrowserLabel(kind: InAppBrowserKind): string {
  switch (kind) {
    case "tiktok":
      return "TikTok";
    case "instagram":
      return "Instagram";
    case "facebook":
      return "Facebook";
    case "snapchat":
      return "Snapchat";
    case "linkedin":
      return "LinkedIn";
    case "twitter":
      return "X";
    case "pinterest":
      return "Pinterest";
    case "line":
      return "LINE";
    case "wechat":
      return "WeChat";
    case "other":
      return "this app";
  }
}

```

---

## FILE: src/lib/marketingSiteChrome.ts

```typescript
import { isMarketingSitePath } from "@/lib/siteRoutes";

export const MARKETING_SITE_CHROME_BG = "#000000";

/** Status bar / safe-area / browser chrome for public marketing pages (not app shell). */
export function applyMarketingSiteDocumentChrome(pathname: string): boolean {
  if (!isMarketingSitePath(pathname)) return false;

  const root = document.documentElement;
  root.classList.remove("dark");
  root.style.colorScheme = "dark";
  root.dataset.marketingSite = "true";
  root.dataset.appAppearance = "light";
  root.style.backgroundColor = MARKETING_SITE_CHROME_BG;
  document.body.style.backgroundColor = MARKETING_SITE_CHROME_BG;

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute("content", MARKETING_SITE_CHROME_BG);

  const appleStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (appleStatus) appleStatus.setAttribute("content", "black-translucent");

  return true;
}

export function clearMarketingSiteDocumentChrome(): void {
  const root = document.documentElement;
  delete root.dataset.marketingSite;
  root.style.backgroundColor = "";
  document.body.style.backgroundColor = "";
  const appRoot = document.getElementById("root");
  if (appRoot) appRoot.style.backgroundColor = "";
}

```

---

## FILE: src/lib/marketingSitePaths.ts

```typescript
/** Public marketing/legal pages that share the black homepage chrome (not app shell). */

const MARKETING_SITE_EXACT = new Set([
  "/",
  "/faq",
  "/what-is-palette-plotting",
  "/terms",
  "/privacy",
  "/acceptable-use",
  "/contact",
  "/community",
  "/billing",
  "/pricingplans",
  "/dmca",
]);

const MARKETING_SITE_PREFIXES = ["/blog"];

const APP_ROUTE_PREFIXES = ["/dashboard", "/onboarding"];

export function isMarketingSitePath(pathname: string): boolean {
  const path =
    pathname === "/" ? "/" : pathname.replace(/\/$/, "") || "/";

  if (path === "/login") return false;
  if (APP_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix))) return false;

  if (MARKETING_SITE_EXACT.has(path)) return true;
  return MARKETING_SITE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

```

---

## FILE: src/lib/appDocumentChrome.ts

```typescript
import { Capacitor } from "@capacitor/core";
import type { Appearance } from "@/contexts/ThemeContext";
import { WELCOME_COSMIC_BASE } from "@/components/onboarding/WelcomeCosmicBackground";
import {
  applyMarketingSiteDocumentChrome,
  clearMarketingSiteDocumentChrome,
} from "@/lib/marketingSiteChrome";

const COSMIC_SHELL_PREFIXES = ["/onboarding"] as const;

function normalizePath(pathname: string): string {
  if (pathname === "/") return "/";
  return pathname.replace(/\/$/, "") || "/";
}

export function isCosmicShellPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return COSMIC_SHELL_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

import { TOOL_PAGE_DARK_BG, TOOL_PAGE_LIGHT_BG } from "@/lib/toolPageThemeStyles";

const DASHBOARD_LIGHT_BG = TOOL_PAGE_LIGHT_BG;
const DASHBOARD_DARK_BG = TOOL_PAGE_DARK_BG;

function applyNativeRootSurfaces(bg: string): void {
  const appRoot = document.getElementById("root");
  document.body.style.backgroundColor = bg;
  if (appRoot) appRoot.style.backgroundColor = bg;
}

function applyDashboardChrome(root: HTMLElement, theme: Appearance): void {
  if (theme === "dark") {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
    root.dataset.appAppearance = "dark";
    root.style.backgroundColor = DASHBOARD_DARK_BG;
    applyNativeRootSurfaces(DASHBOARD_DARK_BG);
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
    root.dataset.appAppearance = "light";
    root.style.backgroundColor = DASHBOARD_LIGHT_BG;
    applyNativeRootSurfaces(DASHBOARD_LIGHT_BG);
  }
}

function applyCosmicShellChrome(root: HTMLElement): void {
  root.classList.remove("dark");
  root.style.colorScheme = "dark";
  root.dataset.appAppearance = "cosmic";
  root.style.backgroundColor = WELCOME_COSMIC_BASE;
  applyNativeRootSurfaces(WELCOME_COSMIC_BASE);
}

function applyNeutralAppChrome(root: HTMLElement, theme: Appearance): void {
  applyDashboardChrome(root, theme);
}

/** Android only — iOS keeps web safe-area strips + plist (unchanged since ~205). */
function applyAndroidStatusBarChrome(pathname: string, theme: Appearance): void {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return;

  void import("@capacitor/status-bar").then(({ StatusBar, Style }) => {
    let color: string;
    let style: (typeof Style)["Dark"];

    if (isCosmicShellPath(pathname)) {
      color = WELCOME_COSMIC_BASE;
      style = Style.Dark;
    } else if (pathname.startsWith("/dashboard")) {
      if (theme === "dark") {
        color = DASHBOARD_DARK_BG;
        style = Style.Dark;
      } else {
        color = DASHBOARD_LIGHT_BG;
        style = Style.Light;
      }
    } else if (theme === "dark") {
      color = DASHBOARD_DARK_BG;
      style = Style.Dark;
    } else {
      color = DASHBOARD_LIGHT_BG;
      style = Style.Light;
    }

    void StatusBar.setOverlaysWebView({ overlay: true });
    void StatusBar.setBackgroundColor({ color });
    void StatusBar.setStyle({ style });
  }).catch(() => {});
}

/**
 * Single source of truth for <html> / <body> chrome by route.
 * Does not write appearance to localStorage — only reflects the active route + preference.
 */
export function applyAppDocumentChrome(pathname: string, theme: Appearance): void {
  if (applyMarketingSiteDocumentChrome(pathname)) {
    applyAndroidStatusBarChrome(pathname, theme);
    return;
  }

  clearMarketingSiteDocumentChrome();

  const root = document.documentElement;

  if (pathname.startsWith("/dashboard")) {
    applyDashboardChrome(root, theme);
    applyAndroidStatusBarChrome(pathname, theme);
    return;
  }

  if (isCosmicShellPath(pathname)) {
    applyCosmicShellChrome(root);
    applyAndroidStatusBarChrome(pathname, theme);
    return;
  }

  applyNeutralAppChrome(root, theme);
  applyAndroidStatusBarChrome(pathname, theme);
}

```

---

## FILE: public/manifest.json

```json
{
  "name": "Palette Plotting",
  "short_name": "Palette Plotting",
  "description": "Shape your path forward",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-196.png",
      "sizes": "196x196",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}



































```

---

## FILE: src/components/marketing/MarketingStoreBadges.tsx

```tsx
import {
  APP_STORE_BADGE_WHITE_URL,
  GOOGLE_PLAY_BADGE_URL,
  PALETTE_PLOTTING_APP_STORE_URL,
  PALETTE_PLOTTING_GOOGLE_PLAY_URL,
  STORE_BADGE_APPLE_HEIGHT_PX,
  STORE_BADGE_APPLE_WIDTH_PX,
  STORE_BADGE_GOOGLE_HEIGHT_PX,
  STORE_BADGE_GOOGLE_WIDTH_PX,
  STORE_BADGE_ROW_HEIGHT_PX,
} from "@/lib/appStore";
import { cn } from "@/lib/utils";
import type { MobileWebStore } from "@/lib/marketingGetApp";

type MarketingStoreBadgesProps = {
  /**
   * Native store href per badge (itms-apps / intent in in-app browsers).
   * When set, badges render as `<a>` tags so the WebView handles handoff.
   */
  getStoreHref?: (store: MobileWebStore) => string;
  /** Analytics / desktop routing — must not call preventDefault when used with getStoreHref. */
  onStoreClick?: (store: MobileWebStore) => void;
  className?: string;
  /** Primary placement (hero / download) — eager-loads badge images. */
  size?: "sm" | "lg";
  /** Side-by-side row, centered, no wrap (mobile hero / download). */
  layout?: "wrap" | "inline";
};

const controlClass =
  "inline-flex shrink-0 items-center justify-center overflow-visible border-0 bg-transparent p-0 shadow-none ring-0 outline-none appearance-none [-webkit-appearance:none] [-webkit-tap-highlight-color:transparent] hover:opacity-100 focus:outline-none focus-visible:outline-none focus-visible:ring-0 active:opacity-90";

function badgeContainerClass(layout: MarketingStoreBadgesProps["layout"], className?: string) {
  return cn(
    layout === "inline"
      ? "flex w-full flex-nowrap items-center justify-center gap-4 sm:gap-5"
      : "flex flex-wrap items-center justify-center gap-4 sm:gap-5",
    className,
  );
}

type BadgeControlProps = {
  store: MobileWebStore;
  getStoreHref?: (store: MobileWebStore) => string;
  onStoreClick?: (store: MobileWebStore) => void;
  priority?: boolean;
};

function StoreBadgeControl({ store, getStoreHref, onStoreClick, priority = false }: BadgeControlProps) {
  const isApple = store === "apple";
  const defaultHref = isApple ? PALETTE_PLOTTING_APP_STORE_URL : PALETTE_PLOTTING_GOOGLE_PLAY_URL;
  const href = getStoreHref?.(store) ?? defaultHref;
  const displayWidth = isApple ? STORE_BADGE_APPLE_WIDTH_PX : STORE_BADGE_GOOGLE_WIDTH_PX;
  const displayHeight = isApple ? STORE_BADGE_APPLE_HEIGHT_PX : STORE_BADGE_GOOGLE_HEIGHT_PX;

  const img = (
    <img
      src={isApple ? APP_STORE_BADGE_WHITE_URL : GOOGLE_PLAY_BADGE_URL}
      alt={isApple ? "Download on the App Store" : "Get it on Google Play"}
      className="block max-w-none shrink-0 select-none object-contain object-center"
      style={{
        width: displayWidth,
        height: displayHeight,
        maxWidth: displayWidth,
        maxHeight: STORE_BADGE_ROW_HEIGHT_PX,
      }}
      width={displayWidth}
      height={displayHeight}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding={priority ? "sync" : "async"}
      draggable={false}
    />
  );

  const frameStyle = {
    height: STORE_BADGE_ROW_HEIGHT_PX,
    width: displayWidth,
    minWidth: displayWidth,
    flexShrink: 0,
  };
  const label = isApple ? "Download on the App Store" : "Get it on Google Play";

  if (getStoreHref) {
    return (
      <a
        href={href}
        className={controlClass}
        style={frameStyle}
        rel="noopener noreferrer"
        aria-label={label}
        onClick={() => onStoreClick?.(store)}
      >
        {img}
      </a>
    );
  }

  if (onStoreClick) {
    return (
      <button
        type="button"
        onClick={() => onStoreClick(store)}
        className={controlClass}
        style={frameStyle}
        aria-label={label}
      >
        {img}
      </button>
    );
  }

  return (
    <a
      href={defaultHref}
      className={controlClass}
      style={frameStyle}
      rel="noopener noreferrer"
      target="_blank"
      aria-label={label}
    >
      {img}
    </a>
  );
}

export function MarketingStoreBadges({
  getStoreHref,
  onStoreClick,
  className,
  size = "sm",
  layout = "wrap",
}: MarketingStoreBadgesProps) {
  const containerClass = badgeContainerClass(
    layout,
    cn("min-h-[57px] items-center", className),
  );
  const priority = size === "lg";

  return (
    <div className={containerClass} aria-label="Download Palette Plotting">
      <StoreBadgeControl
        store="apple"
        getStoreHref={getStoreHref}
        onStoreClick={onStoreClick}
        priority={priority}
      />
      <StoreBadgeControl
        store="google"
        getStoreHref={getStoreHref}
        onStoreClick={onStoreClick}
        priority={priority}
      />
    </div>
  );
}

```

---

## FILE: src/components/marketing/MarketingAppDownload.tsx

```tsx
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  PALETTE_PLOTTING_APP_STORE_URL,
  PALETTE_PLOTTING_GOOGLE_PLAY_URL,
} from "@/lib/appStore";
import { MarketingStoreBadges } from "@/components/marketing/MarketingStoreBadges";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMarketingStoreCta } from "@/hooks/useMarketingStoreCta";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { MARKETING_CTA_DOWNLOAD } from "@/lib/marketingConversionCopy";
import { MARKETING_DISPLAY_CLASS } from "@/components/marketing/marketingVisualTheme";
import { marketingHeroSectionClass } from "@/components/marketing/marketingLayout";
import { cn } from "@/lib/utils";

type QRStatus = "loading" | "ready" | "error";

type StoreQR = {
  label: string;
  href: string;
  alt: string;
};

const STORE_QRS: StoreQR[] = [
  {
    label: "Apple App Store",
    href: PALETTE_PLOTTING_APP_STORE_URL,
    alt: "QR code to open Palette Plotting on the App Store",
  },
  {
    label: "Google Play",
    href: PALETTE_PLOTTING_GOOGLE_PLAY_URL,
    alt: "QR code to open Palette Plotting on Google Play",
  },
];

const QR_SIZE_PX = 140;
const QR_DISPLAY_CLASS = "h-28 w-28 sm:h-32 sm:w-32";

function StoreQrCard({
  store,
  dataUrl,
  status,
}: {
  store: StoreQR;
  dataUrl: string;
  status: QRStatus;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs font-semibold tracking-wide text-white/70">{store.label}</p>
      {status === "ready" && dataUrl ? (
        <a
          href={store.href}
          className="inline-block rounded-xl border border-white/15 bg-white p-2.5 shadow-md transition-shadow hover:shadow-lg hover:shadow-pink-500/10"
          rel="noopener noreferrer"
          target="_blank"
        >
          <img
            src={dataUrl}
            alt={store.alt}
            className={QR_DISPLAY_CLASS}
            width={128}
            height={128}
          />
        </a>
      ) : status === "loading" ? (
        <div
          className={`flex items-center justify-center rounded-xl border border-dashed border-white/20 text-xs text-white/50 ${QR_DISPLAY_CLASS}`}
          aria-busy
        >
          …
        </div>
      ) : (
        <p className="text-xs text-white/50">Unavailable</p>
      )}
    </div>
  );
}

function DesktopQrSection() {
  const [qrByHref, setQrByHref] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<QRStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      STORE_QRS.map(async (store) => {
        const dataUrl = await QRCode.toDataURL(store.href, {
          width: QR_SIZE_PX,
          margin: 2,
          errorCorrectionLevel: "H",
          color: { dark: "#000000", light: "#ffffff" },
        });
        return [store.href, dataUrl] as const;
      }),
    )
      .then((entries) => {
        if (cancelled) return;
        setQrByHref(Object.fromEntries(entries));
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <p className="mt-3 text-sm text-white sm:text-base">Scan with your phone.</p>
      <div className="mt-8 flex w-full flex-col items-center gap-6">
        <div className="flex flex-wrap items-start justify-center gap-8 sm:gap-10">
          {STORE_QRS.map((store) => (
            <StoreQrCard
              key={store.href}
              store={store}
              dataUrl={qrByHref[store.href] ?? ""}
              status={status}
            />
          ))}
        </div>
        {status === "error" ? (
          <p className="text-sm text-white/60">QR codes unavailable. Use the store badges below.</p>
        ) : null}
        <MarketingStoreBadges />
      </div>
    </>
  );
}

function MobileBadgesSection() {
  const cta = useMarketingStoreCta();

  return (
    <>
      <p className="mt-3 text-sm text-white sm:text-base">
        Tap to install on your phone. Web onboarding is also available below.
      </p>
      <div className="mt-7 flex w-full flex-col items-center gap-5">
        <MarketingStoreBadges
          layout="inline"
          size="lg"
          getStoreHref={cta.getStoreHref}
          onStoreClick={(store) => cta.onStoreClick("download_section_badge", store)}
        />
        <button
          type="button"
          onClick={() => {
            trackMarketingConversion("cta_web_onboarding_click", {
              source: "download_section",
            });
            window.location.assign("/onboarding/welcome");
          }}
          className="text-sm font-medium text-[#e8b8cc]/70 underline-offset-2 transition-colors hover:text-[#e8b8cc] hover:underline"
        >
          Continue on web instead
        </button>
      </div>
    </>
  );
}

export function MarketingAppDownload() {
  const isMobile = useIsMobile();

  return (
    <section
      id="download-app"
      className={cn(marketingHeroSectionClass, "scroll-mt-24")}
      aria-labelledby="download-app-heading"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="mx-auto flex w-full flex-col items-center text-center lg:max-w-3xl">
          <h2 id="download-app-heading" className={cn(MARKETING_DISPLAY_CLASS, "w-full text-2xl sm:text-3xl")}>
            {MARKETING_CTA_DOWNLOAD}
          </h2>
          {isMobile ? <MobileBadgesSection /> : <DesktopQrSection />}
        </div>
      </div>
    </section>
  );
}

```

---

## FILE: src/hooks/useMarketingStoreCta.tsx

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MobileStoreFallbackSheet } from "@/components/marketing/MobileStoreFallbackSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { detectInAppBrowser, type InAppBrowserDetection } from "@/lib/inAppBrowserDetection";
import {
  getMobileWebStore,
  handleStoreClick,
  isDesktopMarketingWeb,
  shouldScheduleStoreFallback,
  type MobileWebStore,
  type StoreClickResult,
} from "@/lib/marketingGetApp";
import {
  getCopyableStoreUrl,
  getMobileStoreHref,
  openMobileStoreViaAnchor,
} from "@/lib/mobileStoreHandoff";
import { logStoreHandoff } from "@/lib/mobileStoreHandoffDebug";
import { scheduleStoreFallbackCheck, type StoreFallbackScheduleHandle } from "@/lib/mobileStoreFallbackScheduler";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";

type FallbackState = {
  store: MobileWebStore;
  storeUrl: string;
  source: string;
};

export type UseStoreCtaResult = {
  detection: InAppBrowserDetection;
  getStoreHref: (store: MobileWebStore) => string;
  primaryStoreHref: string;
  primaryStore: MobileWebStore;
  onStoreClick: (source: string, forceStore?: MobileWebStore) => StoreClickResult;
  /** @deprecated use onStoreClick */
  onCtaClick: (source: string, forceStore?: MobileWebStore) => StoreClickResult;
};

type ProviderState = UseStoreCtaResult & {
  fallbackOpen: boolean;
  fallbackState: FallbackState | null;
  closeFallback: () => void;
  tryAgain: () => void;
  copyStoreLink: () => Promise<boolean>;
};

const MarketingStoreCtaContext = createContext<UseStoreCtaResult | null>(null);

function useMarketingStoreCtaInternal(isMobileViewport: boolean): ProviderState {
  const [detection, setDetection] = useState<InAppBrowserDetection>(() => detectInAppBrowser());
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [fallbackState, setFallbackState] = useState<FallbackState | null>(null);
  const fallbackTimerRef = useRef<StoreFallbackScheduleHandle | null>(null);

  useEffect(() => {
    const next = detectInAppBrowser();
    setDetection(next);
    logStoreHandoff("detection_ready", {
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      in_app_browser: next.kind ?? "none",
      blocks_app_store: next.blocksAppStore,
      platform: next.isIos ? "ios" : next.isAndroid ? "android" : "unknown",
    });
  }, []);

  const cancelFallbackTimer = useCallback((reason: string) => {
    fallbackTimerRef.current?.cancel(reason);
    fallbackTimerRef.current = null;
  }, []);

  const closeFallback = useCallback(() => {
    setFallbackOpen(false);
    setFallbackState(null);
  }, []);

  const openFallback = useCallback((state: FallbackState) => {
    setFallbackState(state);
    setFallbackOpen(true);
    trackMarketingConversion("in_app_prompt_shown", {
      source: state.source,
      store: state.store,
    });
    logStoreHandoff("fallback_sheet_opened", {
      source: state.source,
      store: state.store,
      storeUrl: state.storeUrl,
    });
  }, []);

  const scheduleFallback = useCallback(
    (store: MobileWebStore, source: string) => {
      if (!shouldScheduleStoreFallback(isMobileViewport, detection)) return;

      cancelFallbackTimer("reschedule");
      const copyUrl = getCopyableStoreUrl(store);

      fallbackTimerRef.current = scheduleStoreFallbackCheck({
        meta: { source, store },
        onShow: () => openFallback({ store, storeUrl: copyUrl, source }),
      });
    },
    [cancelFallbackTimer, detection, isMobileViewport, openFallback],
  );

  const getStoreHref = useCallback(
    (store: MobileWebStore) => getMobileStoreHref(store, detection),
    [detection],
  );

  const primaryStore = useMemo(
    () => getMobileWebStore() ?? ("apple" as MobileWebStore),
    [],
  );

  const primaryStoreHref = useMemo(
    () => getMobileStoreHref(primaryStore, detection),
    [detection, primaryStore],
  );

  const onStoreClick = useCallback(
    (source: string, forceStore?: MobileWebStore) => {
      const isDesktop = isDesktopMarketingWeb(isMobileViewport);
      const result = handleStoreClick({
        isMobileViewport,
        forceStore,
        source,
        detection,
        navigate: isDesktop,
      });

      if (!isDesktop && result.kind === "opened_store") {
        scheduleFallback(result.store, source);
      }

      return result;
    },
    [detection, isMobileViewport, scheduleFallback],
  );

  const tryAgain = useCallback(() => {
    if (!fallbackState) return;
    trackMarketingConversion("in_app_open_in_browser", {
      source: fallbackState.source,
      store: fallbackState.store,
      action: "try_again",
    });
    openMobileStoreViaAnchor(fallbackState.store, detection);
    scheduleFallback(fallbackState.store, fallbackState.source);
  }, [detection, fallbackState, scheduleFallback]);

  const copyStoreLink = useCallback(async (): Promise<boolean> => {
    if (!fallbackState) return false;
    try {
      await navigator.clipboard.writeText(fallbackState.storeUrl);
      trackMarketingConversion("in_app_copy_link", {
        source: fallbackState.source,
        store: fallbackState.store,
      });
      return true;
    } catch {
      return false;
    }
  }, [fallbackState]);

  useEffect(() => () => cancelFallbackTimer("unmount"), [cancelFallbackTimer]);

  return {
    detection,
    getStoreHref,
    primaryStoreHref,
    primaryStore,
    onStoreClick,
    onCtaClick: onStoreClick,
    fallbackOpen,
    fallbackState,
    closeFallback,
    tryAgain,
    copyStoreLink,
  };
}

export function MarketingStoreCtaProvider({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const state = useMarketingStoreCtaInternal(isMobile);
  const {
    fallbackOpen,
    fallbackState,
    closeFallback,
    tryAgain,
    copyStoreLink,
    detection,
    getStoreHref,
    primaryStoreHref,
    primaryStore,
    onStoreClick,
    onCtaClick,
  } = state;

  const ctxValue: UseStoreCtaResult = {
    detection,
    getStoreHref,
    primaryStoreHref,
    primaryStore,
    onStoreClick,
    onCtaClick,
  };

  return (
    <MarketingStoreCtaContext.Provider value={ctxValue}>
      {children}
      {!isDesktopMarketingWeb(isMobile) && fallbackState ? (
        <MobileStoreFallbackSheet
          open={fallbackOpen}
          store={fallbackState.store}
          storeUrl={fallbackState.storeUrl}
          browserKind={state.detection.kind}
          isIos={state.detection.isIos}
          onClose={closeFallback}
          onTryAgain={tryAgain}
          onCopy={copyStoreLink}
        />
      ) : null}
    </MarketingStoreCtaContext.Provider>
  );
}

export function useMarketingStoreCta(): UseStoreCtaResult {
  const ctx = useContext(MarketingStoreCtaContext);
  if (!ctx) {
    throw new Error("useMarketingStoreCta must be used within MarketingStoreCtaProvider");
  }
  return ctx;
}

```

---

## FILE: src/components/marketing/MobileStoreFallbackSheet.tsx

```tsx
import { useEffect, useRef, useState } from "react";
import { Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MobileWebStore } from "@/lib/marketingGetApp";
import { inAppBrowserLabel, type InAppBrowserKind } from "@/lib/inAppBrowserDetection";

type MobileStoreFallbackSheetProps = {
  open: boolean;
  store: MobileWebStore;
  storeUrl: string;
  browserKind: InAppBrowserKind | null;
  isIos: boolean;
  onClose: () => void;
  onTryAgain: () => void;
  onCopy: () => Promise<boolean>;
};

export function MobileStoreFallbackSheet({
  open,
  store,
  storeUrl,
  browserKind,
  isIos,
  onClose,
  onTryAgain,
  onCopy,
}: MobileStoreFallbackSheetProps) {
  const [copied, setCopied] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setShowUrlFallback(false);
    }
  }, [open]);

  if (!open) return null;

  const browserName = browserKind ? inAppBrowserLabel(browserKind) : "this app";
  const isApple = store === "apple";
  const title = isApple ? "App Store did not open?" : "Play Store did not open?";
  const bodyCopy = isIos
    ? `${browserName} may have blocked the App Store link. Tap copy, then open Safari and paste.`
    : `${browserName} may have blocked the Play Store link. Tap copy, then open Chrome and paste.`;

  const handleCopy = async () => {
    const ok = await onCopy();
    if (ok) {
      setCopied(true);
      return;
    }
    setShowUrlFallback(true);
    requestAnimationFrame(() => {
      urlInputRef.current?.focus();
      urlInputRef.current?.select();
    });
  };

  return (
    <div className="fixed inset-0 z-[70] md:hidden" role="dialog" aria-modal="true" aria-labelledby="store-fallback-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[1px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 rounded-t-2xl border border-white/10",
          "bg-[#0a0608]/97 px-4 pt-4 shadow-[0_-12px_40px_rgba(0,0,0,0.45)]",
          "pb-[max(1rem,env(safe-area-inset-bottom,0px))]",
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 pr-2">
            <h2 id="store-fallback-title" className="text-base font-semibold text-white">
              {title}
            </h2>
            <p className="mt-1.5 text-sm leading-snug text-white/65">{bodyCopy}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-white/55 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          <Button
            type="button"
            size="lg"
            className="h-11 w-full rounded-full bg-white text-sm font-semibold text-[#120810] hover:bg-white/90"
            onClick={onTryAgain}
          >
            {isApple ? "Try opening App Store again" : "Try opening Play Store again"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11 w-full rounded-full border-white/20 bg-transparent text-sm font-medium text-white hover:bg-white/10"
            onClick={() => void handleCopy()}
          >
            <Copy className="mr-2 h-4 w-4" />
            {copied ? "Copied" : "Copy app link"}
          </Button>

          {showUrlFallback ? (
            <input
              ref={urlInputRef}
              readOnly
              value={storeUrl}
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs text-white/80"
              aria-label="App store link"
            />
          ) : null}

          <p className="text-center text-[11px] leading-snug text-white/45">
            If {browserName} keeps blocking it, open {isIos ? "Safari" : "Chrome"} and paste the copied link.
          </p>
        </div>
      </div>
    </div>
  );
}

```

---

## FILE: src/lib/marketingGetApp.ts

```typescript
import { Capacitor } from "@capacitor/core";
import { detectInAppBrowser, type InAppBrowserDetection } from "@/lib/inAppBrowserDetection";
import {
  getCopyableStoreUrl,
  getMobileStoreHref,
  openMobileStoreViaAnchor,
} from "@/lib/mobileStoreHandoff";
import { logStoreHandoff } from "@/lib/mobileStoreHandoffDebug";
import { scrollToDownloadApp } from "@/lib/scrollToDownloadApp";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { readMarketingAttribution } from "@/lib/useMarketingAttribution";

export type MobileWebStore = "apple" | "google";

/** User-agent store hint for mobile browsers (not Capacitor native). */
export function getMobileWebStore(): MobileWebStore | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "google";
  if (/iPhone|iPad|iPod/i.test(ua)) return "apple";
  return null;
}

/** Desktop web = browser, wide viewport — show QR section instead of a store link. */
export function isDesktopMarketingWeb(isMobileViewport: boolean): boolean {
  return !Capacitor.isNativePlatform() && !isMobileViewport;
}

export type StoreClickResult =
  | { kind: "scrolled_to_qr" }
  | { kind: "opened_store"; store: MobileWebStore; url: string; copyUrl: string };

type StoreClickOptions = {
  isMobileViewport: boolean;
  forceStore?: MobileWebStore;
  source?: string;
  detection?: InAppBrowserDetection;
  /** When false, only track — navigation is handled by a native `<a href>`. */
  navigate?: boolean;
};

function readClickAttributionDetail(): Record<string, string | number | boolean | undefined> {
  const attribution = readMarketingAttribution();
  let ttclid: string | undefined;
  try {
    ttclid = new URLSearchParams(window.location.search).get("ttclid") ?? undefined;
  } catch {
    /* ignore */
  }
  return {
    utm_source: attribution?.utmSource ?? undefined,
    utm_medium: attribution?.utmMedium ?? undefined,
    utm_campaign: attribution?.utmCampaign ?? undefined,
    utm_content: attribution?.utmContent ?? undefined,
    utm_term: attribution?.utmTerm ?? undefined,
    is_paid: Boolean(attribution?.isPaid),
    from_tiktok: Boolean(attribution?.isFromTikTok),
    ttclid,
  };
}

export function trackStoreClick(
  store: MobileWebStore,
  source: string | undefined,
  detection: InAppBrowserDetection,
): { href: string; copyUrl: string } {
  const href = getMobileStoreHref(store, detection);
  const copyUrl = getCopyableStoreUrl(store);
  const action = store === "apple" ? "cta_app_store_click" : "cta_play_store_click";

  trackMarketingConversion(action, {
    source: source ?? "unknown",
    in_app_browser: detection.kind ?? "none",
    blocks_app_store: detection.blocksAppStore,
    store_href_scheme: href.split(":")[0],
    ...readClickAttributionDetail(),
  });

  logStoreHandoff("store_click_tracked", {
    source: source ?? "unknown",
    store,
    href,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    in_app_browser: detection.kind ?? "none",
    platform: detection.isIos ? "ios" : detection.isAndroid ? "android" : "unknown",
  });

  return { href, copyUrl };
}

/**
 * Centralized "user wants the app" handler.
 * Desktop → scroll to QR. Mobile → track (+ optional programmatic open).
 */
export function handleStoreClick(opts: StoreClickOptions): StoreClickResult {
  const { isMobileViewport, forceStore, source, navigate = true } = opts;
  const detection = opts.detection ?? detectInAppBrowser();

  if (isDesktopMarketingWeb(isMobileViewport)) {
    trackMarketingConversion("cta_header_app_click", {
      destination: "qr_section",
      source: source ?? "unknown",
      ...readClickAttributionDetail(),
    });
    scrollToDownloadApp();
    return { kind: "scrolled_to_qr" };
  }

  const store =
    forceStore ??
    getMobileWebStore() ??
    (isMobileViewport ? ("apple" as MobileWebStore) : null);
  if (!store) {
    trackMarketingConversion("cta_header_app_click", {
      destination: "qr_section_fallback",
      source: source ?? "unknown",
      ...readClickAttributionDetail(),
    });
    scrollToDownloadApp();
    return { kind: "scrolled_to_qr" };
  }

  const { href, copyUrl } = trackStoreClick(store, source, detection);

  if (navigate) {
    openMobileStoreViaAnchor(store, detection);
  }

  return { kind: "opened_store", store, url: href, copyUrl };
}

/** Legacy single-arg handler kept for back-compat with existing callers. */
export function handleMarketingGetAppClick(isMobileViewport: boolean): void {
  handleStoreClick({ isMobileViewport, source: "legacy" });
}

/** Whether a post-tap fallback sheet should be scheduled for this visit. */
export function shouldScheduleStoreFallback(
  isMobileViewport: boolean,
  detection: InAppBrowserDetection,
): boolean {
  if (!isMobileViewport || isDesktopMarketingWeb(isMobileViewport)) return false;
  if (!detection.isInAppBrowser) return false;
  return detection.blocksAppStore || detection.kind !== null;
}

```

---

## FILE: src/pages/GetAppStore.tsx

```tsx
import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PALETTE_PLOTTING_APP_STORE_URL } from "@/lib/appStore";
import { cn } from "@/lib/utils";
import { ToolPageSafeAreaInlet } from "@/components/ToolPageSafeAreaInlet";
import {
  toolPageActionButtonClass,
  toolPageBodyTextClass,
  toolPageMutedTextClass,
  toolPageOutlineButtonClass,
  toolPageShadcnCardClass,
  toolPageShellGradientClass,
  toolPageShellRootClass,
  toolPageShellRootStyle,
} from "@/lib/toolPageThemeStyles";

type QRStatus = "loading" | "ready" | "error";

const GetAppStore: React.FC = () => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const [qrData, setQrData] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<QRStatus>("loading");
  const [copied, setCopied] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved === "true";
  });

  useEffect(() => {
    QRCode.toDataURL(PALETTE_PLOTTING_APP_STORE_URL, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then((dataUrl) => {
        setQrData(dataUrl);
        setStatus("ready");
      })
      .catch((err) => {
        console.error("QR generation failed", err);
        setError("Could not generate QR code. Use the App Store button below.");
        setStatus("error");
      });
  }, []);

  const qrCard = (
    <Card className={cn("max-w-xl w-full p-6", toolPageShadcnCardClass(theme))}>
      <div className="text-center space-y-3">
        <h1 className={cn("text-2xl font-semibold", toolPageBodyTextClass(theme))}>Get the app</h1>
        <p className={cn("text-sm", toolPageMutedTextClass(theme))}>
          Scan this QR code with your phone to open Palette Plotting on the App Store.
        </p>
      </div>

      <div className="mt-6 flex flex-col items-center gap-4">
        {status === "ready" && qrData && (
          <a
            href={PALETTE_PLOTTING_APP_STORE_URL}
            rel="noopener noreferrer"
            className="rounded-xl bg-white p-3 shadow-md border border-gray-200"
          >
            <img
              src={qrData}
              alt="QR code to open Palette Plotting on the App Store"
              className="h-64 w-64"
            />
          </a>
        )}
        {status === "loading" && (
          <div className="h-64 w-64 flex items-center justify-center rounded-xl border border-dashed border-white/20 text-white/55 bg-transparent">
            Generating…
          </div>
        )}
        {status === "error" && (
          <div className="h-64 w-64 flex items-center justify-center rounded-xl border border-dashed border-red-400/50 text-red-400 bg-transparent">
            QR unavailable
          </div>
        )}
        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button asChild className={toolPageActionButtonClass(theme)}>
          <a href={PALETTE_PLOTTING_APP_STORE_URL} rel="noopener noreferrer">
            Open App Store
          </a>
        </Button>
        <Button
          variant="outline"
          className={toolPageOutlineButtonClass(theme)}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(PALETTE_PLOTTING_APP_STORE_URL);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              setCopied(false);
              setError("Copy failed. Please copy the App Store link manually.");
            }
          }}
        >
          {copied ? "Copied!" : "Copy App Store link"}
        </Button>
      </div>
    </Card>
  );

  if (isMobile) {
    return (
      <div
        className={cn(toolPageShellRootClass(theme), toolPageShellGradientClass(theme, "blue"), "min-h-screen flex items-center justify-center px-6 text-center")}
        style={toolPageShellRootStyle(theme)}
      >
        <ToolPageSafeAreaInlet />
        <div className="max-w-md space-y-4">
          <h1 className={cn("text-xl font-semibold", toolPageBodyTextClass(theme))}>Get the app</h1>
          <p className={cn("text-sm", toolPageMutedTextClass(theme))}>Palette Plotting is available on the App Store.</p>
          <Button asChild size="lg" className={toolPageActionButtonClass(theme)}>
            <a href={PALETTE_PLOTTING_APP_STORE_URL} rel="noopener noreferrer">
              Download on the App Store
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(toolPageShellRootClass(theme), toolPageShellGradientClass(theme, "blue"), "min-h-screen")}
      style={toolPageShellRootStyle(theme)}
    >
      <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />
      <div
        className="flex min-h-screen items-center justify-center px-4 py-10"
        style={{
          marginLeft: sidebarCollapsed ? "64px" : "256px",
          transition: "margin-left 300ms ease-in-out",
        }}
      >
        <ToolPageSafeAreaInlet />
        {qrCard}
      </div>
    </div>
  );
};

export default GetAppStore;

```

---

## FILE: src/components/WebGetAppAfterPurchaseDialog.tsx

```tsx
import { useCallback, useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import QRCode from "qrcode";
import { Capacitor } from "@capacitor/core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MarketingStoreBadges } from "@/components/marketing/MarketingStoreBadges";
import {
  preloadStoreBadgeImages,
  PALETTE_PLOTTING_APP_STORE_URL,
  PALETTE_PLOTTING_GOOGLE_PLAY_URL,
  STORE_BADGE_ROW_HEIGHT_PX,
} from "@/lib/appStore";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  isWebGetAppDialogPreviewMode,
  markWebGetAppPromptShown,
  shouldOfferWebGetAppPrompt,
} from "@/lib/webFirstPurchaseGetAppPrompt";
import { detectInAppBrowser } from "@/lib/inAppBrowserDetection";
import { getMobileStoreHref } from "@/lib/mobileStoreHandoff";
import type { MobileWebStore } from "@/lib/marketingGetApp";
import { cn } from "@/lib/utils";

const STORE_QRS = [
  {
    label: "App Store",
    href: PALETTE_PLOTTING_APP_STORE_URL,
    alt: "QR code for the App Store",
  },
  {
    label: "Google Play",
    href: PALETTE_PLOTTING_GOOGLE_PLAY_URL,
    alt: "QR code for Google Play",
  },
] as const;

function DesktopQrPair() {
  const [qrByHref, setQrByHref] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      STORE_QRS.map(async (store) => {
        const dataUrl = await QRCode.toDataURL(store.href, {
          width: 120,
          margin: 2,
          errorCorrectionLevel: "H",
          color: { dark: "#000000", light: "#ffffff" },
        });
        return [store.href, dataUrl] as const;
      }),
    )
      .then((entries) => {
        if (cancelled) return;
        setQrByHref(Object.fromEntries(entries));
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-wrap items-start justify-center gap-6 pt-2">
      {STORE_QRS.map((store) => (
        <div key={store.href} className="flex flex-col items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{store.label}</span>
          {ready && qrByHref[store.href] ? (
            <a
              href={store.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border bg-white p-2 shadow-sm"
            >
              <img
                src={qrByHref[store.href]}
                alt={store.alt}
                className="h-24 w-24"
                width={96}
                height={96}
              />
            </a>
          ) : (
            <div
              className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground"
              aria-busy={!ready}
            >
              …
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * One-time browser prompt after the user's first web subscription purchase.
 * Shown only off paywall/onboarding/post-paywall routes (e.g. dashboard).
 */
export function WebGetAppAfterPurchaseDialog() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const search = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [detection, setDetection] = useState(detectInAppBrowser);
  const previewMode = isWebGetAppDialogPreviewMode(search);

  const getStoreHref = useCallback(
    (store: MobileWebStore) => getMobileStoreHref(store, detection),
    [detection],
  );

  useEffect(() => {
    if (!open) return;
    setDetection(detectInAppBrowser());
  }, [open]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;

    if (!shouldOfferWebGetAppPrompt(pathname, search)) {
      setOpen(false);
      return;
    }

    preloadStoreBadgeImages(true);

    const delay = previewMode ? 100 : 500;
    const timer = window.setTimeout(() => {
      if (shouldOfferWebGetAppPrompt(pathname, search)) {
        setOpen(true);
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [pathname, search, previewMode]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next && !isWebGetAppDialogPreviewMode()) {
      markWebGetAppPromptShown();
    }
  };

  if (Capacitor.isNativePlatform()) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn("z-[200] max-w-sm sm:max-w-md", isMobile && "max-w-[calc(100vw-2rem)]")}
      >
        <DialogHeader>
          <DialogTitle>Get Palette Plotting on your phone</DialogTitle>
          <DialogDescription>
            Your membership is best experienced in the app. Scan or tap to install.
          </DialogDescription>
        </DialogHeader>

        {isMobile ? (
          <div
            className="flex w-full flex-col items-center gap-3 py-1"
            style={{ minHeight: STORE_BADGE_ROW_HEIGHT_PX }}
          >
            <MarketingStoreBadges
              layout="inline"
              size="lg"
              getStoreHref={getStoreHref}
            />
          </div>
        ) : (
          <DesktopQrPair />
        )}
      </DialogContent>
    </Dialog>
  );
}

```

---

## Review checklist

- [ ] `app-id` in `index.html` matches `PALETTE_PLOTTING_APP_STORE_ID` in `appStore.ts`
- [ ] Smart Banner is **Safari-only** — do not expect it in TikTok WebView
- [ ] No React code toggles `apple-itunes-app` — banner is static global meta
- [ ] `syncStatusBar` updates status bar chrome only, not the banner
- [ ] Explicit store CTAs use `mobileStoreHandoff` + `inAppBrowserDetection` (homepage); onboarding relies on banner in Safari only
- [ ] Badge images from `tools.applemediaservices.com` — preconnect in `index.html`
- [ ] Consider `app-argument` on meta if deep-linking from web → app is needed later

