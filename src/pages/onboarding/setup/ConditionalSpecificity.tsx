import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import {
  getSpPersonHeadline,
  getStep7ChoiceConfig,
  isSpPersonStep7Category,
  normalizeDesireCategoryForStep7,
  type SpPersonChoice,
} from "@/lib/conditionalSpecificityStep7";
import { buildConditionalSpecificityPayload } from "@/lib/conditionalSpecificityStorage";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  SETUP_CHOICE_CHECK_ACTIVE_CLASS,
  SETUP_CHOICE_CHECK_INACTIVE_CLASS,
  SETUP_CHOICE_LABEL_CLASS,
  SETUP_FIELD_CLASS,
  SETUP_LABEL_CLASS,
  SETUP_MUTED_TEXT_CLASS,
  setupTextChoiceTileClass,
} from "@/lib/onboardingSetupTheme";
import { CheckCircle2, Circle } from "lucide-react";

type Step7Persist = {
  selection: string;
  customText?: string | null;
};

function specMatchesCategory(spec: Record<string, unknown>, canonical: string): boolean {
  const c = spec.category;
  return typeof c === "string" && c === canonical;
}

function readHydratedSp(canonical: string): { choice: SpPersonChoice | null; name: string } {
  const d = readSetupDraft();
  const spec = d.conditionalSpecificity;
  if (!spec || typeof spec !== "object") return { choice: null, name: "" };
  const rec = spec as Record<string, unknown>;
  if (!specMatchesCategory(rec, canonical)) return { choice: null, name: "" };
  const sp = rec.sp;
  if (!sp || typeof sp !== "object") return { choice: null, name: "" };
  const o = sp as Record<string, unknown>;
  const raw = o.hasSpecificPerson;
  const valid: SpPersonChoice[] = ["yes", "no", "complicated", "prefer_not"];
  const choice = typeof raw === "string" && valid.includes(raw as SpPersonChoice) ? (raw as SpPersonChoice) : null;
  const label = typeof o.label === "string" ? o.label : "";
  return { choice, name: label };
}

function readHydratedStep7(canonical: string): Step7Persist | null {
  const d = readSetupDraft();
  const spec = d.conditionalSpecificity;
  if (!spec || typeof spec !== "object") return null;
  const rec = spec as Record<string, unknown>;
  if (!specMatchesCategory(rec, canonical)) return null;
  const s7 = rec.step7;
  if (!s7 || typeof s7 !== "object") return null;
  const o = s7 as Record<string, unknown>;
  if (typeof o.selection !== "string" || !o.selection.trim()) return null;
  return {
    selection: o.selection.trim(),
    customText: typeof o.customText === "string" ? o.customText : null,
  };
}

const SP_CHOICE_KEYS = [
  { key: "yes", labelKey: "setup.conditionalSpecificity.spPerson.choices.yes" },
  { key: "no", labelKey: "setup.conditionalSpecificity.spPerson.choices.no" },
  { key: "complicated", labelKey: "setup.conditionalSpecificity.spPerson.choices.complicated" },
  { key: "prefer_not", labelKey: "setup.conditionalSpecificity.spPerson.choices.prefer_not" },
] as const;

