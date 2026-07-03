# Web welcome page (/onboarding/welcome) — handoff

Generated: 2026-06-01 11:41
Branch: Mobile-app
Commit: cb968e0d

---

## What this page is

Route: `/onboarding/welcome`

| Surface | Body component | Shell |
|---------|----------------|-------|
| **Web browser** | `WelcomeBodyWeb` — app icon, headline, iPhone mockup carousel, toolbar, community proof | `OnboardingLayout` cosmic deep-black (`WelcomeCosmicBackground tone="deep-black"`) |
| **Native app** | `WelcomeBodyNative` — logo, eyebrow, title, feature grid | Same layout, native safe-area padding |

CTA: web `Make my subliminal` → `/onboarding/setup/name`. Native `Start my path`.

---

## iPhone mockup architecture (web only)

Replaces hidden 3-step tiles (`SHOW_WELCOME_WEB_STEP_TILES = false`).

**Assets**
- Frame: `/Transparent Base iPhone Mockup.png` (1080×1920, transparent PNG)
- Carousel screens: `/marketing/welcome-mockup-screens/subliminal-maker-*.png` (4 slides, 4.5s auto-rotate)

**DOM layers** (`WelcomeIphoneMockupWeb` in `Welcome.tsx`) — **current architecture (filter/clip fix)**

```
.sv-iphone-mockup-glow-wrap          height 13.75rem, overflow visible, isolation isolate
  <img.sv-iphone-frame-glow-source>  ONLY glow source — filter on PNG itself, mask fades bottom
  .sv-iphone-mockup-stack             z-1, NO filter
    .sv-iphone-mockup-visual          clip-path crops phone+carousel to 13.75rem, NO box-shadow
      .sv-iphone-mockup-screen-slot   carousel PNGs (never filtered)
      <img frame PNG>                 visible frame on top
```

**Glow rules (do not break):**
- `filter: drop-shadow` ONLY on `.sv-iphone-frame-glow-source` (transparent frame PNG)
- NEVER on `.sv-iphone-mockup-glow-wrap`, `.sv-iphone-mockup-stack`, `.sv-iphone-mockup-visual`, or carousel imgs
- NEVER wrap the glow img in `overflow: hidden` or `clip-path` parents with filter on wrapper
- Height crop stays on `.sv-iphone-mockup-visual` via `clip-path: inset(0 0 calc(100% - 13.75rem) 0)`
- Optional elliptical ambient: `.sv-iphone-mockup-glow-wrap::before` (radial gradient, not a rectangle)

**Removed (caused rectangular glow box):**
- `.sv-iphone-mockup-mobile-glow` + `.sv-iphone-mockup-mobile-glow-clip`
- `box-shadow: inset` on `.sv-iphone-mockup-visual`
- `filter` on stack/wrapper layers

**Screen inset** (`IPHONE_MOCKUP_SCREEN_INSET`): top 5.625%, left 12.963%, width 73.611%, height 88.802%, borderRadius 6%.

**CSS file:** `src/styles/welcome-web-effects.css` — logo glow, mockup glow, process streak zone, headline underline.

---

## Mockup glow — pass/fail test

| Pass | Fail |
|------|------|
| Glow follows phone/frame silhouette | Visible rectangular pink box around mockup |
| Phone bottom cropped at 13.75rem | Phone scaled down instead of cropped |
| No glow from carousel screenshots | Carousel alpha included in filtered layer |
| Dark cosmic background visible around phone | Hard rectangular frame behind phone |

Test on **mobile Safari** and **TikTok in-app browser** (WebKit).

---

## Document chrome (welcome / onboarding)

- `OnboardingLayout` sets `html/body/#root` to `#020104` + gradient via `!important` when `isCosmicShell`.
- `index.html` `syncStatusBar()` also sets onboarding colors when path starts with `/onboarding` (returns early before dashboard logic).
- **Do not** conflate with tool-page `#0f0d14` document chrome — welcome is `#020104`.

---

## Do NOT touch (unless explicitly asked)

- Tool pages / `tool-page-shell` / dashboard safe-area refactors
- Native welcome body layout
- `onboarding_sessions` edge functions
- Post-paywall, setup steps beyond welcome shell

---

## Files in this handoff

- src/pages/onboarding/Welcome.tsx
- src/styles/welcome-web-effects.css
- src/components/onboarding/WelcomeCosmicBackground.tsx
- src/components/onboarding/OnboardingLayout.tsx
- src/lib/webOnboardingSessionInsert.ts
- index.html

## FILE: src/pages/onboarding/Welcome.tsx

