import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import {
  getFocusDetailOptions,
  normalizeFocusCategory,
} from "@/lib/focusDetailOptions";
import { buildFocusDetailPayload } from "@/lib/focusDetailStorage";
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

type FocusDetailPersist = {
  selection: string;
  customText?: string | null;
};

function readHydratedDetail(category: string): FocusDetailPersist | null {
  const d = readSetupDraft();
  const spec = d.conditionalSpecificity;
  if (!spec || typeof spec !== "object") return null;
  const rec = spec as Record<string, unknown>;
  if (typeof rec.category !== "string" || rec.category !== category) return null;
  const s7 = rec.step7;
  if (!s7 || typeof s7 !== "object") return null;
  const o = s7 as Record<string, unknown>;
  if (typeof o.selection !== "string" || !o.selection.trim()) return null;
  return {
    selection: o.selection.trim(),
    customText: typeof o.customText === "string" ? o.customText : null,
  };
}

export default function SetupFocusDetails() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";
  const category = normalizeFocusCategory(readSetupDraft().desireCategory);

  const optionSet = getFocusDetailOptions(category);

  useEffect(() => {
    if (!category.trim()) {
      navigate(`${setupBase}/focus-categories`, { replace: true });
      return;
    }
    if (!optionSet) {
      navigate(
        isSuiteFunnel ? `${setupBase}/current-friction` : `${setupBase}/tool-preference`,
        { replace: true },
      );
    }
  }, [category, optionSet, isSuiteFunnel, navigate, setupBase]);

  const initialDetail = readHydratedDetail(category);
  const [selectedOption, setSelectedOption] = useState<string | null>(initialDetail?.selection ?? null);
  const [customText, setCustomText] = useState(() =>
    initialDetail?.selection === "Custom" ? (initialDetail.customText ?? "").trim() : "",
  );

  const canContinue =
    category.length > 0 &&
    !!optionSet &&
    selectedOption !== null &&
    (selectedOption !== "Custom" || customText.trim().length > 0);

  const headline = optionSet
    ? t(optionSet.headlineKey)
    : t("setup.focusDetails.fallbackHeadline");
  const subtitle = t("setup.focusDetails.subtitle");

  return (
    <SetupPage
      canContinue={canContinue}
      onBack={() => navigate(`${setupBase}/focus-categories`)}
      onContinue={() => {
        const latest = readSetupDraft();
        const cat = normalizeFocusCategory(latest.desireCategory);
        const payload = buildFocusDetailPayload({
          category: cat,
          selection: selectedOption,
          customText,
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

        {optionSet ? (
          <div className="space-y-3">
            {optionSet.options.map(({ value, labelKey }) => {
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
                <Label htmlFor="focusDetailCustom" className={SETUP_LABEL_CLASS}>
                  {t("setup.focusDetails.customLabel")}
                </Label>
                <Input
                  id="focusDetailCustom"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={t("setup.focusDetails.customPlaceholder")}
                  className={SETUP_FIELD_CLASS}
                />
              </div>
            ) : null}
          </div>
        ) : (
          <div className={SETUP_MUTED_TEXT_CLASS}>
            {t("setup.focusDetails.fallbackMessage")}
          </div>
        )}
      </div>
    </SetupPage>
  );
}
