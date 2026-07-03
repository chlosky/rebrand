import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mapOnboardingEmbodyKeysToAppSlugs } from "@/lib/embodyPracticesCatalog";
import { cn } from "@/lib/utils";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  SETUP_CHOICE_CHECK_ACTIVE_CLASS,
  SETUP_CHOICE_CHECK_INACTIVE_CLASS,
  SETUP_CHOICE_ICON_WRAP_CLASS,
  SETUP_CHOICE_LABEL_CLASS,
  setupIconChoiceTileClass,
} from "@/lib/onboardingSetupTheme";
import {
  Apple,
  Brush,
  CheckCircle2,
  Circle,
  Dumbbell,
  Eye,
  Heart,
  Laptop,
  Link2,
  Moon,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";

/** Order matches `ALL_EMBODY_PRACTICE_KEYS`; keys map via `ONBOARDING_EMBODY_KEY_TO_APP` in `embodyPracticesCatalog`. */
const REQUIRED = 5;

const OPTIONS = [
  {
    key: "embody_rest",
    label: "Rest & Relax",
    Icon: Moon,
  },
  {
    key: "embody_self_care",
    label: "Self-care",
    Icon: Heart,
  },
  {
    key: "embody_clean_environment",
    label: "Clean & organize environment",
    Icon: Brush,
  },
  {
    key: "embody_nutrition",
    label: "Nutrition",
    Icon: Apple,
  },
  {
    key: "embody_have_fun",
    label: "Have fun",
    Icon: PartyPopper,
  },
  {
    key: "embody_move",
    label: "Exercise",
    Icon: Dumbbell,
  },
  {
    key: "embody_glam_up",
    label: "Glam Up",
    Icon: Sparkles,
  },
  {
    key: "embody_connect",
    label: "Connect with others",
    Icon: Link2,
  },
  {
    key: "embody_seen",
    label: "Be seen & visible.",
    Icon: Eye,
  },
  {
    key: "embody_work_or_study",
    label: "Work or study",
    Icon: Laptop,
  },
] as const;

const OPTION_KEYS = new Set(OPTIONS.map((o) => o.key));

export default function SetupEmbodyDailyIdentity() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";
  const { user } = useAuth();

  useEffect(() => {
    if (!isSuiteFunnel) {
      navigate(`${setupBase}/tool-preference`, { replace: true });
    }
  }, [isSuiteFunnel, navigate, setupBase]);
  const initial = useMemo(() => {
    const raw = readSetupDraft().embodyDailyPractices ?? [];
    return raw.filter((k): k is string => typeof k === "string" && OPTION_KEYS.has(k));
  }, []);
  const [selected, setSelected] = useState<string[]>(initial);

  const toggle = (k: string) => {
    setSelected((prev) => {
      if (prev.includes(k)) return prev.filter((x) => x !== k);
      if (prev.length >= REQUIRED) return prev;
      return [...prev, k];
    });
  };

  const canContinue = selected.length === REQUIRED;

  return (
    <SetupPage
      canContinue={canContinue}
      disableNativeScrollViewport
      onBack={() => navigate(`${setupBase}/affirmations`)}
      onContinue={() => {
        writeSetupDraft({ embodyDailyPractices: selected });
        // Best-effort sync for logged-in users so the app can immediately show only these five.
        // iOS post-paywall also syncs this via `sync-revenuecat-entitlement`.
        if (user?.id) {
          const mapped = mapOnboardingEmbodyKeysToAppSlugs(selected);
          if (mapped) {
            void supabase
              .from("user_preferences")
              .upsert({ user_id: user.id, embody_active_practices: mapped }, { onConflict: "user_id" })
              .then(({ error }) => {
                if (error && import.meta.env.DEV) {
                  console.warn("[EmbodyDailyIdentity] user_preferences embody upsert:", error.message);
                }
              });
          }
        }
        navigate(`${setupBase}/begin-journey`);
      }}
    >
      {/*
        Matches the working ToolPreference ("How do you want support") layout:
        SetupPage runs with `disableNativeScrollViewport`, and we own the inner scroll
        viewport here with an explicit height cap so it actually scrolls instead of
        nesting two flex-1 viewports (the previous version, which couldn't scroll).
      */}
      <div className="flex w-full flex-col gap-4">
        <SetupHeadingBlock
          centered
          className="shrink-0"
          title={t("setup.embody.title")}
          subtitle={t("setup.embody.subtitle", { count: selected.length, required: REQUIRED })}
        />

        <div className="relative z-[1] h-[min(48vh,calc(100dvh-19rem))] w-full shrink-0 overflow-hidden sm:h-[min(50vh,calc(100dvh-17rem))]">
          <div className="relative z-[1] h-full space-y-2.5 overflow-y-auto overflow-x-hidden overscroll-y-contain px-1 py-1 pb-2 [-webkit-overflow-scrolling:touch]">
            {OPTIONS.map(({ key, label, Icon }) => {
              const active = selected.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(key)}
                  className={setupIconChoiceTileClass(active)}
                  style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
                >
                  <span className="flex items-center gap-3">
                    <span className={cn(SETUP_CHOICE_ICON_WRAP_CLASS, "h-9 w-9")}>
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <span className={SETUP_CHOICE_LABEL_CLASS}>
                      {t(`setup.embodyOptions.${key}`)}
                    </span>
                  </span>
                  {active ? (
                    <CheckCircle2 className={SETUP_CHOICE_CHECK_ACTIVE_CLASS} />
                  ) : (
                    <Circle className={SETUP_CHOICE_CHECK_INACTIVE_CLASS} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </SetupPage>
  );
}