```tsx
import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import {
  WELCOME_ACCENT,
} from "@/components/onboarding/WelcomeCosmicBackground";
import {
  AffirmationGlassIcon,
  PlayOrbIcon,
  ThetaWaveIcon,
} from "@/components/onboarding/SubliminalVisualTiles";
import {
  Bot,
  Heart,
  PenLine,
  Star,
  ScanFace,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsNativeApp } from "@/hooks/use-native-app";
import {
  markWebOnboardingMakeMySubliminalCtaClicked,
  recordWebOnboardingSessionStart,
} from "@/lib/webOnboardingSessionInsert";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { readMarketingAttribution } from "@/lib/useMarketingAttribution";
import { cn } from "@/lib/utils";
import { signalNativeSplashReadyToHide } from "@/components/NativeAppRootRedirect";
import "@/styles/welcome-web-effects.css";

/** Transparent brand logo — native splash + welcome native body. */
const WELCOME_LOGO = "/welcome-logo.png";
/** Rounded app icon — web welcome hero (matches App Store icon). */
const WELCOME_APP_ICON = "/apple-ios-logo.png";
const WELCOME_EYEBROW = "subliminals · LOA · SP · scripting · self-concept";

const WELCOME_CONTINUE_TEXT = "Start my path";
const WELCOME_CONTINUE_TEXT_WEB = "Make my subliminal";
const WELCOME_CTA_SUBTEXT = "Personalize your first subliminal in less than 3 minutes";
const WELCOME_CTA_SUBTEXT_NATIVE = "~3 min set up";

const WELCOME_PRIMARY_CTA_CLASS =
  "h-12 rounded-xl border-0 bg-white font-sans text-[15px] font-semibold tracking-[-0.01em] text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.24),0_8px_28px_rgba(0,0,0,0.28)] hover:bg-zinc-50 active:bg-zinc-100 focus:bg-white";

const WELCOME_WEB_CTA_CLASS = cn(
  WELCOME_PRIMARY_CTA_CLASS,
  "h-[3.35rem] rounded-full text-[15px] font-bold",
  "shadow-[0_0_40px_rgba(232,150,190,0.38),0_8px_28px_rgba(0,0,0,0.32)]",
);

/** Centered rows with dot separators — native only. */
const WELCOME_TOOL_ROWS: readonly (readonly string[])[] = [
  ["Subliminal Maker", "Robotic Affirming", "Scripting"],
  ["Mirror Work", "Belief Work", "Inspired Action"],
  ["Manifestation Lists", "AI Manifesting Guide"],
];

const WELCOME_TOOL_TEXT_CLASS = cn(
  "font-welcome-serif text-[13px] font-normal leading-[1.45] text-[#e8b8cc]",
);

const WELCOME_TOOL_BULLET_CLASS = cn(
  "px-1.5 font-welcome-serif text-[13px] text-[#e8b8cc]/65",
);

const WELCOME_WEB_LAVENDER = "#e8b8d4";
const WELCOME_WEB_LAVENDER_MUTED = "#b898b0";
const SHOW_WELCOME_WEB_STEP_TILES = false;
const IPHONE_MOCKUP_FRAME_SRC = "/Transparent Base iPhone Mockup.png";
const WELCOME_MOCKUP_AUTO_MS = 4500;
/** Screen snapshots — auto-rotate inside the welcome iPhone mockup. */
const WELCOME_WEB_MOCKUP_SCREENS = [
  {
    src: "/marketing/welcome-mockup-screens/subliminal-maker-tracks.png",
    alt: "Subliminal Maker — your tracks",
  },
  {
    src: "/marketing/welcome-mockup-screens/subliminal-maker-vocal.png",
    alt: "Subliminal Maker — vocal base",
  },
  {
    src: "/marketing/welcome-mockup-screens/subliminal-maker-binaural.png",
    alt: "Subliminal Maker — binaural beats",
  },
  {
    src: "/marketing/welcome-mockup-screens/subliminal-maker-settings.png",
    alt: "Subliminal Maker — subliminal settings",
  },
] as const;
/** Inner screen opening inside bezels — Transparent Base iPhone Mockup.png (1080×1920). */
const IPHONE_MOCKUP_SCREEN_INSET = {
  top: "5.625%",
  left: "12.963%",
  width: "73.611%",
  height: "88.802%",
  borderRadius: "6%",
} as const;

const WELCOME_WEB_STEPS = [
  {
    title: "Choose your desire",
    subtitle: "Love · SP · Beauty · Abundance · Self-concept",
    icon: <AffirmationGlassIcon />,
  },
  {
    title: "Make it yours",
    subtitle: "Your affirmations, your voice, your sounds",
    icon: <ThetaWaveIcon />,
  },
  {
    title: "Listen & repeat",
    subtitle: "Your subliminals, ready to play daily",
    icon: <PlayOrbIcon />,
  },
] as const;

const WELCOME_WEB_TOOLBAR = [
  { label: "Robotic Affirming", icon: Bot },
  { label: "Scripting", icon: PenLine },
  { label: "Mirror Work", icon: ScanFace },
  { label: "& More", icon: Wrench },
] as const;

/** Bust CDN/browser cache when avatar PNGs are replaced. */
const WELCOME_AVATAR_VERSION = "genz-v4";

const WELCOME_COMMUNITY_AVATARS = [
  `/marketing/welcome-avatars/welcome-community-avatar-1.png?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-2.png?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-3.png?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-4.png?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-5.png?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-6.png?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-7.png?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-8.png?v=${WELCOME_AVATAR_VERSION}`,
] as const;

const AWARD_STAR_CLASS = "h-3 w-3 fill-[#d4d4d8] text-[#e4e4e7]";

const STAR_PAREN_OFFSETS = {
  left: ["translate-x-[7px]", "translate-x-[3px]", "translate-x-0", "translate-x-[3px]", "translate-x-[7px]"],
  right: ["-translate-x-[7px]", "-translate-x-[3px]", "translate-x-0", "-translate-x-[3px]", "-translate-x-[7px]"],
} as const;

function StarParen({ side }: { side: "left" | "right" }) {
  const offsets = STAR_PAREN_OFFSETS[side];
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col justify-center gap-[6px] py-1",
        side === "left" ? "items-end" : "items-start",
      )}
      aria-hidden
    >
      {offsets.map((offset, i) => (
        <Star key={i} className={cn(AWARD_STAR_CLASS, offset)} />
      ))}
    </div>
  );
}

function WelcomeAwardLineNative() {
  return (
    <div
      className="relative z-10 flex w-full items-center justify-center gap-3 px-1"
      aria-label="One of the most comprehensive manifesting apps"
    >
      <StarParen side="left" />
      <p className="text-center font-sans text-[11px] font-medium uppercase leading-[1.35] tracking-[0.14em] text-white">
        <span className="block">One of the most</span>
        <span className="block">comprehensive</span>
        <span className="block">manifesting apps</span>
      </p>
      <StarParen side="right" />
    </div>
  );
}

function WelcomeFeatureGrid() {
  return (
    <div className="relative z-10 flex w-full justify-center px-1">
      <div className="flex flex-col items-center gap-2.5 text-center">
        {WELCOME_TOOL_ROWS.map((row) => (
          <p key={row[0]} className={WELCOME_TOOL_TEXT_CLASS}>
            {row.map((label, index) => (
              <Fragment key={label}>
                {index > 0 ? (
                  <span className={WELCOME_TOOL_BULLET_CLASS} aria-hidden>
                    ·
                  </span>
                ) : null}
                <span>{label}</span>
              </Fragment>
            ))}
          </p>
        ))}
      </div>
    </div>
  );
}

function WelcomeLogo({ size = "full" }: { size?: "full" | "compact" }) {
  const sizeClass = size === "compact"
    ? "mb-2 flex h-[5rem] w-[5rem] shrink-0 items-center justify-center"
    : "mb-3 flex h-[7.5rem] w-[7.5rem] shrink-0 items-center justify-center";
  return (
    <div className={sizeClass}>
      <img
        src={WELCOME_LOGO}
        alt="Palette Plotting"
        className="h-full w-full object-contain"
        width={size === "compact" ? 80 : 120}
        height={size === "compact" ? 80 : 120}
        decoding="async"
        fetchPriority="high"
      />
    </div>
  );
}

function WelcomeAppIcon() {
  return (
    <div className="sv-logo-glow-wrap mb-2">
      <img
        src={WELCOME_APP_ICON}
        alt="Palette Plotting"
        className="sv-logo-glow-img"
        width={138}
        height={138}
        decoding="async"
        fetchPriority="high"
      />
    </div>
  );
}

function WelcomeEyebrow() {
  return (
    <p className="text-center font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
      {WELCOME_EYEBROW}
    </p>
  );
}

function WelcomeTitleNative() {
  return (
    <h1 className="font-welcome-serif mt-0 max-w-[19rem] text-center text-[28px] font-normal leading-[1.14] tracking-[-0.02em] text-white md:mt-3 sm:text-[31px]">
      Your manifesting methods,{" "}
      <span style={{ color: WELCOME_ACCENT }}>in one place</span>
    </h1>
  );
}

function WelcomeHeadlineWeb() {
  return (
    <div className="sv-hero-headline-wrap sv-hero-headline-wrap--welcome relative z-10">
      <h1 className="sv-hero-headline">
        <span>Manifest your desires now,</span>
        <span className="sv-hero-headline-accent">Make your own subliminals</span>
      </h1>

      <div className="sv-headline-underline" aria-hidden="true">
        <svg viewBox="0 0 420 24" preserveAspectRatio="none">
          <path d="M8 14 C120 10 300 10 412 14" />
        </svg>
      </div>
    </div>
  );
}

function WelcomeStepCard({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex w-full items-center gap-3 rounded-[1.15rem] border border-white/[0.09] bg-[#100d16]/75 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md">
      <div
        className="relative flex h-11 w-12 shrink-0 items-center justify-center overflow-visible [&_svg]:h-11 [&_svg]:w-auto"
        aria-hidden
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="font-sans text-[13px] font-semibold leading-tight text-white/95">{title}</p>
        <p className="mt-0.5 font-sans text-[11px] leading-snug text-white/42">{subtitle}</p>
      </div>
    </div>
  );
}

function WelcomeToolbarWeb() {
  return (
    <div className="flex w-full items-stretch justify-between gap-0 px-0.5 py-2">
      {WELCOME_WEB_TOOLBAR.map(({ label, icon: Icon }, index) => (
        <Fragment key={label}>
          {index > 0 ? (
            <div className="w-px shrink-0 self-stretch bg-white/[0.1]" aria-hidden />
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5">
            <Icon
              className="h-3.5 w-3.5 shrink-0"
              strokeWidth={1.65}
              style={{ color: WELCOME_WEB_LAVENDER_MUTED }}
              aria-hidden
            />
            <span
              className="text-center font-sans text-[8px] font-medium leading-tight"
              style={{ color: `${WELCOME_WEB_LAVENDER_MUTED}cc` }}
            >
              {label}
            </span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

function WelcomeCommunityProofWeb() {
  return (
    <div className="relative z-10 flex w-full items-center justify-center gap-2 pt-0.5">
      <div className="flex shrink-0 items-center pl-0.5" aria-hidden>
        {WELCOME_COMMUNITY_AVATARS.map((src, index) => (
          <div
            key={src}
            className="relative -ml-2 h-7 w-7 shrink-0 overflow-hidden rounded-full border border-[#c994b8]/45 shadow-[0_0_10px_rgba(200,148,184,0.25)] first:ml-0 sm:h-8 sm:w-8 sm:-ml-2.5"
            style={{ zIndex: WELCOME_COMMUNITY_AVATARS.length - index }}
          >
            <img
              src={src}
              alt=""
              className="h-full w-full object-cover object-center"
              loading="lazy"
              decoding="async"
            />
          </div>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Heart className="h-3 w-3 shrink-0 fill-[#e8a8c8] text-[#e8a8c8]" aria-hidden />
        <p
          className="shrink-0 text-left font-sans text-[10px] font-medium leading-[1.2] tracking-[0.02em]"
          style={{ color: `${WELCOME_WEB_LAVENDER}e6` }}
        >
          Loved by manifestors
        </p>
        <Heart className="h-3 w-3 shrink-0 fill-[#e8a8c8] text-[#e8a8c8]" aria-hidden />
      </div>
    </div>
  );
}

function WelcomeIphoneMockupWeb() {
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    for (const slide of WELCOME_WEB_MOCKUP_SCREENS) {
      const img = new Image();
      img.src = slide.src;
    }
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % WELCOME_WEB_MOCKUP_SCREENS.length);
    }, WELCOME_MOCKUP_AUTO_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="sv-process-streak-zone">
      {SHOW_WELCOME_WEB_STEP_TILES ? (
        <div className="sv-process-card flex w-full flex-col gap-2">
          {WELCOME_WEB_STEPS.map((step) => (
            <WelcomeStepCard key={step.title} {...step} />
          ))}
        </div>
      ) : (
        <div
          className="sv-iphone-mockup-glow-wrap sv-process-card mx-auto w-full max-w-[18rem]"
          aria-roledescription="carousel"
          aria-label="Subliminal Maker app screens"
        >
          <img
            src={IPHONE_MOCKUP_FRAME_SRC}
            alt=""
            className="sv-iphone-frame-glow-source"
            aria-hidden
            draggable={false}
          />
          <div className="sv-iphone-mockup-stack relative z-[1]">
            <div className="sv-iphone-mockup-visual">
              <div
                className="sv-iphone-mockup-screen-slot pointer-events-none absolute overflow-hidden"
                style={IPHONE_MOCKUP_SCREEN_INSET}
              >
                {WELCOME_WEB_MOCKUP_SCREENS.map((slide, index) => {
                  const isActive = index === slideIndex;
                  return (
                    <img
                      key={slide.src}
                      src={slide.src}
                      alt={isActive ? slide.alt : ""}
                      aria-hidden={!isActive}
                      className={cn(
                        "sv-iphone-mockup-screen absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-700 ease-in-out motion-reduce:transition-none",
                        isActive ? "opacity-100" : "opacity-0",
                      )}
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : undefined}
                      decoding="async"
                      draggable={false}
                    />
                  );
                })}
              </div>
              <img
                src={IPHONE_MOCKUP_FRAME_SRC}
                alt=""
                className="relative z-10 block h-auto w-full object-contain"
                aria-hidden
                draggable={false}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function WelcomeDescriptionNative() {
  return (
    <p className="max-w-[21rem] text-center font-sans text-[14px] leading-[1.55] text-white/58">
      Manifest on easy mode with one solution for all core techniques. Make your own
      subliminals, customize your affirmations, do mirror work, and more.
    </p>
  );
}

function detectSubliminalTraffic(): boolean {
  const attr = readMarketingAttribution();
  if (!attr) return false;
  const fields = [attr.utmCampaign, attr.utmContent, attr.utmTerm].join(" ").toLowerCase();
  return fields.includes("subliminal") || fields.includes("subs ");
}

type WelcomeBodyNativeProps = {
  topPaddingClass?: string;
  contentLiftClass?: string;
};

function WelcomeBodyNative({ topPaddingClass, contentLiftClass }: WelcomeBodyNativeProps) {
  return (
    <div
      className={cn(
        "relative z-10 mx-auto flex w-full max-w-[26rem] flex-col items-center gap-5",
        topPaddingClass,
        contentLiftClass,
      )}
    >
      <WelcomeLogo size="full" />
      <WelcomeEyebrow />
      <WelcomeTitleNative />
      <WelcomeDescriptionNative />
      <WelcomeAwardLineNative />
      <WelcomeFeatureGrid />
    </div>
  );
}

type WelcomeBodyWebProps = {
  topPaddingClass?: string;
  contentLiftClass?: string;
};

function WelcomeBodyWeb({ topPaddingClass, contentLiftClass }: WelcomeBodyWebProps) {
  return (
    <div
      className={cn(
        "relative z-10 mx-auto flex w-full max-w-[22rem] flex-col items-center gap-2",
        topPaddingClass,
        contentLiftClass,
      )}
    >
      <WelcomeAppIcon />
      <WelcomeHeadlineWeb />
      <WelcomeIphoneMockupWeb />
      <WelcomeToolbarWeb />
      <WelcomeCommunityProofWeb />
    </div>
  );
}

const welcomeLayoutPropsBase = {
  currentPage: 1 as const,
  welcomePage: true,
  stackedNativeButtons: true,
  stackedNativePrimaryButtonClassName: WELCOME_PRIMARY_CTA_CLASS,
  welcomeSignInAsTextLink: true,
};

const Welcome = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const isNative = useIsNativeApp();
  const isMobile = useIsMobile();

  const isSubliminalTraffic = useMemo(() => !isNative && detectSubliminalTraffic(), [isNative]);

  useEffect(() => {
    if (isNative) return;
    recordWebOnboardingSessionStart({
      isMobileViewport: isMobile,
      entryPath: "/onboarding/welcome",
    });
    trackMarketingConversion("cta_web_onboarding_click", {
      sub_action: "welcome_view",
      source: "welcome_page",
      is_subliminal_traffic: isSubliminalTraffic,
    });
  }, [isNative, isMobile, isSubliminalTraffic]);

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!isNative) return;
    let cancelled = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(() => {
          if (cancelled) return;
          signalNativeSplashReadyToHide();
        }, 75);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [isNative]);

  const onContinue = () => {
    if (!isNative) {
      trackMarketingConversion("web_onboarding_click", {
        sub_action: "welcome_continue_click",
        source: "welcome_cta",
        is_subliminal_traffic: isSubliminalTraffic,
      });
      markWebOnboardingMakeMySubliminalCtaClicked();
    }
    navigate("/onboarding/setup/name");
  };

  return (
    <OnboardingLayout
      {...welcomeLayoutPropsBase}
      onContinue={onContinue}
      continueText={isNative ? WELCOME_CONTINUE_TEXT : WELCOME_CONTINUE_TEXT_WEB}
      welcomeCtaSubtext={isNative ? WELCOME_CTA_SUBTEXT_NATIVE : WELCOME_CTA_SUBTEXT}
      welcomeSoloContinueButtonClassName={
        isNative ? WELCOME_PRIMARY_CTA_CLASS : WELCOME_WEB_CTA_CLASS
      }
      contentMaxWidthClass="max-w-[22rem]"
    >
      {isNative ? (
        <WelcomeBodyNative
          topPaddingClass="pt-[calc(var(--app-safe-area-top)+1.25rem)]"
          contentLiftClass="-translate-y-[0.32in]"
        />
      ) : (
        <WelcomeBodyWeb
          topPaddingClass="pt-1 md:pt-1.5"
          contentLiftClass="-translate-y-[0.08in]"
        />
      )}
    </OnboardingLayout>
  );
};

export default Welcome;

```

