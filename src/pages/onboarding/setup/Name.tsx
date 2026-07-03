import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { toast } from "sonner";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { SETUP_FIELD_CLASS, SETUP_LABEL_CLASS } from "@/lib/onboardingSetupTheme";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { useTranslation } from "react-i18next";

export default function SetupName() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";
  const welcomePath = isSuiteFunnel ? "/onboarding/suite/welcome" : "/onboarding/welcome";
  const { ensureSession } = useOnboardingSession();
  const initial = useMemo(() => readSetupDraft().firstName ?? "", []);
  const [firstName, setFirstName] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);

  const canContinue = firstName.trim().length > 0 && !isSaving;

  return (
    <SetupPage
      canContinue={canContinue}
      onBack={() =>
        navigate(isSuiteFunnel ? welcomePath : `${setupBase}/plot-synthesis`)
      }
      onContinue={async () => {
        const trimmed = firstName.trim();
        if (!trimmed || isSaving) return;
        setIsSaving(true);
        try {
          await ensureSession();
          await writeSetupDraft({ firstName: trimmed }, { awaitBackendSync: true });
          navigate(isSuiteFunnel ? `${setupBase}/primary-intent` : `${setupBase}/email`);
        } catch (e) {
          console.warn("[SetupName] failed to save first_name to onboarding_sessions:", e);
          toast.error(t("setup.name.saveError"));
        } finally {
          setIsSaving(false);
        }
      }}
    >
      <SetupHeadingBlock centered title={t("setup.name.title")} />

      <div className="space-y-2 pt-6">
        <Label htmlFor="firstName" className={SETUP_LABEL_CLASS}>
          {t("setup.name.firstNameLabel")}
        </Label>
        <Input
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder={t("setup.name.firstNamePlaceholder")}
          autoComplete="given-name"
          className={SETUP_FIELD_CLASS}
        />
      </div>
    </SetupPage>
  );
}

