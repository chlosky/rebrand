import { Fragment, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { WELCOME_ACCENT } from "@/components/onboarding/WelcomeCosmicBackground";
import { SETUP_NATIVE_CONTINUE_BTN_CLASS } from "@/lib/onboardingSetupTheme";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { cn } from "@/lib/utils";
import "@/styles/welcome-web-effects.css";

const WELCOME_LOGO = "/welcome-logo.png";
const WELCOME_EYEBROW = "subliminals · LOA · SP · scripting · self-concept";
const WELCOME_CONTINUE_TEXT = "Continue";
const WELCOME_PRIMARY_CTA_CLASS = cn("w-full", SETUP_NATIVE_CONTINUE_BTN_CLASS, "flex-none");

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

function WelcomeLogo() {
  return (
    <div className="mb-3 flex h-[7.5rem] w-[7.5rem] shrink-0 items-center justify-center">
      <img
        src={WELCOME_LOGO}
        alt="Palette Plotting"
        className="h-full w-full object-contain"
        width={120}
        height={120}
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

function WelcomeDescriptionNative() {
  return (
    <p className="max-w-[21rem] text-center font-sans text-[14px] leading-[1.55] text-white/58">
      Manifest on easy mode with one solution for all core techniques. Make your own
      subliminals, customize your affirmations, do mirror work, and more.
    </p>
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

export default function SubliminalWelcomePre() {
  const navigate = useNavigate();

  const handleContinue = () => {
    trackMarketingConversion("web_onboarding_click", {
      source: "subliminal_welcome_pre",
      button_label: WELCOME_CONTINUE_TEXT,
      target_path: "/onboarding/subliminal/welcome",
      is_subliminal_traffic: true,
    });
    navigate("/onboarding/subliminal/welcome");
  };

  useEffect(() => {
    const fontId = "sv-welcome-proxima-nova";
    if (document.getElementById(fontId)) return;
    const fontLink = document.createElement("link");
    fontLink.id = fontId;
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.cdnfonts.com/css/proxima-nova";
    document.head.appendChild(fontLink);
  }, []);

  return (
    <OnboardingLayout
      currentPage={1}
      welcomePage
      stackedNativeButtons
      stackedNativePrimaryButtonClassName={WELCOME_PRIMARY_CTA_CLASS}
      welcomeSoloContinueButtonClassName={WELCOME_PRIMARY_CTA_CLASS}
      welcomeSignInAsTextLink
      onContinue={handleContinue}
      canContinue={true}
      continueText={WELCOME_CONTINUE_TEXT}
      contentMaxWidthClass="max-w-[22rem]"
      reserveProgressSpace
    >
      <div className="relative z-10 mx-auto flex w-full max-w-[26rem] flex-col items-center gap-5 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)]">
        <WelcomeLogo />
        <WelcomeEyebrow />
        <WelcomeTitleNative />
        <WelcomeDescriptionNative />
        <WelcomeAwardLineNative />
        <WelcomeFeatureGrid />
      </div>
    </OnboardingLayout>
  );
}