---

## FILE: src/styles/welcome-web-effects.css

```css
/* =============================================================================
   1. Palette Plotting logo glow — web welcome hero only
   Soft luminous aura behind the app icon. No rings, halos, or orbital strokes.
   ============================================================================= */

.sv-logo-glow-wrap {
  position: relative;
  width: 168px;
  height: 168px;
  margin: 0 auto;
  display: grid;
  place-items: center;
  isolation: isolate;
}

.sv-logo-glow-wrap::before {
  content: "";
  position: absolute;
  inset: 10px;
  border-radius: 34px;
  z-index: -2;

  background:
    radial-gradient(
      circle at 50% 50%,
      rgba(247, 167, 221, 0.45) 0%,
      rgba(200, 167, 255, 0.32) 34%,
      rgba(143, 92, 255, 0.16) 58%,
      rgba(143, 92, 255, 0) 78%
    );

  filter: blur(22px);
  transform: scale(1.16);
  opacity: 0.95;
}

.sv-logo-glow-wrap::after {
  content: "";
  position: absolute;
  inset: 26px;
  border-radius: 28px;
  z-index: -1;

  background:
    radial-gradient(
      circle at 50% 48%,
      rgba(255, 232, 195, 0.24) 0%,
      rgba(247, 167, 221, 0.20) 42%,
      rgba(200, 167, 255, 0.10) 64%,
      rgba(200, 167, 255, 0) 78%
    );

  filter: blur(10px);
  opacity: 0.85;
}

.sv-logo-glow-img {
  width: 138px;
  height: 138px;
  display: block;
  border-radius: 28px;
  object-fit: cover;

  box-shadow:
    0 0 28px rgba(247, 167, 221, 0.26),
    0 0 52px rgba(200, 167, 255, 0.18),
    0 10px 36px rgba(0, 0, 0, 0.28);
}

@media (max-width: 420px) {
  .sv-logo-glow-wrap {
    width: 142px;
    height: 142px;
  }

  .sv-logo-glow-img {
    width: 118px;
    height: 118px;
    border-radius: 24px;
  }

  .sv-logo-glow-wrap::before {
    filter: blur(18px);
    transform: scale(1.14);
  }
}

/* =============================================================================
   iPhone mockup: cropped visible phone + silhouette glow
   ============================================================================= */

.sv-iphone-mockup-glow-wrap {
  position: relative;
  height: 13.75rem;
  overflow: visible;
  isolation: isolate;
}

/*
  This is the ONLY glow source.
  It must be the transparent iPhone frame PNG only.
  Do not put carousel screenshots in this layer.
  Do not apply filter to a parent wrapper.
*/
.sv-iphone-frame-glow-source {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 0;

  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
  pointer-events: none;
  user-select: none;

  /*
    IMPORTANT:
    The filter is on the PNG itself, not on a wrapper.
    Since the frame PNG is transparent, drop-shadow follows the frame alpha
    instead of forming a rectangular box.
  */
  filter:
    drop-shadow(0 0 4px rgba(232, 160, 204, 0.72))
    drop-shadow(0 0 14px rgba(232, 160, 204, 0.42))
    drop-shadow(0 0 30px rgba(200, 130, 210, 0.22));

  opacity: 0.88;

  /*
    Keep the glow visually limited to the upper visible phone region without
    putting the filtered element inside an overflow-hidden parent.
    This avoids the rectangular WebKit glow box.
  */
  -webkit-mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 1) 0,
    rgba(0, 0, 0, 1) 13.4rem,
    rgba(0, 0, 0, 0.34) 13.75rem,
    rgba(0, 0, 0, 0) 14.35rem
  );
  mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 1) 0,
    rgba(0, 0, 0, 1) 13.4rem,
    rgba(0, 0, 0, 0.34) 13.75rem,
    rgba(0, 0, 0, 0) 14.35rem
  );
}

.sv-iphone-mockup-stack {
  position: relative;
  z-index: 1;
}

/*
  This clips the visible phone/screenshot only.
  This layer should NOT have filter/drop-shadow.
*/
.sv-iphone-mockup-visual {
  position: relative;
  clip-path: inset(0 0 calc(100% - 13.75rem) 0);
  filter: none;
  box-shadow: none;
}

.sv-iphone-mockup-screen-slot {
  z-index: 0;
  background: transparent;
}

.sv-iphone-mockup-screen {
  display: block;
  will-change: opacity;
}

/*
  Optional soft ambient glow behind the phone.
  This is an ellipse, not a rectangle, and it sits behind the phone.
  Keep it subtle. If it looks boxy, remove this pseudo-element.
*/
.sv-iphone-mockup-glow-wrap::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 45%;
  z-index: -1;
  width: 94%;
  height: 46%;
  transform: translate(-50%, -50%);
  border-radius: 999px;

  background:
    radial-gradient(
      ellipse at center,
      rgba(238, 166, 218, 0.18) 0%,
      rgba(200, 140, 220, 0.10) 45%,
      rgba(200, 140, 220, 0) 75%
    );

  filter: blur(18px);
  opacity: 0.82;
  pointer-events: none;
}

/* Mobile tuning */
@media (max-width: 420px) {
  .sv-iphone-frame-glow-source {
    filter:
      drop-shadow(0 0 3px rgba(232, 160, 204, 0.66))
      drop-shadow(0 0 11px rgba(232, 160, 204, 0.36))
      drop-shadow(0 0 24px rgba(200, 130, 210, 0.18));
    opacity: 0.84;
  }

  .sv-iphone-mockup-glow-wrap::before {
    width: 90%;
    height: 42%;
    opacity: 0.68;
    filter: blur(16px);
  }
}

/* =============================================================================
   2. Process streak zone — behind the three step cards only (not logo/headline)
   Subtle horizontal light-wave streaks at ~30% intensity.
   ============================================================================= */

.sv-process-streak-zone {
  position: relative;
  width: 100%;
  margin: 13px auto 0;
  isolation: isolate;
}

.sv-process-streak-zone::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 42%;
  width: min(860px, 118vw);
  height: 250px;
  transform: translate(-50%, -50%);
  z-index: -2;
  pointer-events: none;

  opacity: 0.30;

  background:
    radial-gradient(
      ellipse at 48% 52%,
      rgba(247, 167, 221, 0.14) 0%,
      rgba(200, 167, 255, 0.10) 34%,
      rgba(143, 92, 255, 0.04) 58%,
      transparent 74%
    );
}

.sv-process-streak-zone::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 43%;
  width: min(860px, 122vw);
  height: 250px;
  transform: translate(-50%, -50%);
  z-index: -1;
  pointer-events: none;

  opacity: 0.30;

  background:
    url("data:image/svg+xml,%3Csvg width='900' height='260' viewBox='0 0 900 260' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg opacity='1' filter='url(%23blur)'%3E%3Cpath d='M-40 170 C 120 52, 230 58, 390 132 C 540 202, 690 198, 940 56' stroke='%23F7A7DD' stroke-opacity='0.55' stroke-width='3'/%3E%3Cpath d='M-70 194 C 110 76, 250 72, 420 146 C 560 208, 710 202, 970 84' stroke='%23C8A7FF' stroke-opacity='0.42' stroke-width='2'/%3E%3Cpath d='M-50 142 C 120 36, 260 48, 430 116 C 600 184, 720 160, 960 32' stroke='%238F5CFF' stroke-opacity='0.28' stroke-width='2'/%3E%3C/g%3E%3Cdefs%3E%3Cfilter id='blur' x='-100' y='-80' width='1100' height='420' filterUnits='userSpaceOnUse'%3E%3CfeGaussianBlur stdDeviation='4'/%3E%3C/filter%3E%3C/defs%3E%3C/svg%3E")
      center / 100% 100% no-repeat;

  mix-blend-mode: screen;
}

.sv-process-card {
  position: relative;
  z-index: 1;
}

@media (max-width: 420px) {
  .sv-process-streak-zone {
    margin-top: 10px;
  }

  .sv-process-streak-zone::before,
  .sv-process-streak-zone::after {
    width: 128vw;
    height: 210px;
    top: 46%;
    opacity: 0.24;
  }
}

/* =============================================================================
   3. Welcome headline underline — long, shallow luminous stroke (not a mouth arc)
   ============================================================================= */

.sv-hero-headline-wrap {
  position: relative;
  width: min(100%, 860px);
  margin: 0 auto;
  text-align: center;
}

.sv-hero-headline {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;

  font-family: var(--font-serif, "Cormorant Garamond", "Georgia", serif);
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 0.98;

  font-size: clamp(2.85rem, 8.6vw, 5.25rem);
  color: rgba(255, 255, 255, 0.96);

  text-shadow:
    0 2px 12px rgba(0, 0, 0, 0.42),
    0 0 18px rgba(255, 255, 255, 0.07);
}

.sv-hero-headline-accent {
  color: #e8bfdc;
  text-shadow:
    0 0 14px rgba(247, 167, 221, 0.22),
    0 2px 12px rgba(0, 0, 0, 0.42);
}

.sv-headline-underline {
  width: min(54%, 420px);
  height: 24px;
  margin: 5px auto 0;
  opacity: 0.92;
  pointer-events: none;

  -webkit-mask-image: linear-gradient(
    90deg,
    transparent 0%,
    black 14%,
    black 86%,
    transparent 100%
  );
  mask-image: linear-gradient(
    90deg,
    transparent 0%,
    black 14%,
    black 86%,
    transparent 100%
  );
}

.sv-headline-underline svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.sv-headline-underline path {
  fill: none;
  stroke: rgba(238, 179, 229, 0.88);
  stroke-width: 2.25;
  stroke-linecap: round;
  filter:
    drop-shadow(0 0 4px rgba(247, 167, 221, 0.42))
    drop-shadow(0 0 10px rgba(200, 167, 255, 0.18));
}

/* Narrow onboarding welcome column — keep existing serif scale + gradient accent */
.sv-hero-headline-wrap--welcome {
  width: 100%;
  max-width: 21rem;
}

.sv-hero-headline-wrap--welcome .sv-hero-headline {
  font-family: Georgia, "Times New Roman", serif;
  font-weight: 400;
  font-size: clamp(1.625rem, 6.5vw, 1.6875rem);
  line-height: 1.22;
  letter-spacing: -0.02em;
  text-shadow: none;
}

.sv-hero-headline-wrap--welcome .sv-hero-headline-accent {
  margin-top: 0.125rem;
  white-space: nowrap;
  background: linear-gradient(to right, #f0d0e4, #e8b8d4, #d8a8c8);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: none;
}

@media (max-width: 420px) {
  .sv-hero-headline {
    font-size: clamp(2.45rem, 10.8vw, 3.25rem);
    line-height: 1.02;
  }

  .sv-headline-underline {
    width: 52%;
    height: 18px;
    margin-top: 4px;
  }

  .sv-headline-underline path {
    stroke-width: 1.8;
  }

  .sv-hero-headline-wrap--welcome .sv-hero-headline {
    font-size: clamp(1.625rem, 6.5vw, 1.6875rem);
    line-height: 1.22;
  }
}

```

