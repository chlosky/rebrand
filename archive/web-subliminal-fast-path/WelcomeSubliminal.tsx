import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type Ref } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import {
  WELCOME_ACCENT,
} from "@/components/onboarding/WelcomeCosmicBackground";
import { Heart, Loader2, Mic, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/integrations/supabase/client";
import {
  markWebOnboardingMakeMySubliminalCtaClicked,
  recordWebOnboardingSessionStart,
  writeWebOnboardingSubliminalFastPath,
} from "@/lib/webOnboardingSessionInsert";
import { ensureOnboardingSessionCreds } from "@/lib/setupDraftBackendSync";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { resolveLocaleForApi } from "@/lib/locale";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { SUBLIMINAL_BUILDER_SETUP_PROGRESS_ROUTES } from "@/internal/webSubliminalFastPath/routes";
import {
  AFFIRMATION_LINE_MAX_LENGTH,
  AFFIRMATION_SET_NAME_MAX_LENGTH,
  SUPPORT_CATEGORIES,
} from "@/lib/affirmations-data";
import {
  MARKETING_CTA_MAKE_FIRST_SUBLIMINAL,
} from "@/lib/marketingConversionCopy";
import { readMarketingAttribution } from "@/lib/useMarketingAttribution";
import { detectInAppBrowser } from "@/lib/inAppBrowserDetection";
import { cn } from "@/lib/utils";
import { signalNativeSplashReadyToHide } from "@/components/NativeAppRootRedirect";
import "@/styles/welcome-web-effects.css";

/** Transparent brand logo â€” native splash + welcome native body. */
const WELCOME_LOGO = "/welcome-logo.png";
/** Rounded app icon â€” web welcome hero (matches App Store icon). */
/** Web welcome only â€” resized from apple-ios-logo.png (App Store master stays full-res). */
const WELCOME_APP_ICON = "/apple-ios-logo-hero.png";
const WELCOME_EYEBROW = "subliminals Â· LOA Â· SP Â· scripting Â· self-concept";

const WELCOME_CONTINUE_TEXT = "Start my path";
const WELCOME_CTA_SUBTEXT = "Personalize your first subliminal in less than 3 minutes";
const WELCOME_CTA_SUBTEXT_NATIVE = "~3 min set up";

const WELCOME_PRIMARY_CTA_CLASS =
  "h-12 rounded-xl border-0 bg-white font-sans text-[15px] font-semibold tracking-[-0.01em] text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.24),0_8px_28px_rgba(0,0,0,0.28)] hover:bg-zinc-50 active:bg-zinc-100 focus:bg-white";

const WELCOME_WEB_LAVENDER = "#e8b8d4";

const WELCOME_AVATAR_VERSION = "genz-v5-webp92";

const WELCOME_COMMUNITY_AVATARS = [
  `/marketing/welcome-avatars/welcome-community-avatar-1.webp?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-2.webp?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-3.webp?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-4.webp?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-5.webp?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-6.webp?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-7.webp?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-8.webp?v=${WELCOME_AVATAR_VERSION}`,
] as const;

/** Centered rows with dot separators â€” native only. */
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

const SUBLIMINAL_WELCOME_PATH = "/onboarding/subliminal/welcome";
const SUBLIMINAL_PATH_READY = "/onboarding/subliminal/setup/path-ready";
const SUBLIMINAL_ONBOARDING_VOCAL_KEY = "sv_subliminal_onboarding_vocal_blob_v1";

const ONBOARDING_STARTER_LAYERS = 3;
const ONBOARDING_STARTER_MINUTES = 1;
/** Locked for web subliminal fast-path mix (full library after signup). */
export const ONBOARDING_STARTER_BACKGROUND = "Rain v2.WAV";
export const ONBOARDING_STARTER_BINAURAL = "theta";
const ONBOARDING_BACKGROUND_OPTIONS = [
  { label: "Rain", value: "Rain v2.WAV" },
  { label: "Ocean", value: "Ocean v2.WAV" },
  { label: "Nature Park", value: "Nature Park.wav" },
  { label: "Fireplace", value: "Fireplace.wav" },
  { label: "City Corner", value: "City Corner.wav" },
  { label: "Gold Coins", value: "Gold Coins.wav" },
  { label: "Your Custom Sound", value: "Your Custom Sound" },
] as const;

const ONBOARDING_FLOW_CARD_CLASS =
  "w-full min-w-0 rounded-xl border border-white/12 bg-transparent text-white backdrop-blur-sm shadow-sm !bg-transparent !shadow-none";
const ONBOARDING_INPUT_CLASS = "!bg-transparent !border-white/12 !text-white placeholder:!text-white/40";
const ONBOARDING_GHOST_BTN =
  "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50";
const ONBOARDING_AFFIRM_LIST_ROW =
  "p-2 rounded-lg border border-white/12 bg-transparent text-sm";
const ONBOARDING_SCRIPT_MAX_CHARS = 350;
const ONBOARDING_RECORDING_MAX_MS = 60_000;

const ONBOARDING_MANIFEST_CATEGORY_ORDER = [
  "Connections",
  "Self-Love",
  "Confidence",
  "Fitness",
  "Finances",
  "Career",
  "Business",
  "Learning",
  "Productivity",
  "Organization",
  "Nutrition",
  "Discipline",
] as const;

const ONBOARDING_MANIFEST_CATEGORY_LABEL: Partial<Record<(typeof ONBOARDING_MANIFEST_CATEGORY_ORDER)[number], string>> = {
  "Self-Love": "Glow Up",
  Fitness: "Dream Body",
};

/** Pill glow/border only on this page — backend still uses SUPPORT_CATEGORIES `name` + `color`. */
const ONBOARDING_MANIFEST_CATEGORY_UI_COLOR: Partial<
  Record<(typeof ONBOARDING_MANIFEST_CATEGORY_ORDER)[number], string>
> = {
  Fitness: "#FFB6C1",
  Learning: "#8fbf76",
  Productivity: "#4AC7FF",
  Organization: "#4AC7FF",
  Nutrition: "#4AC7FF",
  Discipline: "#4AC7FF",
};

const ONBOARDING_STEP_LABELS: Record<OnboardingPageStep, string> = {
  manifest: "Step 1 of 3 · Your Subliminal + Manifesting Goal",
  vocals: "Step 2 of 3 · Choose Your Vocals",
  finetune: "Step 3 of 3 · Fine-tune Your Track",
};
const ONBOARDING_STEP_PROGRESS_ROUTE: Record<
  OnboardingPageStep,
  (typeof SUBLIMINAL_BUILDER_SETUP_PROGRESS_ROUTES)[number]
> = {
  manifest: "/onboarding/subliminal/welcome#manifest",
  vocals: "/onboarding/subliminal/welcome#vocals",
  finetune: "/onboarding/subliminal/welcome#finetune",
};

const ONBOARDING_HERO_HEADLINES: Record<
  OnboardingPageStep,
  | { line: string; accent: string; accentNowrap?: boolean }
  | { lines: readonly [string, string, string] }
> = {
  manifest: {
    lines: ["Manifest your desires", "Make a subliminal", "Start your free trial"],
  },
  vocals: {
    line: "Use your own voice,",
    accent: "or generate vocals fast",
    accentNowrap: true,
  },
  finetune: {
    line: "Supercharge your subliminal",
    accent: "with fine-tuned settings",
  },
};

type OnboardingPageStep = "manifest" | "vocals" | "finetune";

const BINURAL_BEATS = [
  { value: "none", label: "No binaural beat", desc: "Affirmations and background only; no binaural tones in the mix." },
  { value: "delta", label: "Delta (0.5-4 Hz beat, ~200 Hz carrier)", desc: "Deep sleep, healing, regeneration" },
  { value: "theta", label: "Theta (4-8 Hz beat, ~200 Hz carrier)", desc: "Meditation, deep focus, deep relaxation" },
  { value: "alpha", label: "Alpha (8-13 Hz beat, ~250 Hz carrier)", desc: "Relaxation, learning, light meditation" },
  { value: "beta", label: "Beta (13-30 Hz beat, ~300 Hz carrier)", desc: "Focus, concentration, alertness" },
  { value: "gamma", label: "Gamma (30-100 Hz beat, ~400 Hz carrier)", desc: "Peak awareness, cognitive enhancement" },
] as const;

type OnboardingManifestCardProps = {
  manifestTopic: string;
  category: string | null;
  isGeneratingAffirmations: boolean;
  onTopicChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onCreateAffirmations: () => void;
};

function OnboardingManifestCard({
  manifestTopic,
  category,
  isGeneratingAffirmations,
  onTopicChange,
  onCategoryChange,
  onCreateAffirmations,
}: OnboardingManifestCardProps) {
  const topicTrimmed = manifestTopic.trim();

  return (
    <Card className={cn("animate-fade-in", ONBOARDING_FLOW_CARD_CLASS)}>
      <CardHeader className="space-y-2 pb-3">
        <CardTitle className="sv-subliminal-headline text-center text-lg">What do you want to manifest?</CardTitle>
        <p className="text-center text-sm leading-relaxed text-white/75">
          Scroll → to provide a category &amp; details
        </p>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4 pt-0">
        <div className="min-w-0 space-y-3">
          <div className="min-w-0">
            <div className="flex gap-1 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] snap-x snap-mandatory">
            {ONBOARDING_MANIFEST_CATEGORY_ORDER.map((name) => {
              const cat = SUPPORT_CATEGORIES.find((c) => c.name === name);
              if (!cat) return null;
              const selected = category === cat.name;
              const label = ONBOARDING_MANIFEST_CATEGORY_LABEL[name] ?? cat.label;
              const pillColor = ONBOARDING_MANIFEST_CATEGORY_UI_COLOR[name] ?? cat.color;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => onCategoryChange(cat.name)}
                  className={cn(
                    "shrink-0 snap-start rounded-full border px-3 py-1.5 font-sans text-[12px] font-medium transition-colors",
                    selected
                      ? "text-white"
                      : "border-white/15 bg-transparent text-white/65 hover:border-white/25",
                  )}
                  style={
                    selected
                      ? {
                          borderColor: `${pillColor}99`,
                          boxShadow: `0 0 14px ${pillColor}40`,
                          backgroundColor: "transparent",
                        }
                      : undefined
                  }
                >
                  {label}
                </button>
              );
            })}
            </div>
          </div>
          <Input
            placeholder="Be specific (e.g., new job, boyfriend, grades)"
            value={manifestTopic}
            onChange={(e) => onTopicChange(e.target.value.slice(0, AFFIRMATION_SET_NAME_MAX_LENGTH))}
            onKeyDown={(e) =>
              e.key === "Enter" && !isGeneratingAffirmations && topicTrimmed && category && onCreateAffirmations()
            }
            maxLength={AFFIRMATION_SET_NAME_MAX_LENGTH}
            className={cn("w-full !text-sm", ONBOARDING_INPUT_CLASS)}
          />
          <Button
            type="button"
            variant="ghost"
            disabled={!topicTrimmed || !category || isGeneratingAffirmations}
            onClick={onCreateAffirmations}
            className={cn("w-full", ONBOARDING_GHOST_BTN)}
          >
            {isGeneratingAffirmations ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Let's record your subliminal vocals"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type OnboardingVocalsCardProps = {
  affirmations: string[];
  onAffirmationsChange: (lines: string[]) => void;
  vocalTab: "read" | "generate";
  onVocalTabChange: (tab: "read" | "generate") => void;
  isRecording: boolean;
  hasAudio: boolean;
  isGeneratingTTS: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  generateAffirmationAudio: () => void;
  onContinue: () => void;
};

function OnboardingVocalsCard({
  affirmations,
  onAffirmationsChange,
  vocalTab,
  onVocalTabChange,
  isRecording,
  hasAudio,
  isGeneratingTTS,
  startRecording,
  stopRecording,
  generateAffirmationAudio,
  onContinue,
}: OnboardingVocalsCardProps) {
  const scriptTitle =
    vocalTab === "generate"
      ? "Let a voice read your affirmations"
      : "Read lines karaoke-style or freestyle";
  const [scriptEditable, setScriptEditable] = useState(false);
  const [scriptDraft, setScriptDraft] = useState("");
  const scriptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const scriptText = affirmations.join(" ").slice(0, ONBOARDING_SCRIPT_MAX_CHARS);

  useEffect(() => {
    if (!scriptEditable) {
      setScriptDraft(scriptText);
    }
  }, [scriptText, scriptEditable]);

  const commitScriptDraft = () => {
    const trimmed = scriptDraft.slice(0, ONBOARDING_SCRIPT_MAX_CHARS).trim();
    if (!trimmed) return;
    const lines = trimmed
      .split(/(?<=[.!?])\s+/)
      .map((line) => line.trim().slice(0, AFFIRMATION_LINE_MAX_LENGTH))
      .filter((line) => line.length > 0);
    onAffirmationsChange(
      lines.length > 0 ? lines : [trimmed.slice(0, AFFIRMATION_LINE_MAX_LENGTH)],
    );
  };

  const scriptBlock =
    affirmations.length > 0 ? (
      <div className={cn("flex min-h-0 flex-col overflow-hidden rounded-lg border", ONBOARDING_INPUT_CLASS)}>
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/12 px-3 py-2">
          <h3 className="text-xs font-semibold text-white">{scriptTitle}</h3>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setScriptDraft(scriptText);
              setScriptEditable(true);
              globalThis.requestAnimationFrame(() => scriptTextareaRef.current?.focus());
            }}
            className="h-6 px-1.5 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground hover:text-white"
            title="Edit affirmations"
          >
            EDIT
          </Button>
        </div>
        <div className="max-h-[11rem] min-h-0 overflow-y-auto overscroll-contain px-3 py-2 [-webkit-overflow-scrolling:touch]">
          <Textarea
            ref={scriptTextareaRef}
            value={scriptEditable ? scriptDraft : scriptText}
            readOnly={!scriptEditable}
            maxLength={ONBOARDING_SCRIPT_MAX_CHARS}
            onChange={(e) => setScriptDraft(e.target.value.slice(0, ONBOARDING_SCRIPT_MAX_CHARS))}
            onBlur={() => {
              if (!scriptEditable) return;
              commitScriptDraft();
              setScriptEditable(false);
            }}
            className={cn(
              "min-h-[5rem] resize-none border-0 bg-transparent p-0 text-xs leading-relaxed text-white shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
              !scriptEditable && "cursor-default",
            )}
          />
        </div>
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">Generate affirmations on the previous step first.</p>
    );

  const recordControls = (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="ghost"
        onClick={isRecording ? stopRecording : startRecording}
        className={cn(
          "flex-1",
          ONBOARDING_GHOST_BTN,
          isRecording
            ? "border-red-400/60 text-red-200 shadow-[0_0_18px_rgba(248,113,113,0.22)] hover:bg-red-500/10 hover:text-red-100"
            : hasAudio
              ? "border-emerald-400/60 text-emerald-200 shadow-[0_0_18px_rgba(52,211,153,0.22)] hover:bg-emerald-500/10 hover:text-emerald-100"
              : "",
        )}
      >
        <Mic className="mr-2 h-4 w-4" />
        {isRecording ? "Stop" : "Record"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={onContinue}
        disabled={!hasAudio}
        className={cn("flex-1", ONBOARDING_GHOST_BTN)}
      >
        Continue
      </Button>
    </div>
  );

  const ttsControls =
    affirmations.length > 0 ? (
      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={isGeneratingTTS}
          onClick={() => void generateAffirmationAudio()}
          className={cn(
            "flex-1",
            ONBOARDING_GHOST_BTN,
            hasAudio &&
              "border-emerald-400/60 text-emerald-200 shadow-[0_0_18px_rgba(52,211,153,0.22)] hover:bg-emerald-500/10 hover:text-emerald-100",
          )}
        >
          {isGeneratingTTS ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Audio"
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onContinue}
          disabled={!hasAudio}
          className={cn("flex-1", ONBOARDING_GHOST_BTN)}
        >
          Continue
        </Button>
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">Generate affirmations on the previous step first.</p>
    );

  const readPanel = (
    <>
      {scriptBlock}
      {recordControls}
    </>
  );

  return (
    <Card className={cn("animate-fade-in", ONBOARDING_FLOW_CARD_CLASS)}>
      <Tabs
        value={vocalTab}
        onValueChange={(v) => onVocalTabChange(v as "read" | "generate")}
        className="w-full"
      >
        <CardHeader className="flex flex-nowrap flex-row items-center justify-between gap-2 space-y-0 pb-3">
          <CardTitle className="sv-subliminal-headline shrink-0 whitespace-nowrap text-lg leading-tight">
            {vocalTab === "read" ? "Speak" : "Generate"}
          </CardTitle>
          <TabsList className="grid h-9 min-w-0 shrink-0 grid-cols-2 border border-white/12 bg-transparent p-0.5">
            <TabsTrigger
              value="read"
              className="whitespace-nowrap rounded-sm border border-transparent bg-transparent px-2 py-0.5 text-xs leading-tight data-[state=active]:border-white/70 data-[state=active]:bg-transparent data-[state=active]:text-white"
            >
              Use Your Voice
            </TabsTrigger>
            <TabsTrigger
              value="generate"
              className="whitespace-nowrap rounded-sm border border-transparent bg-transparent px-2 py-0.5 text-xs leading-tight data-[state=active]:border-white/70 data-[state=active]:bg-transparent data-[state=active]:text-white"
            >
              Text-to-Speech
            </TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent className="min-w-0 space-y-4 pt-0">
          <TabsContent value="read" className="mt-0 space-y-4">
            {readPanel}
          </TabsContent>
          <TabsContent value="generate" className="mt-0 space-y-4">
            {scriptBlock}
            {ttsControls}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}

type OnboardingBinauralCardProps = {
  onContinue: () => void;
};

function OnboardingBinauralCard({ onContinue }: OnboardingBinauralCardProps) {
  const selectedBeat = BINURAL_BEATS.find((b) => b.value === ONBOARDING_STARTER_BINAURAL);
  const [backgroundPickerOpen, setBackgroundPickerOpen] = useState(false);
  const [binauralPickerOpen, setBinauralPickerOpen] = useState(false);
  const binauralBubbleLabel = `${selectedBeat?.label.split(" (")[0] ?? "Theta"} waves`;
  const selectedBackground =
    ONBOARDING_BACKGROUND_OPTIONS.find((o) => o.value === ONBOARDING_STARTER_BACKGROUND) ??
    ONBOARDING_BACKGROUND_OPTIONS[0];
  const selectableBubbleClass =
    "flex min-h-[1.75rem] flex-1 items-center justify-center whitespace-nowrap rounded-full border border-white/30 bg-transparent px-2 py-1 text-xs leading-none text-white/90 shadow-[0_0_16px_rgba(255,255,255,0.28)] transition-colors hover:border-white/45 hover:bg-transparent hover:shadow-[0_0_20px_rgba(255,255,255,0.38)]";

  return (
    <Card className={cn("animate-fade-in", ONBOARDING_FLOW_CARD_CLASS)}>
      <CardHeader className="space-y-1.5 px-6 pt-4 pb-4">
        <CardTitle className="sv-subliminal-headline text-center text-lg leading-tight">
          Fine-tune Your Track for Intensity
        </CardTitle>
        <p className="text-center text-sm leading-relaxed text-white/75">
          Presets for speed. Full options after signup.
        </p>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4 px-6 pb-6 pt-0">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="flex min-w-0 flex-1">
              <Popover open={backgroundPickerOpen} onOpenChange={setBackgroundPickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setBackgroundPickerOpen(true)}
                    className={selectableBubbleClass}
                  >
                    {selectedBackground.label} background
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-56 border-white/15 bg-transparent p-3 text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md"
                >
                  <TooltipProvider delayDuration={200}>
                    <div className="flex flex-wrap gap-1.5">
                      {ONBOARDING_BACKGROUND_OPTIONS.map((option) => {
                        const active = option.value === ONBOARDING_STARTER_BACKGROUND;
                        const locked = option.value !== ONBOARDING_STARTER_BACKGROUND;
                        const bubbleClass = cn(
                          "rounded-full border px-2 py-1 text-xs transition-colors",
                          active
                            ? "border-white/35 bg-transparent text-white"
                            : "border-white/12 bg-transparent text-white/55",
                          locked
                            ? "cursor-default opacity-55"
                            : "hover:border-white/25 hover:text-white/80",
                        );
                        if (locked) {
                          const previewHint =
                            option.label === "Your Custom Sound"
                              ? "Upload your own background after signup."
                              : `${option.label} and more backgrounds unlock in Subliminal Maker after signup. Your starter track uses Rain.`;
                          return (
                            <Tooltip key={option.value}>
                              <TooltipTrigger asChild>
                                <span className="inline-flex">
                                  <button type="button" disabled className={bubbleClass}>
                                    {option.label}
                                  </button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="max-w-[14rem] border-white/15 bg-[#141018] text-xs text-white"
                              >
                                {previewHint}
                              </TooltipContent>
                            </Tooltip>
                          );
                        }
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setBackgroundPickerOpen(false)}
                            className={bubbleClass}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </TooltipProvider>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex min-w-0 flex-1">
              <Popover open={binauralPickerOpen} onOpenChange={setBinauralPickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setBinauralPickerOpen(true)}
                    className={selectableBubbleClass}
                  >
                    {binauralBubbleLabel}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-56 border-white/15 bg-transparent p-3 text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md"
                >
                  <TooltipProvider delayDuration={200}>
                    <div className="flex flex-wrap gap-1.5">
                      {BINURAL_BEATS.map((beat) => {
                        const shortLabel =
                          beat.value === "none" ? "None" : (beat.label.split(" (")[0] ?? beat.label);
                        const active = beat.value === ONBOARDING_STARTER_BINAURAL;
                        const locked = beat.value !== ONBOARDING_STARTER_BINAURAL;
                        const bubbleClass = cn(
                          "rounded-full border px-2 py-1 text-xs transition-colors",
                          active
                            ? "border-white/35 bg-transparent text-white"
                            : "border-white/12 bg-transparent text-white/55",
                          locked ? "cursor-default opacity-55" : "hover:border-white/25 hover:text-white/80",
                        );
                        if (locked) {
                          return (
                            <Tooltip key={beat.value}>
                              <TooltipTrigger asChild>
                                <span className="inline-flex">
                                  <button type="button" disabled className={bubbleClass}>
                                    {shortLabel}
                                  </button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="max-w-[14rem] border-white/15 bg-[#141018] text-xs text-white"
                              >
                                {beat.desc} Full binaural library after signup. Your starter track uses Theta.
                              </TooltipContent>
                            </Tooltip>
                          );
                        }
                        return (
                          <button
                            key={beat.value}
                            type="button"
                            onClick={() => setBinauralPickerOpen(false)}
                            className={bubbleClass}
                          >
                            {shortLabel}
                          </button>
                        );
                      })}
                    </div>
                  </TooltipProvider>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="flex min-h-[1.75rem] flex-1 items-center justify-center whitespace-nowrap rounded-full border border-white/20 bg-transparent px-2 py-1 text-xs leading-none text-white/90">
              {ONBOARDING_STARTER_LAYERS}x layered vocals
            </span>
            <span className="flex min-h-[1.75rem] flex-1 items-center justify-center whitespace-nowrap rounded-full border border-white/20 bg-transparent px-2 py-1 text-xs leading-none text-white/90">
              Loopable track
            </span>
          </div>
          <div className="flex gap-2">
            <span className="flex min-h-[1.75rem] flex-1 items-center justify-center whitespace-nowrap rounded-full border border-white/20 bg-transparent px-2 py-1 text-xs leading-none text-white/90">
              4% affirmation volume
            </span>
            <span className="flex min-h-[1.75rem] flex-1 items-center justify-center whitespace-nowrap rounded-full border border-white/20 bg-transparent px-2 py-1 text-xs leading-none text-white/90">
              7% binaural volume
            </span>
          </div>
        </div>
        <Button type="button" variant="ghost" onClick={onContinue} className={cn("w-full", ONBOARDING_GHOST_BTN)}>
          Build my first subliminal
        </Button>
      </CardContent>
    </Card>
  );
}

function detectSubliminalTraffic(): boolean {
  const attr = readMarketingAttribution();
  if (!attr) return false;
  const fields = [attr.utmCampaign, attr.utmContent, attr.utmTerm].join(" ").toLowerCase();
  return fields.includes("subliminal") || fields.includes("subs ");
}

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
                    Â·
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
        decoding="sync"
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

function WelcomeHeadlineWeb({ pageStep }: { pageStep: OnboardingPageStep }) {
  const headline = ONBOARDING_HERO_HEADLINES[pageStep];
  return (
    <div className="sv-hero-headline-wrap sv-hero-headline-wrap--welcome relative z-10">
      <h1 className="sv-hero-headline">
        {"lines" in headline ? (
          headline.lines.map((text, index) => (
            <span
              key={text}
              className={index % 2 === 0 ? "sv-hero-headline-accent" : "sv-hero-headline-line"}
            >
              {text}
            </span>
          ))
        ) : (
          <>
            <span className="sv-hero-headline-line">{headline.line}</span>
            <span
              className={cn("sv-hero-headline-accent", headline.accentNowrap && "whitespace-nowrap")}
            >
              {headline.accent}
            </span>
          </>
        )}
      </h1>

      <div className="sv-headline-underline" aria-hidden="true">
        <svg viewBox="0 0 420 24" preserveAspectRatio="none">
          <path d="M8 14 C120 10 300 10 412 14" />
        </svg>
      </div>
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
              fetchPriority="low"
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

function WelcomeDescriptionNative() {
  return (
    <p className="max-w-[21rem] text-center font-sans text-[14px] leading-[1.55] text-white/58">
      Manifest on easy mode with one solution for all core techniques. Make your own
      subliminals, customize your affirmations, do mirror work, and more.
    </p>
  );
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

const welcomeLayoutPropsBase = {
  currentPage: 1 as const,
  welcomePage: true,
  stackedNativeButtons: true,
  stackedNativePrimaryButtonClassName: WELCOME_PRIMARY_CTA_CLASS,
  welcomeSignInAsTextLink: true,
};

const WelcomeSubliminal = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const isNative = useIsNativeApp();
  const isMobileViewport = useIsMobile();
  const { setTheme } = useTheme();
  const savedDraft = useMemo(() => readSetupDraft(), []);

  const [pageStep, setPageStep] = useState<OnboardingPageStep>("manifest");
  const [manifestTopic, setManifestTopic] = useState(savedDraft.manifestTopic ?? "");
  const [category, setCategory] = useState<string | null>(null);
  const [affirmations, setAffirmations] = useState<string[]>(savedDraft.starterAffirmations ?? []);
  const [isGeneratingAffs, setIsGeneratingAffs] = useState(false);
  const [vocalMode, setVocalMode] = useState<"karaoke" | "freestyle" | "tts">(
    savedDraft.subliminalVocalMode ?? "karaoke",
  );
  const [vocalTab, setVocalTab] = useState<"read" | "generate">("read");

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  const [affirmationVolume] = useState([0.04]);
  const subliminalProgressStepIndex = SUBLIMINAL_BUILDER_SETUP_PROGRESS_ROUTES.indexOf(
    ONBOARDING_STEP_PROGRESS_ROUTE[pageStep],
  );
  const subliminalProgressFillPct =
    ((subliminalProgressStepIndex + 1) / SUBLIMINAL_BUILDER_SETUP_PROGRESS_ROUTES.length) * 100;
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const isSubliminalTraffic = useMemo(() => !isNative && detectSubliminalTraffic(), [isNative]);

  useEffect(() => {
    if (isNative) return;
    setTheme("dark");
  }, [isNative, setTheme]);

  const handleGenerateAffirmations = useCallback(async () => {
    const topic = manifestTopic.trim();
    if (!topic || !category) {
      return;
    }
    trackMarketingConversion("web_onboarding_click", {
      source: "subliminal_fast_path_manifest",
      button_label: "Let's record your subliminal vocals",
      target_path: "/onboarding/subliminal/welcome#vocals",
      is_subliminal_traffic: isSubliminalTraffic,
    });
    setIsGeneratingAffs(true);
    try {
      const creds = await ensureOnboardingSessionCreds();

      const { data, error } = await supabase.functions.invoke("generate-affirmations", {
        body: {
          topic,
          category,
          sessionId: creds.sessionId,
          resumeToken: creds.resumeToken,
          locale: resolveLocaleForApi(readSetupDraft()?.locale),
        },
      });
      if (data?.blocked) {
        return;
      }
      if (data?.error) {
        return;
      }
      if (error) {
        console.warn("[WelcomeSubliminal] generate affirmations failed:", error);
        return;
      }
      const lines = Array.isArray(data?.affirmations) ? (data.affirmations as string[]) : [];
      if (lines.length === 0) {
        return;
      }
      const clippedLines: string[] = [];
      let used = 0;
      for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;
        const sep = clippedLines.length ? 1 : 0;
        if (used + sep + line.length > ONBOARDING_SCRIPT_MAX_CHARS) {
          const room = ONBOARDING_SCRIPT_MAX_CHARS - used - sep;
          if (room > 0) clippedLines.push(line.slice(0, room));
          break;
        }
        clippedLines.push(line);
        used += sep + line.length;
      }
      if (clippedLines.length === 0) {
        return;
      }
      setAffirmations(clippedLines);
      writeWebOnboardingSubliminalFastPath({
        stage: "affirmations_generated",
        manifest_topic: topic,
        starter_affirmation_category: category,
        starter_affirmations: clippedLines,
        starter_affirmations_count: clippedLines.length,
        generated_at: new Date().toISOString(),
      });
      void writeSetupDraft({
        subliminalFastFlow: true,
        manifestTopic: topic,
        starterAffirmations: clippedLines,
        starterAffirmationCategory: category,
      });
      setVocalTab("read");
      setVocalMode("karaoke");
      setPageStep("vocals");
    } finally {
      setIsGeneratingAffs(false);
    }
  }, [category, isSubliminalTraffic, manifestTopic]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      }
      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 });
      } catch {
        mediaRecorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
      };
      mediaRecorder.start(100);
      setIsRecording(true);
      recordingTimeoutRef.current = setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, ONBOARDING_RECORDING_MAX_MS);
    } catch {
      /* keep onboarding toast-free */
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const togglePlayback = async () => {
    if (!audioBlob) {
      return;
    }
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }
    try {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;
      const audio = new Audio(audioUrl);
      audio.volume = affirmationVolume[0] * 0.5;
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      await audio.play();
      setIsPlaying(true);
    } catch {
      /* keep onboarding toast-free */
    }
  };

  const generateAffirmationAudio = async () => {
    if (!affirmations.length) {
      return;
    }
    setIsGeneratingTTS(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-affirmation-audio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          apikey: SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ affirmations, voice: "nova" }),
      });
      const responseText = await response.text();
      const responseData = responseText ? JSON.parse(responseText) : null;
      if (!response.ok || responseData?.error) {
        throw new Error(responseData?.error || "Failed to generate audio");
      }
      if (responseData?.audioContent) {
        const binaryString = atob(responseData.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        setAudioBlob(new Blob([bytes], { type: "audio/mpeg" }));
      }
    } catch {
      /* keep onboarding toast-free */
    } finally {
      setIsGeneratingTTS(false);
    }
  };

  const saveDraftAndContinue = async () => {
    if (affirmations.length === 0) {
      setPageStep("manifest");
      return;
    }

    trackMarketingConversion("web_onboarding_click", {
      source: "welcome_page",
      button_label: MARKETING_CTA_MAKE_FIRST_SUBLIMINAL,
      target_path: SUBLIMINAL_PATH_READY,
      is_subliminal_traffic: isSubliminalTraffic,
    });
    markWebOnboardingMakeMySubliminalCtaClicked();
    if (audioBlob) {
      try {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onerror = () => reject(reader.error);
          reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
          reader.readAsDataURL(audioBlob);
        });
        if (dataUrl) {
          localStorage.setItem(
            SUBLIMINAL_ONBOARDING_VOCAL_KEY,
            JSON.stringify({
              type: audioBlob.type || "audio/mpeg",
              dataUrl,
              mode: vocalMode,
              savedAt: Date.now(),
            }),
          );
        }
      } catch {
        localStorage.removeItem(SUBLIMINAL_ONBOARDING_VOCAL_KEY);
      }
    }
    await writeSetupDraft({
      subliminalFastFlow: true,
      manifestTopic: manifestTopic.trim(),
      desireCategory: category,
      desireCategories: category ? [category] : [],
      currentFriction: "",
      desiredIdentity: manifestTopic.trim().slice(0, 50),
      conditionalSpecificity: {},
      starterAffirmations: affirmations,
      starterAffirmationCategory: category,
      subliminalVocalMode: vocalMode,
      subliminalBinauralBeat: ONBOARDING_STARTER_BINAURAL,
      subliminalBackgroundSound: ONBOARDING_STARTER_BACKGROUND,
      subliminalLayers: ONBOARDING_STARTER_LAYERS,
      subliminalTrackMinutes: ONBOARDING_STARTER_MINUTES,
      toolPreferences: ["custom_subliminals"],
      guideCharacterId: "rose",
      appNotificationsConsent: false,
      embodyDailyPractices: [
        "embody_rest",
        "embody_clean_environment",
        "embody_move",
        "embody_nutrition",
        "embody_self_care",
      ],
    }, {
      awaitBackendSync: true,
    });
    writeWebOnboardingSubliminalFastPath({
      stage: "completed",
      manifest_topic: manifestTopic.trim(),
      desire_category: category,
      starter_affirmation_category: category,
      starter_affirmations: affirmations,
      starter_affirmations_count: affirmations.length,
      subliminal_vocal_mode: vocalMode,
      subliminal_audio_present: Boolean(audioBlob),
      subliminal_audio_type: audioBlob?.type || null,
      subliminal_binaural_beat: ONBOARDING_STARTER_BINAURAL,
      subliminal_background_sound: ONBOARDING_STARTER_BACKGROUND,
      subliminal_layers: ONBOARDING_STARTER_LAYERS,
      subliminal_track_minutes: ONBOARDING_STARTER_MINUTES,
      tool_preferences: ["custom_subliminals"],
      guide_character_id: "rose",
      completed_at: new Date().toISOString(),
    });
    navigate(SUBLIMINAL_PATH_READY);
  };

  useEffect(() => {
    if (isNative) return;

    const recordWelcomeView = () => {
      void ensureOnboardingSessionCreds().catch((err) => {
        console.warn("[WelcomeSubliminal] ensureOnboardingSessionCreds failed:", err);
      });
      recordWebOnboardingSessionStart({
        isMobileViewport: isMobileViewport,
        entryPath: SUBLIMINAL_WELCOME_PATH,
      });
      trackMarketingConversion("web_onboarding_welcome_view", {
        source: "welcome_page",
        page_path: SUBLIMINAL_WELCOME_PATH,
        is_subliminal_traffic: isSubliminalTraffic,
      });
    };

    if (!detectInAppBrowser().isInAppBrowser) {
      recordWelcomeView();
      return;
    }

    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(() => recordWelcomeView(), { timeout: 4000 });
    } else {
      timeoutId = globalThis.setTimeout(recordWelcomeView, 1500);
    }

    return () => {
      if (idleId != null) window.cancelIdleCallback(idleId);
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [isNative, isMobileViewport, isSubliminalTraffic]);

  useEffect(() => {
    if (isNative) return;

    const preload = (href: string) => {
      if (document.querySelector(`link[rel="preload"][as="image"][href="${href}"]`)) return;
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = href;
      document.head.appendChild(link);
    };

    preload(WELCOME_APP_ICON);

    const fontId = "sv-welcome-proxima-nova";
    if (!document.getElementById(fontId)) {
      const fontLink = document.createElement("link");
      fontLink.id = fontId;
      fontLink.rel = "stylesheet";
      fontLink.href = "https://fonts.cdnfonts.com/css/proxima-nova";
      document.head.appendChild(fontLink);
    }
  }, [isNative, isMobileViewport, isSubliminalTraffic]);

  useEffect(() => {
    if (!isNative) return;
    if (!isLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate, isNative]);

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
    if (isNative) {
      navigate("/onboarding/setup/name");
    }
  };

  return (
    <OnboardingLayout
      {...welcomeLayoutPropsBase}
      onContinue={onContinue}
      canContinue={isNative}
      continueText={isNative ? WELCOME_CONTINUE_TEXT : ""}
      welcomeCtaSubtext={isNative ? WELCOME_CTA_SUBTEXT_NATIVE : undefined}
      welcomeSoloContinueButtonClassName={isNative ? WELCOME_PRIMARY_CTA_CLASS : undefined}
      contentMaxWidthClass="max-w-[22rem]"
      reserveProgressSpace={!isNative}
    >
      {isNative ? (
        <WelcomeBodyNative
          topPaddingClass="pt-[calc(var(--app-safe-area-top)+1.25rem)]"
          contentLiftClass="-translate-y-[0.32in]"
        />
      ) : (
        <div className="relative z-10 mx-auto flex w-full min-w-0 max-w-[22rem] -translate-y-[0.08in] flex-col items-center gap-2 pt-1 md:pt-1.5">
          <WelcomeAppIcon />
          <WelcomeHeadlineWeb pageStep={pageStep} />
          <p className="sv-subliminal-headline mb-3 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
            {ONBOARDING_STEP_LABELS[pageStep]}
          </p>
          {pageStep === "manifest" ? (
            <OnboardingManifestCard
              manifestTopic={manifestTopic}
              category={category}
              isGeneratingAffirmations={isGeneratingAffs}
              onTopicChange={setManifestTopic}
              onCategoryChange={setCategory}
              onCreateAffirmations={() => void handleGenerateAffirmations()}
            />
          ) : pageStep === "vocals" ? (
            <OnboardingVocalsCard
              affirmations={affirmations}
              onAffirmationsChange={(lines) => {
                setAffirmations(lines);
                void writeSetupDraft({
                  subliminalFastFlow: true,
                  manifestTopic: manifestTopic.trim(),
                  starterAffirmations: lines,
                  starterAffirmationCategory: category,
                });
              }}
              vocalTab={vocalTab}
              onVocalTabChange={(tab) => {
                setVocalTab(tab);
                setVocalMode(tab === "read" ? "karaoke" : "tts");
              }}
              isRecording={isRecording}
              hasAudio={!!audioBlob}
              isGeneratingTTS={isGeneratingTTS}
              startRecording={() => void startRecording()}
              stopRecording={stopRecording}
              generateAffirmationAudio={() => void generateAffirmationAudio()}
              onContinue={() => {
                trackMarketingConversion("web_onboarding_click", {
                  source: "subliminal_fast_path_vocals",
                  button_label: "Continue",
                  target_path: "/onboarding/subliminal/welcome#finetune",
                  is_subliminal_traffic: isSubliminalTraffic,
                });
                setPageStep("finetune");
              }}
            />
          ) : (
            <OnboardingBinauralCard onContinue={() => void saveDraftAndContinue()} />
          )}
          <WelcomeCommunityProofWeb />
        </div>
      )}
    </OnboardingLayout>
  );
};

export default WelcomeSubliminal;
