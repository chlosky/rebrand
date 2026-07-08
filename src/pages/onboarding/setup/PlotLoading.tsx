import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import {
  SETUP_PROGRESS_FILL_CLASS,
  SETUP_PROGRESS_TRACK_CLASS,
} from "@/lib/onboardingSetupTheme";
import { useTranslation } from "react-i18next";

export default function SetupPlotLoading() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const setupBase = "/onboarding/setup";
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPct((p) => Math.min(100, p + Math.floor(Math.random() * 7 + 3)));
    }, 220);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (pct >= 100) {
      const tid = window.setTimeout(() => navigate(`${setupBase}/plot-synthesis`), 450);
      return () => window.clearTimeout(tid);
    }
  }, [pct, navigate, setupBase]);

  return (
    <SetupPage
      canContinue={false}
      continueText={t("setup.plotLoading.loading")}
      disableNativeScrollViewport
      onBack={() => navigate(`${setupBase}/attribution`)}
      onContinue={undefined}
    >
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col gap-2">
        <SetupHeadingBlock
          centered
          className="shrink-0 mb-1"
          title={t("setup.plotLoading.title")}
          subtitle={t("setup.plotLoading.subtitle")}
        />

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 space-y-6 pt-1">
            <div className={SETUP_PROGRESS_TRACK_CLASS}>
              <div
                className={SETUP_PROGRESS_FILL_CLASS}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="relative z-[1] flex min-h-0 flex-1 flex-col justify-center gap-4 pt-4 pb-1">
            <p className="px-2 text-center font-sans text-sm text-zinc-500">
              {t("setup.plotLoading.hint")}
            </p>
          </div>
        </div>
      </div>
    </SetupPage>
  );
}