---

## FILE: src/components/onboarding/WelcomeCosmicBackground.tsx

```tsx
/** Welcome palette — deep violet night, subtle accent (not loud pink). */
export const WELCOME_ACCENT = "#c9a8bc";
export const WELCOME_COSMIC_BASE = "#0a0812";
export const WELCOME_DEEP_BLACK_BASE = "#020104";
export const WELCOME_DEEP_BLACK_MID = "#050308";
export const WELCOME_DEEP_BLACK_SHELL_BG = `linear-gradient(180deg, ${WELCOME_DEEP_BLACK_BASE} 0%, ${WELCOME_DEEP_BLACK_MID} 48%, ${WELCOME_DEEP_BLACK_BASE} 100%)`;

const WELCOME_STARS: readonly { x: number; y: number; r: number; o: number }[] = Array.from(
  { length: 72 },
  (_, i) => ({
    x: ((i * 41 + 13) % 98) + 1,
    y: ((i * 29 + 7) % 97) + 1.5,
    r: i % 4 === 0 ? 0.2 : i % 3 === 0 ? 0.14 : 0.1,
    o: i % 4 === 0 ? 0.5 : 0.28,
  }),
);

/** Restrained starfield — one nebula, no bokeh blobs. */
export function WelcomeCosmicBackground({
  className,
  tone = "cosmic",
}: {
  className?: string;
  tone?: "cosmic" | "deep-black";
}) {
  const deepBlack = tone === "deep-black";

  return (
    <div className={className} aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: deepBlack
            ? WELCOME_DEEP_BLACK_SHELL_BG
            : `linear-gradient(180deg, ${WELCOME_COSMIC_BASE} 0%, #0f0d14 50%, #0a0812 100%)`,
        }}
      />
      <svg
        className={
          deepBlack
            ? "absolute inset-0 h-full w-full opacity-60"
            : "absolute inset-0 h-full w-full opacity-80"
        }
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {WELCOME_STARS.map((star, index) => (
          <circle key={index} cx={star.x} cy={star.y} r={star.r} fill="#fff" opacity={star.o} />
        ))}
      </svg>
      <div
        className={
          deepBlack
            ? "absolute inset-0 bg-[radial-gradient(ellipse_78%_46%_at_50%_-8%,rgba(86,44,92,0.20),transparent_72%)]"
            : "absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-5%,rgba(88,62,110,0.35),transparent_70%)]"
        }
      />
      <div
        className={
          deepBlack
            ? "absolute inset-0 bg-[radial-gradient(ellipse_110%_70%_at_50%_108%,rgba(0,0,0,0.86),transparent_54%)]"
            : "absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_100%,rgba(0,0,0,0.5),transparent_50%)]"
        }
      />
    </div>
  );
}

