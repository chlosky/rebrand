import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { SETUP_FIELD_CLASS, SETUP_LABEL_CLASS } from "@/lib/onboardingSetupTheme";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";

const SUBLIMINAL_PATH_READY = "/onboarding/subliminal/setup/path-ready";
const SUBLIMINAL_EMAIL_PATH = "/onboarding/subliminal/setup/email";

export default function SubliminalName() {
  const navigate = useNavigate();
  const { ensureSession } = useOnboardingSession();
  const initial = useMemo(() => readSetupDraft().firstName ?? "", []);
  const [firstName, setFirstName] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);

  const canContinue = firstName.trim().length > 0 && !isSaving;

  return (
    <SetupPage
      canContinue={canContinue}
      onBack={() => navigate(SUBLIMINAL_PATH_READY)}
      onContinue={async () => {
        const trimmed = firstName.trim();
        if (!trimmed || isSaving) return;
        setIsSaving(true);
        try {
          await ensureSession();
          await writeSetupDraft({ firstName: trimmed }, { awaitBackendSync: true });
          navigate(SUBLIMINAL_EMAIL_PATH);
        } catch (e) {
          console.warn("[SubliminalName] failed to save first_name:", e);
          toast.error("Could not save your name. Check your connection and try again.");
        } finally {
          setIsSaving(false);
        }
      }}
    >
      <SetupHeadingBlock
        centered
        title="What should we call you?"
        subtitle="Your first name is used for your account and in the app."
        titleClassName="sv-subliminal-headline"
      />

      <div className="space-y-2 pt-6">
        <Label htmlFor="subliminal-firstName" className={SETUP_LABEL_CLASS}>
          First name
        </Label>
        <Input
          id="subliminal-firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Your first name"
          autoComplete="given-name"
          className={SETUP_FIELD_CLASS}
        />
      </div>
    </SetupPage>
  );
}