export default function SetupConditionalSpecificity() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";
  const category = useMemo(() => normalizeDesireCategoryForStep7(readSetupDraft().desireCategory), []);

  const isSp = isSpPersonStep7Category(category);
  const choiceConfig = !isSp ? getStep7ChoiceConfig(category) : null;

  useEffect(() => {
    if (!category.trim()) {
      navigate(`${setupBase}/desire-category`, { replace: true });
      return;
    }
    if (!isSp && !choiceConfig) {
      navigate(
        isSuiteFunnel ? `${setupBase}/current-friction` : `${setupBase}/tool-preference`,
        { replace: true },
      );
    }
  }, [category, choiceConfig, isSp, isSuiteFunnel, navigate, setupBase]);

  const [spChoice, setSpChoice] = useState<SpPersonChoice | null>(() => readHydratedSp(category).choice);
  const [spName, setSpName] = useState(() => readHydratedSp(category).name);

  const initialStep7 = readHydratedStep7(category);
  const [selectedOption, setSelectedOption] = useState<string | null>(initialStep7?.selection ?? null);
  const [customText, setCustomText] = useState(() =>
    initialStep7?.selection === "Custom" ? (initialStep7.customText ?? "").trim() : ""
  );

  const spNeedsName = spChoice === "yes" || spChoice === "complicated";
  const spNameOk = !spNeedsName || spName.trim().length > 0;

  const choiceOk =
    choiceConfig &&
    selectedOption !== null &&
    (selectedOption !== "Custom" || customText.trim().length > 0);

  const canContinue =
    category.length > 0 && (isSp ? spChoice !== null && spNameOk : choiceConfig ? !!choiceOk : false);

  const headline = isSp
    ? t(getSpPersonHeadline())
    : choiceConfig
      ? t(choiceConfig.headlineKey)
      : t("setup.conditionalSpecificity.fallbackHeadline");
  const subtitle = t("setup.conditionalSpecificity.subtitle");

  return (
    <SetupPage
      canContinue={canContinue}
      onBack={() => navigate(`${setupBase}/desire-category`)}
      onContinue={() => {
        const latest = readSetupDraft();
        const cat = normalizeDesireCategoryForStep7(latest.desireCategory);

        const payload = isSpPersonStep7Category(cat)
          ? buildConditionalSpecificityPayload({
              category: cat,
              isSpPersonBranch: true,
              sp: { choice: spChoice, name: spName },
              step7: null,
            })
          : buildConditionalSpecificityPayload({
              category: cat,
              isSpPersonBranch: false,
              sp: null,
              step7: { selection: selectedOption, customText },
            });

        writeSetupDraft({
          conditionalSpecificity: payload as unknown as Record<string, unknown>,
        });
        navigate(
          isSuiteFunnel ? `${setupBase}/current-friction` : `${setupBase}/tool-preference`,
        );
      }}
    >
      <div className="relative z-[1] space-y-3 sm:space-y-4">
      <SetupHeadingBlock centered title={headline} subtitle={subtitle} />

      {isSp ? (
        <div className="space-y-3">
          {SP_CHOICE_KEYS.map(({ key, labelKey }) => {
            const active = spChoice === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSpChoice(key)}
                className={setupTextChoiceTileClass(active)}
                style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
              >
                <span className={SETUP_CHOICE_LABEL_CLASS}>{t(labelKey)}</span>
                {active ? (
                  <CheckCircle2 className={SETUP_CHOICE_CHECK_ACTIVE_CLASS} />
                ) : (
                  <Circle className={SETUP_CHOICE_CHECK_INACTIVE_CLASS} />
                )}
              </button>
            );
          })}

          {spNeedsName ? (
            <div className="pt-4 space-y-2">
              <Label htmlFor="spName" className={SETUP_LABEL_CLASS}>
                {t("setup.conditionalSpecificity.spPerson.nameLabel")}
              </Label>
              <Input
                id="spName"
                value={spName}
                onChange={(e) => setSpName(e.target.value)}
                placeholder={t("setup.conditionalSpecificity.spPerson.namePlaceholder")}
                className={SETUP_FIELD_CLASS}
              />
            </div>
          ) : null}
        </div>
      ) : choiceConfig ? (
        <div className="space-y-3">
          {choiceConfig.options.map(({ value, labelKey }) => {
            const active = selectedOption === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setSelectedOption(value);
                  if (value !== "Custom") setCustomText("");
                }}
                className={setupTextChoiceTileClass(active)}
                style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
              >
                <span className={SETUP_CHOICE_LABEL_CLASS}>{t(labelKey)}</span>
                {active ? (
                  <CheckCircle2 className={SETUP_CHOICE_CHECK_ACTIVE_CLASS} />
                ) : (
                  <Circle className={SETUP_CHOICE_CHECK_INACTIVE_CLASS} />
                )}
              </button>
            );
          })}
          {selectedOption === "Custom" ? (
            <div className="pt-4 space-y-2">
              <Label htmlFor="step7custom" className={SETUP_LABEL_CLASS}>
                {t("setup.conditionalSpecificity.customLabel")}
              </Label>
              <Input
                id="step7custom"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder={t("setup.conditionalSpecificity.customPlaceholder")}
                className={SETUP_FIELD_CLASS}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div className={SETUP_MUTED_TEXT_CLASS}>
          {t("setup.conditionalSpecificity.fallbackMessage")}
        </div>
      )}
      </div>
    </SetupPage>
  );
}