```

---

## FILE: src/components/onboarding/OnboardingLayout.tsx

```tsx
import { ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useIsStandaloneMobile } from "@/hooks/use-standalone-mobile";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  WelcomeCosmicBackground,
  WELCOME_DEEP_BLACK_BASE,
  WELCOME_DEEP_BLACK_SHELL_BG,
} from "@/components/onboarding/WelcomeCosmicBackground";
import { ONBOARDING_ROUTES, ONBOARDING_STEP_COUNT } from "@/lib/onboardingFlow";
import {
  SETUP_DESKTOP_CHEVRON_CLASS,
  SETUP_NATIVE_BACK_BTN_CLASS,
  SETUP_NATIVE_CONTINUE_BTN_CLASS,
  SETUP_PRIMARY_CTA_CLASS,
} from "@/lib/onboardingSetupTheme";

interface OnboardingLayoutProps {
  children: ReactNode;
  onContinue: () => void;
  currentPage: number;
  continueText?: string;
  canContinue?: boolean;
  /** When true (Welcome page only), native app shows Continue on top and Sign In below, stacked. */
  stackedNativeButtons?: boolean;
  /** Native only: main content column grows so children can use flex-1 + justify-center (e.g. Welcome pills). */
  expandNativeContentColumn?: boolean;
  /** Max width for main stack + native mobile footer (default max-w-md). Welcome uses max-w-lg for feature pills. */
  contentMaxWidthClass?: string;
  /**
   * Native app only (non-stacked): replaces the fixed Back + Continue row, e.g. StoreKit monthly/annual
   * on older iOS where RevenueCat paywall UI is not used.
   */
  nativeFooterSlot?: ReactNode;
  /** Welcome only: merged onto stacked native primary/secondary buttons (visual only; keep layout in layout). */
  stackedNativePrimaryButtonClassName?: string;
  stackedNativeSecondaryButtonClassName?: string;
  /** Welcome only: merged onto the single mobile web Continue button. */
  welcomeSoloContinueButtonClassName?: string;
  /** Welcome route: full-bleed hero + mobile web footer layout (independent of button class overrides). */
  welcomePage?: boolean;
  /** Account step: same cosmic shell as welcome/setup (e.g. setup/email). */
  setupCosmicPage?: boolean;
  /** Shown under primary CTA on welcome (e.g. setup time / no card). */
  welcomeCtaSubtext?: string;
  /** Welcome native: text link for sign-in instead of a full secondary button. */
  welcomeSignInAsTextLink?: boolean;
  /**
   * Native form pages (email/password, etc.): fixed viewport + scrollable body so fields stay
   * visible above the keyboard and fixed footer. Do not set on Welcome or paywall routes.
   */
  nativeFormPage?: boolean;
}

