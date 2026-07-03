import { SetupPage } from "@/components/onboarding/SetupPage";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Music,
  ScanFace,
  Shapes,
  MessageCircle,
  NotebookPen,
  HandHeart,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SETUP_GLASS_PANEL_CLASS } from "@/lib/onboardingSetupTheme";
import "@/styles/welcome-web-effects.css";

const SUBLIMINAL_EMAIL_PATH = "/onboarding/subliminal/setup/email";

export default function SetupPathReadyDuplicate() {
  const navigate = useNavigate();

  useEffect(() => {
    const fontId = "sv-welcome-proxima-nova";
    if (document.getElementById(fontId)) return;
    const fontLink = document.createElement("link");
    fontLink.id = fontId;
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.cdnfonts.com/css/proxima-nova";
    document.head.appendChild(fontLink);
  }, []);

  const items = useMemo((): { Icon: LucideIcon; text: string }[] => {
    const stack: { Icon: LucideIcon; text: string }[] = [
      {
        Icon: Music,
        text: "10 customized subliminals/week.",
      },
      { Icon: ScanFace, text: "Immersive mirror work for self-concept." },
      {
        Icon: MessageCircle,
        text: "Digital manifestation guide & chat.",
      },
      {
        Icon: Sparkles,
        text: "Robotic affirming teleprompter & rep counter.",
      },
      { Icon: Shapes, text: "Belief work for self-limiting thoughts." },
      { Icon: NotebookPen, text: "Inspired action and manifestation tracking." },
      { Icon: HandHeart, text: "Dedicated support from our team." },
    ];
    return stack;
  }, []);

  return (
    <SetupPage
      canContinue={true}
      continueText="Continue"
      onContinue={() => navigate(SUBLIMINAL_EMAIL_PATH)}
      hideProgress
    >
      <div className="relative z-[1] mx-auto w-full max-w-md space-y-4 text-white">
        <div className="sv-hero-headline-wrap sv-hero-headline-wrap--welcome relative z-10">
          <h1 className="sv-hero-headline">
            <span className="sv-hero-headline-line">Your subliminal and other</span>
            <span className="sv-hero-headline-accent">manifesting tools are waiting.</span>
          </h1>

          <div className="sv-headline-underline" aria-hidden="true">
            <svg viewBox="0 0 420 24" preserveAspectRatio="none">
              <path d="M8 14 C120 10 300 10 412 14" />
            </svg>
          </div>
        </div>

        <div className="space-y-3">
          {items.map(({ Icon, text }) => (
            <div
              key={text}
              className={cn(
                SETUP_GLASS_PANEL_CLASS,
                "flex w-full min-h-[3.25rem] items-center justify-between gap-3 px-4 py-4",
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/12 text-white/80">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="font-sans text-base font-medium leading-snug text-white">{text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SetupPage>
  );
}

