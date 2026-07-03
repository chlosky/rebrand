import { useEffect, useMemo, useRef, useState } from "react";
import "@/styles/welcome-web-effects.css";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SETUP_FIELD_CLASS,
  SETUP_LABEL_CLASS,
  SETUP_MUTED_TEXT_CLASS,
} from "@/lib/onboardingSetupTheme";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { supabase } from "@/integrations/supabase/client";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { runIosPaywallFlowAfterSignup } from "@/lib/runIosPaywallFlow";
import { runAndroidPaywallFlowAfterSignup } from "@/lib/runAndroidPaywallFlow";
import { shouldUseRevenueCatPaywallUi } from "@/lib/iosRevenueCatUiGate";
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";
import { toast } from "sonner";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { linkWebOnboardingSessionToUser } from "@/lib/webOnboardingSessionInsert";

const SUBLIMINAL_PATH_LOADING = "/onboarding/subliminal/setup/plot-loading";

export default function SubliminalEmail() {
  const navigate = useNavigate();
  const { ensureSession, updateSession } = useOnboardingSession();
  const initial = useMemo(() => readSetupDraft(), []);
  const [firstName, setFirstName] = useState(initial.firstName ?? "");
  const [email, setEmail] = useState(initial.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailMarketingConsent, setEmailMarketingConsent] = useState(
    initial.emailMarketingConsent === true,
  );
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [paywallNeedsRetry, setPaywallNeedsRetry] = useState(false);
  const [isRetryingPaywall, setIsRetryingPaywall] = useState(false);
  const emailCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fontId = "sv-welcome-proxima-nova";
    if (document.getElementById(fontId)) return;
    const fontLink = document.createElement("link");
    fontLink.id = fontId;
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.cdnfonts.com/css/proxima-nova";
    document.head.appendChild(fontLink);
  }, []);

  useEffect(() => {
    if (!password) {
      setPasswordError(null);
      return;
    }
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    setPasswordError(null);
  }, [password]);

  useEffect(() => {
    if (emailCheckTimeoutRef.current) clearTimeout(emailCheckTimeoutRef.current);
    if (!email || !email.includes("@")) {
      setEmailError(null);
      setIsCheckingEmail(false);
      return;
    }
    setIsCheckingEmail(true);
    setEmailError(null);
    emailCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const { data: emailExists, error: checkError } = await supabase.rpc("check_email_exists", {
          check_email: email.trim(),
        });
        if (checkError) {
          setEmailError(null);
        } else if (emailExists) {
          setEmailError("This email is already registered. Sign in instead.");
        } else {
          setEmailError(null);
        }
      } catch {
        setEmailError(null);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500);
    return () => {
      if (emailCheckTimeoutRef.current) clearTimeout(emailCheckTimeoutRef.current);
    };
  }, [email]);

  const normalizedEmail = email.trim().toLowerCase();
  const firstNameTrimmed = firstName.trim();
  const usernameForAuth = normalizedEmail;

  const formValid =
    normalizedEmail.length > 3 &&
    normalizedEmail.includes("@") &&
    password.length >= 8 &&
    acceptedTerms &&
    firstNameTrimmed.length > 0 &&
    !emailError &&
    !passwordError &&
    !isCheckingEmail;

  const handleRetryPaywall = async () => {
    setIsRetryingPaywall(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (isAndroidPaywallContext()) {
        const outcome = await runAndroidPaywallFlowAfterSignup({
          userId: userData.user?.id ?? null,
          navigate,
        });
        if (outcome === "success") {
          setPaywallNeedsRetry(false);
          return;
        }
        setPaywallNeedsRetry(true);
        return;
      }
      const outcome = await runIosPaywallFlowAfterSignup({
        userId: userData.user?.id ?? null,
        navigate,
      });
      if (outcome === "success") {
        setPaywallNeedsRetry(false);
        return;
      }
      if (outcome === "skipped") {
        navigate("/onboarding/ios-paywall", { replace: true });
        return;
      }
      setPaywallNeedsRetry(true);
    } finally {
      setIsRetryingPaywall(false);
    }
  };

  const handleContinue = async () => {
    if (!normalizedEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!firstNameTrimmed) {
      toast.error("Please enter your first name");
      return;
    }
    if (!password || password.length < 8) {
      toast.error("Please enter a password with at least 8 characters");
      return;
    }
    if (!acceptedTerms) {
      toast.error("Please accept the Terms of Service and Privacy Policy");
      return;
    }
    if (emailError) {
      toast.error(emailError);
      if (emailError.includes("already registered")) navigate("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            first_name: firstNameTrimmed,
            username: usernameForAuth,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (!signUpData.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (signInError) {
          throw new Error(
            "Account created, but sign-in is blocked. Verify your email, then sign in.",
          );
        }
      }

      const {
        data: { user: authedUser },
      } = await supabase.auth.getUser();

      const draftSnapshot = readSetupDraft();
      const sessionPatch: Record<string, unknown> = {
        email: normalizedEmail,
        first_name: firstNameTrimmed,
        username: usernameForAuth,
        email_consent: emailMarketingConsent,
        sms_consent: false,
      };
      if (typeof draftSnapshot.appNotificationsConsent === "boolean") {
        sessionPatch.app_notifications_consent = draftSnapshot.appNotificationsConsent;
      }
      if (
        draftSnapshot.trackingPrePermissionChoice === "yes" ||
        draftSnapshot.trackingPrePermissionChoice === "no"
      ) {
        sessionPatch.tracking_pre_permission_choice = draftSnapshot.trackingPrePermissionChoice;
      }
      if (typeof draftSnapshot.trackingAuthorizationStatus === "string") {
        sessionPatch.tracking_authorization_status = draftSnapshot.trackingAuthorizationStatus;
      }
      if (typeof draftSnapshot.trackingPermissionAskedAt === "string") {
        sessionPatch.tracking_permission_asked_at = draftSnapshot.trackingPermissionAskedAt;
      }

      const uid = signUpData.user?.id ?? authedUser?.id ?? null;
      if (uid) {
        await linkWebOnboardingSessionToUser(uid);
      }
      const isNativeIos = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

      if (isNativeIos) {
        ensureSession()
          .then(() => updateSession(sessionPatch))
          .then(() =>
            writeSetupDraft({
              firstName: firstNameTrimmed,
              email: normalizedEmail,
              emailMarketingConsent,
            }),
          )
          .catch(() => {});

        let useRcUi = true;
        try {
          useRcUi = await shouldUseRevenueCatPaywallUi();
        } catch {
          useRcUi = false;
        }

        if (!useRcUi) {
          setPaywallNeedsRetry(false);
          navigate("/onboarding/ios-paywall", { replace: true });
          return;
        }

        setPaywallNeedsRetry(false);
        const outcome = await runIosPaywallFlowAfterSignup({ userId: uid, navigate });
        if (outcome === "success") {
          return;
        }
        if (outcome === "skipped") {
          navigate("/onboarding/ios-paywall", { replace: true });
          return;
        }
        setPaywallNeedsRetry(true);
        return;
      }

      await ensureSession();
      await updateSession(sessionPatch);
      await writeSetupDraft({
        firstName: firstNameTrimmed,
        email: normalizedEmail,
        emailMarketingConsent,
        subliminalFastFlow: true,
      });

      trackMarketingConversion("web_onboarding_click", {
        source: "subliminal_setup_email",
        button_label: "Continue",
        target_path: SUBLIMINAL_PATH_LOADING,
      });
      navigate(SUBLIMINAL_PATH_LOADING, { replace: true });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong. Try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerContinue = paywallNeedsRetry ? handleRetryPaywall : handleContinue;
  const footerCanContinue = paywallNeedsRetry ? !isRetryingPaywall : formValid && !isSubmitting;
  const footerContinueText = paywallNeedsRetry
    ? "Try again"
    : isSubmitting
      ? "Creating account..."
      : "Continue";
  return (
    <OnboardingLayout
      currentPage={3}
      nativeFormPage
      setupCosmicPage
      onContinue={footerContinue}
      canContinue={footerCanContinue}
      continueText={footerContinueText}
      hideProgress
    >
      <div className="relative z-[1] mx-auto w-full max-w-md space-y-6 text-white">
        <SetupHeadingBlock
          centered
          title={
            <span className="flex flex-col items-center gap-0.5">
              <span className="sv-hero-headline-accent block">Save your subliminal</span>
              <span className="block text-white">Start your free trial</span>
            </span>
          }
          titleClassName="sv-subliminal-headline !text-white"
        />

        <div className="grid w-full grid-cols-2 gap-3 text-left">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="subliminal-setup-firstName" className={SETUP_LABEL_CLASS}>
              First name
            </Label>
            <Input
              id="subliminal-setup-firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Your first name"
              autoComplete="given-name"
              className={SETUP_FIELD_CLASS}
            />
          </div>

          <div className="min-w-0 space-y-2">
            <Label htmlFor="subliminal-setup-email" className={`${SETUP_LABEL_CLASS} !text-white/70`}>
              Email
            </Label>
            <Input
              id="subliminal-setup-email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              inputMode="email"
              className={`${SETUP_FIELD_CLASS} !bg-white/95 !text-zinc-900 placeholder:!text-zinc-400 [color-scheme:light] ${emailError ? "border-destructive" : ""}`}
              style={{
                color: "#18181b",
                WebkitTextFillColor: "#18181b",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
              }}
            />
            {isCheckingEmail ? <p className={SETUP_MUTED_TEXT_CLASS}>Checking availability…</p> : null}
            {emailError ? <p className="text-xs text-destructive">{emailError}</p> : null}
          </div>
        </div>

        <div className="w-full space-y-2 text-left">
          <Label htmlFor="subliminal-setup-password" className={SETUP_LABEL_CLASS}>
            Password
          </Label>
          <div className="relative">
            <Input
              id="subliminal-setup-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8+ characters"
              autoComplete="new-password"
              className={`${SETUP_FIELD_CLASS} pr-11 ${passwordError ? "border-destructive" : ""}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-12 w-11 rounded-2xl text-zinc-500 hover:text-zinc-800"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </Button>
          </div>
          {passwordError ? <p className="text-xs text-destructive pt-1">{passwordError}</p> : null}
        </div>

        <div className="w-full space-y-4 text-left">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="subliminal-setup-terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
              className="mt-[3px] shrink-0 border-white/30 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-zinc-900"
            />
            <Label htmlFor="subliminal-setup-terms" className="text-xs text-white/55 leading-tight cursor-pointer">
              I accept the{" "}
              <button
                type="button"
                onClick={() => navigate("/terms")}
                className="font-medium text-white/90 hover:underline"
              >
                Terms of Service
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={() => navigate("/privacy")}
                className="font-medium text-white/90 hover:underline"
              >
                Privacy Policy
              </button>
              .
            </Label>
          </div>

          <div className="flex items-start gap-2.5">
            <Checkbox
              id="subliminal-setup-email-marketing"
              checked={emailMarketingConsent}
              onCheckedChange={(checked) => setEmailMarketingConsent(checked === true)}
              className="mt-[3px] shrink-0 border-white/30 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-zinc-900"
            />
            <Label
              htmlFor="subliminal-setup-email-marketing"
              className="text-xs text-white/55 leading-snug cursor-pointer"
            >
              Send me manifestation tips and updates. By checking this box, you consent to marketing communications.
              You can opt out anytime.
            </Label>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