export const OnboardingLayout = ({ 
  children, 
  onContinue, 
  currentPage,
  continueText = "Continue",
  canContinue = true,
  stackedNativeButtons = false,
  nativeFooterSlot,
  expandNativeContentColumn = false,
  contentMaxWidthClass = "max-w-md",
  stackedNativePrimaryButtonClassName,
  stackedNativeSecondaryButtonClassName,
  welcomeSoloContinueButtonClassName,
  welcomePage = false,
  setupCosmicPage = false,
  welcomeCtaSubtext,
  welcomeSignInAsTextLink = false,
  nativeFormPage = false,
}: OnboardingLayoutProps) => {
  const navigate = useNavigate();
  const isStandaloneMobile = useIsStandaloneMobile();
  const isNative = useIsNativeApp();
  const nativeFormScrollLayout = isNative && nativeFormPage;
  const isWelcome =
    welcomePage || Boolean(welcomeSoloContinueButtonClassName) || stackedNativeButtons;
  const isCosmicShell = true;
  const isWelcomeMobileWeb = !isNative && isWelcome;
  const isSetupCosmicMobileWeb = !isNative && setupCosmicPage;
  const setupMobileWebScrollLayout = isSetupCosmicMobileWeb && nativeFormPage;

  const handlePrevious = () => {
    if (currentPage > 1) {
      navigate(ONBOARDING_ROUTES[currentPage - 2]);
    }
  };

  const handleNext = () => {
    if (canContinue) {
      onContinue();
    }
  };

  const progressFillPct =
    !isWelcome && currentPage <= ONBOARDING_STEP_COUNT
      ? (currentPage / ONBOARDING_STEP_COUNT) * 100
      : null;

  useEffect(() => {
    if (!isCosmicShell) return;

    const shellBg = WELCOME_DEEP_BLACK_SHELL_BG;
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    html.style.setProperty("background", shellBg, "important");
    html.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    body.style.setProperty("background", shellBg, "important");
    body.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    root?.style.setProperty("background", shellBg, "important");
    root?.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    themeMeta?.setAttribute("content", WELCOME_DEEP_BLACK_BASE);

    return () => {
      html.style.removeProperty("background");
      html.style.removeProperty("background-color");
      body.style.removeProperty("background");
      body.style.removeProperty("background-color");
      root?.style.removeProperty("background");
      root?.style.removeProperty("background-color");
    };
  }, [isCosmicShell]);

  return (
    <div
      className={cn(
        "relative overflow-x-hidden",
        isCosmicShell ? "font-sans text-white antialiased" : "bg-background text-foreground",
        nativeFormScrollLayout || (isNative && isCosmicShell)
          ? "h-[100dvh] max-h-[100dvh]"
          : isSetupCosmicMobileWeb
            ? "max-md:h-[100dvh] max-md:max-h-[100dvh] md:min-h-screen"
            : "min-h-screen",
        isWelcomeMobileWeb && "max-md:min-h-[100dvh]",
      )}
      style={isCosmicShell ? { backgroundColor: WELCOME_DEEP_BLACK_BASE } : undefined}
    >
      {isCosmicShell ? (
        <WelcomeCosmicBackground
          className="pointer-events-none fixed inset-0 z-0"
          tone="deep-black"
        />
      ) : null}
      {progressFillPct != null ? (
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 z-[100] flex justify-center px-4 pt-1",
            !isNative &&
              "top-[calc(env(safe-area-inset-top,0px)+0.25rem)] md:top-[calc(env(safe-area-inset-top,0px)+4.25rem)]",
            isNative && "top-[calc(var(--app-safe-area-top)+0.25rem)]",
          )}
          aria-hidden
        >
          <div
            className={cn(
              "h-1 w-[70%] max-w-[min(19.6rem,calc(100vw-4rem))] shrink-0 overflow-hidden rounded-full",
              isCosmicShell ? "bg-white/20" : "bg-zinc-400/70",
            )}
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-300 ease-out",
                isWelcome
                  ? "bg-gradient-to-r from-rose-400 to-pink-500"
                  : isCosmicShell
                    ? "bg-white/90"
                    : "bg-black",
              )}
              style={{ width: `${progressFillPct}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Desktop: Palette Plotting Header - hidden for native apps */}
      {!isNative && (
        <div className="hidden md:block">
          <header
            className={cn(
              "fixed top-0 left-0 right-0 z-40",
              isCosmicShell
                ? "border-b border-white/[0.06] bg-[#020104]/80 backdrop-blur-md"
                : "border-b border-primary/10 bg-background",
            )}
          >
            <div className="container mx-auto px-6 py-4">
              <button onClick={() => navigate("/")}>
                <h1
                  className={cn(
                    "text-lg font-bold transition-opacity hover:opacity-80",
                    isCosmicShell
                      ? "font-sans text-sm font-semibold tracking-tight text-white/90"
                      : "bg-gradient-primary bg-clip-text text-transparent",
                  )}
                >
                  Palette Plotting
                </h1>
              </button>
            </div>
          </header>
        </div>
      )}

      {/* Desktop: Side Navigation Arrows — hidden on welcome (single-path CTA) */}
      {!isWelcome && (
      <div className="hidden md:block">
        {currentPage > 1 && (
          <button
            onClick={handlePrevious}
            className={cn(
              setupCosmicPage
                ? cn(SETUP_DESKTOP_CHEVRON_CLASS, "left-8 top-1/2 -translate-y-1/2 group")
                : "fixed left-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full transition-all duration-200 group bg-muted/50 hover:bg-muted",
            )}
            aria-label="Previous step"
          >
            <ChevronLeft
              className={cn(
                "w-8 h-8 transition-colors",
                setupCosmicPage
                  ? "text-white/80 group-hover:text-white"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
            />
          </button>
        )}

        {currentPage <= ONBOARDING_STEP_COUNT && (
          <button
            onClick={handleNext}
            disabled={!canContinue}
            className={cn(
              "fixed right-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
              setupCosmicPage
                ? cn(SETUP_DESKTOP_CHEVRON_CLASS)
                : "bg-black hover:bg-black/90",
            )}
            aria-label="Next step"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>
        )}
      </div>
      )}

      {/* Main Content */}
      <div
        className={cn(
          "flex flex-col items-center animate-fade-in w-full",
          nativeFormScrollLayout
            ? "h-full min-h-0 px-8 pb-40"
            : isNative
              ? isCosmicShell
                ? "h-full min-h-0 justify-start px-8 pb-40"
                : "min-h-screen justify-start pb-32 px-8"
              : isWelcomeMobileWeb
                ? "max-md:min-h-[100dvh] max-md:justify-start max-md:px-8 max-md:pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] max-md:pb-0 md:justify-start md:gap-6 md:p-8 md:pt-14 md:bg-transparent"
                : isSetupCosmicMobileWeb
                  ? "max-md:h-full max-md:min-h-0 max-md:justify-start max-md:px-8 max-md:pb-40 max-md:pt-[calc(env(safe-area-inset-top,0px)+2.5rem)] md:justify-start md:p-8 md:pt-24"
                  : "min-h-screen justify-between pt-12 p-8 md:pt-24",
        )}
        style={isNative ? { paddingTop: "calc(var(--app-safe-area-top) + 2.5rem)" } : undefined}
      >
        {nativeFormScrollLayout || setupMobileWebScrollLayout ? (
          <div
            className={cn(
              "relative z-10 flex min-h-0 w-full flex-1 flex-col overflow-hidden",
              contentMaxWidthClass,
              setupMobileWebScrollLayout && "max-md:flex md:contents",
            )}
          >
            <div
              className={cn(
                "relative z-[1] isolate flex min-h-0 w-full flex-1 flex-col overflow-hidden",
                setupMobileWebScrollLayout && "max-md:flex md:contents",
              )}
            >
              <div
                className={cn(
                  "relative z-[1] min-h-0 flex-1 scroll-pb-28 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]",
                  setupMobileWebScrollLayout && "max-md:block md:overflow-visible md:flex-none",
                )}
              >
                <div className="space-y-6 pb-3">{children}</div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "w-full",
              contentMaxWidthClass,
              isNative && expandNativeContentColumn && "flex min-h-0 flex-1 flex-col",
              (isWelcomeMobileWeb || isSetupCosmicMobileWeb) && "relative z-10",
            )}
          >
            {children}
          </div>
        )}

        {/* Footer CTA — welcome shows on all breakpoints; others mobile-only */}
        <div
          className={cn(
            "w-full",
            isWelcome ? "relative z-50 shrink-0 space-y-2 pt-3" : "md:hidden",
            !isWelcome && !isSetupCosmicMobileWeb && "space-y-6",
            !(isNative && !isWelcome) && contentMaxWidthClass,
            isNative && !isWelcome && "fixed inset-x-0 bottom-0 z-50 md:hidden",
            isSetupCosmicMobileWeb &&
              !isWelcome &&
              "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-50 max-md:mx-auto max-md:max-w-md max-md:px-8 max-md:pb-[calc(2rem+env(safe-area-inset-bottom,0px))]",
            isWelcomeMobileWeb &&
              "max-md:mt-auto max-md:pb-[calc(1rem+env(safe-area-inset-bottom,0px))]",
            isWelcome && !isNative && "md:mx-auto md:max-w-lg md:pb-0 md:pt-0",
            isStandaloneMobile && !isNative && !isWelcome && !isSetupCosmicMobileWeb && "mb-12",
          )}
          style={
            isNative
              ? {
                  paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))",
                  // Solid base only masks scrolling content under fixed setup footers.
                  // Welcome's footer sits in normal flow over the cosmic shell — no fill,
                  // otherwise a visible rectangle appears around the CTAs.
                  ...(isCosmicShell && !isWelcome
                    ? { backgroundColor: WELCOME_DEEP_BLACK_BASE }
                    : {}),
                }
              : isSetupCosmicMobileWeb && !isWelcome
                ? { backgroundColor: WELCOME_DEEP_BLACK_BASE }
                : undefined
          }
        >
          {/* Native app: stacked (Welcome only) or side-by-side */}
          {isNative ? (
            stackedNativeButtons ? (
              <div className="mx-auto flex w-full max-w-md flex-col gap-2 px-8">
                <Button
                  onClick={() => canContinue && onContinue()}
                  disabled={!canContinue}
                  className={cn(
                    "w-full rounded-full bg-black text-white hover:bg-black active:bg-black focus:bg-black h-14 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none select-none",
                    stackedNativePrimaryButtonClassName,
                  )}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  {continueText}
                </Button>
                {welcomeCtaSubtext ? (
                  <p className="text-center text-[11px] font-medium tracking-wide text-white/40">
                    {welcomeCtaSubtext}
                  </p>
                ) : null}
                {welcomeSignInAsTextLink ? (
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="py-1 text-center text-[13px] text-white/45 underline-offset-2 transition-colors hover:text-white/65 hover:underline"
                  >
                    Already have an account? Sign in
                  </button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => navigate("/login")}
                    className={cn(
                      "w-full h-14 rounded-full text-base font-medium border-border bg-background text-foreground hover:!bg-background hover:!text-foreground active:!bg-background active:!text-foreground focus:!bg-background focus:!text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none select-none",
                      stackedNativeSecondaryButtonClassName,
                    )}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    Sign In
                  </Button>
                )}
              </div>
            ) : nativeFooterSlot ? (
              <div className="mx-auto w-full max-w-md px-8">{nativeFooterSlot}</div>
            ) : (
            <div className="mx-auto flex w-full max-w-md items-center gap-3 px-8">
              {/* Back button - only functional after first page */}
              {currentPage > 1 ? (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className={cn(
                    isCosmicShell
                      ? SETUP_NATIVE_BACK_BTN_CLASS
                      : "flex-1 h-14 rounded-full text-base font-medium border-border bg-background text-foreground hover:!bg-background hover:!text-foreground active:!bg-background active:!text-foreground focus:!bg-background focus:!text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none select-none",
                  )}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  Back
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => navigate("/login")}
                  className={cn(
                    isCosmicShell
                      ? SETUP_NATIVE_BACK_BTN_CLASS
                      : "flex-1 h-14 rounded-full text-base font-medium border-border bg-background text-foreground hover:!bg-background hover:!text-foreground active:!bg-background active:!text-foreground focus:!bg-background focus:!text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none select-none",
                  )}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  Sign In
                </Button>
              )}
              <Button
                onClick={() => canContinue && onContinue()}
                disabled={!canContinue}
                className={cn(
                  isCosmicShell
                    ? SETUP_NATIVE_CONTINUE_BTN_CLASS
                    : "flex-1 bg-black text-white hover:bg-black active:bg-black focus:bg-black h-14 rounded-full text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none select-none",
                )}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {continueText}
              </Button>
            </div>
            )
          ) : (
            <div className="flex w-full flex-col gap-2">
              <Button
                onClick={() => canContinue && onContinue()}
                disabled={!canContinue}
                className={cn(
                  setupCosmicPage
                    ? cn("w-full", SETUP_NATIVE_CONTINUE_BTN_CLASS, "flex-none")
                    : "w-full rounded-full bg-black text-white hover:bg-black active:bg-black focus:bg-black h-14 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-0 outline-none transition-none",
                  welcomeSoloContinueButtonClassName,
                )}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {continueText}
              </Button>
              {isWelcome && welcomeCtaSubtext ? (
                <p className="text-center text-[11px] font-medium tracking-wide text-white/40">
                  {welcomeCtaSubtext}
                </p>
              ) : null}
              {isWelcome && welcomeSignInAsTextLink ? (
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="py-1 text-center text-[13px] text-white/45 underline-offset-2 transition-colors hover:text-white/65 hover:underline"
                >
                  Already have an account? Sign in
                </button>
              ) : null}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

```

---

## FILE: src/lib/webOnboardingSessionInsert.ts

```typescript
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { readMarketingAttribution } from "@/lib/useMarketingAttribution";

const RECORDED_KEY = "sv_web_onboarding_session_recorded_v1";
const CLIENT_VISIT_KEY = "sv_web_onboarding_client_visit_v1";

let recordStartPromise: Promise<void> | null = null;

function getOrCreateClientVisitId(): string {
  try {
    const existing = sessionStorage.getItem(CLIENT_VISIT_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(CLIENT_VISIT_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export type WebOnboardingSessionInsert = {
  client_visit_id: string;
  entry_path?: string;
  page_path?: string | null;
  referrer?: string | null;
  is_mobile_viewport?: boolean | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  is_paid?: boolean | null;
  from_tiktok?: boolean | null;
  make_my_subliminal_cta_clicked?: boolean;
  user_agent?: string | null;
};

export async function insertWebOnboardingSession(row: WebOnboardingSessionInsert) {
  return supabase.from("web_onboarding_sessions").insert(row);
}

/**
 * Fire once per tab when a browser user lands on web onboarding welcome.
 * Does not touch onboarding_sessions or edge functions.
 */
export function recordWebOnboardingSessionStart(opts?: {
  isMobileViewport?: boolean;
  entryPath?: string;
}): void {
  if (Capacitor.isNativePlatform()) return;

  try {
    if (sessionStorage.getItem(RECORDED_KEY) === "1") return;
  } catch {
    /* ignore */
  }

  const attribution = readMarketingAttribution();
  const pagePath =
    typeof window !== "undefined" ? window.location.pathname || "/" : null;
  const referrer =
    typeof document !== "undefined" && document.referrer ? document.referrer : null;
  const userAgent =
    typeof navigator !== "undefined" ? navigator.userAgent || null : null;

  const clientVisitId = getOrCreateClientVisitId();

  recordStartPromise = insertWebOnboardingSession({
    client_visit_id: clientVisitId,
    entry_path: opts?.entryPath ?? "/onboarding/welcome",
    page_path: pagePath,
    referrer,
    is_mobile_viewport: opts?.isMobileViewport ?? null,
    utm_source: attribution?.utmSource ?? null,
    utm_medium: attribution?.utmMedium ?? null,
    utm_campaign: attribution?.utmCampaign ?? null,
    utm_content: attribution?.utmContent ?? null,
    utm_term: attribution?.utmTerm ?? null,
    is_paid: attribution?.isPaid ?? null,
    from_tiktok: attribution?.isFromTikTok ?? null,
    user_agent: userAgent,
  })
    .then(({ error }) => {
      if (error) return;
      try {
        sessionStorage.setItem(RECORDED_KEY, "1");
      } catch {
        /* ignore */
      }
    })
    .catch(() => {
      /* ignore */
    });

  void recordStartPromise;
}

export function markWebOnboardingMakeMySubliminalCtaClicked(): void {
  if (Capacitor.isNativePlatform()) return;

  const clientVisitId = getOrCreateClientVisitId();
  const markClicked = () =>
    supabase.rpc("mark_web_onboarding_make_my_subliminal_cta_clicked", {
      p_client_visit_id: clientVisitId,
    });

  void (recordStartPromise ?? Promise.resolve())
    .then(markClicked)
    .catch(markClicked);
}

```

---

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

/* Dark mode — match app tool-page theme (#0f0d14), not shadcn default */
html.dark {
color-scheme: dark;
background-color: #0f0d14;
}

html.dark body,
html.dark #root {
background-color: #0f0d14;
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

function applyAppSurfaces(bg) {
document.documentElement.style.backgroundColor = bg;
if (document.body) document.body.style.backgroundColor = bg;
var appRoot = document.getElementById('root');
if (appRoot) appRoot.style.backgroundColor = bg;
}

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
if (path.indexOf('/onboarding') === 0) {
var onboardingShellBg = 'linear-gradient(180deg, #020104 0%, #050308 48%, #020104 100%)';
themeMeta.setAttribute('content', '#020104');
var appleOnboarding = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
if (appleOnboarding) appleOnboarding.setAttribute('content', 'black-translucent');
document.documentElement.style.colorScheme = 'dark';
document.documentElement.style.setProperty('background', onboardingShellBg, 'important');
document.documentElement.style.setProperty('background-color', '#020104', 'important');
if (document.body) {
document.body.style.setProperty('background', onboardingShellBg, 'important');
document.body.style.setProperty('background-color', '#020104', 'important');
}
var onboardingRoot = document.getElementById('root');
if (onboardingRoot) {
onboardingRoot.style.setProperty('background', onboardingShellBg, 'important');
onboardingRoot.style.setProperty('background-color', '#020104', 'important');
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
applyAppSurfaces('#0a0812');
return;
}

if (path.indexOf('/dashboard') === 0) {
var isHome = path === '/dashboard';
if (appearance === 'dark') {
var darkBg = isHome ? '#0a0812' : '#0f0d14';
themeMeta.setAttribute('content', darkBg);
if (appleStatusDefault) appleStatusDefault.setAttribute('content', 'black-translucent');
document.documentElement.style.colorScheme = 'dark';
applyAppSurfaces(darkBg);
} else {
themeMeta.setAttribute('content', '#ffffff');
if (appleStatusDefault) appleStatusDefault.setAttribute('content', 'default');
document.documentElement.style.colorScheme = 'light';
applyAppSurfaces('#ffffff');
}
return;
}

var isDark = document.documentElement.classList.contains('dark');
if (isDark) {
themeMeta.setAttribute('content', '#0f0d14');
applyAppSurfaces('#0f0d14');
return;
}

themeMeta.setAttribute('content', '#ffffff');
applyAppSurfaces('#ffffff');
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

## Review checklist

- [ ] Mockup glow follows frame silhouette — no rectangular box (Safari + TikTok WebView)
- [ ] Phone still cropped at 13.75rem bottom
- [ ] `.sv-iphone-frame-glow-source` is the only filtered element for mockup glow
- [ ] Carousel screens never inside a filtered/clipped glow wrapper
- [ ] Do not regress logo glow (`.sv-logo-glow-wrap`) or headline streaks
- [ ] Do not touch native welcome, CTA, toolbar, community proof, onboarding routing

Regenerate this file: `node scripts/generate-welcome-page-handoff.mjs`

