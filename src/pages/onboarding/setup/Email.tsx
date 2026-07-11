import { useEffect, useMemo, useRef, useState } from "react";
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
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { supabase } from "@/integrations/supabase/client";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { toast } from "sonner";
import { runWebPaywallFlowAfterSignup } from "@/lib/runWebPaywallFlow";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { linkWebOnboardingSessionToUser } from "@/lib/webOnboardingSessionInsert";
import { useTranslation } from "react-i18next";

/** Delay wrong-email sign-out hint so it does not flash during paywall presentation. */
const SIGN_OUT_HINT_DELAY_MS = 3000;

export default function SetupEmail() {
  const { t } = useTranslation(["onboarding", "common", "paywall"]);
  const navigate = useNavigate();
  const setupBase = "/onboarding/setup";
  const { ensureSession, updateSession } = useOnboardingSession();
  const initial = useMemo(() => readSetupDraft(), []);
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
  /** Stripe checkout failed after signup — show retry on this screen. */
  const [paywallNeedsRetry, setPaywallNeedsRetry] = useState(false);
  const [isRetryingPaywall, setIsRetryingPaywall] = useState(false);
  /** Set when user already has a session — email is locked until sign out. */
  const [sessionAccountEmail, setSessionAccountEmail] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  /** Red sign-out hint — only after delay and not while opening paywall from Continue. */
  const [showSignOutHint, setShowSignOutHint] = useState(false);
  const [suppressSignOutHint, setSuppressSignOutHint] = useState(false);
  const emailCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signOutHintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      const authEmail = session?.user?.email?.trim().toLowerCase();
      if (authEmail) {
        setSessionAccountEmail(authEmail);
        setEmail(authEmail);
      }
    });
  }, []);

  useEffect(() => {
    if (!password) {
      setPasswordError(null);
      return;
    }
    if (password.length < 8) {
      setPasswordError(t("paywall:emailCollection.passwordMinLength"));
      return;
    }
    setPasswordError(null);
  }, [password, t]);

  useEffect(() => {
    if (emailCheckTimeoutRef.current) clearTimeout(emailCheckTimeoutRef.current);
    if (sessionAccountEmail) {
      setEmailError(null);
      setIsCheckingEmail(false);
      return;
    }
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
          setEmailError(t("paywall:emailCollection.emailTaken"));
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
  }, [email, sessionAccountEmail, t]);

  const normalizedEmail = email.trim().toLowerCase();
  const accountEmailLocked = sessionAccountEmail !== null;

  useEffect(() => {
    if (signOutHintTimeoutRef.current) clearTimeout(signOutHintTimeoutRef.current);
    if (!accountEmailLocked || suppressSignOutHint || isCheckingEmail || emailError) {
      setShowSignOutHint(false);
      return;
    }
    signOutHintTimeoutRef.current = setTimeout(() => {
      setShowSignOutHint(true);
    }, SIGN_OUT_HINT_DELAY_MS);
    return () => {
      if (signOutHintTimeoutRef.current) clearTimeout(signOutHintTimeoutRef.current);
    };
  }, [accountEmailLocked, suppressSignOutHint, isCheckingEmail, emailError]);
  const draftFirstName = (readSetupDraft().firstName ?? "").trim();
  const firstName = draftFirstName;
  const usernameForAuth = normalizedEmail;

  const formValid =
    normalizedEmail.length > 3 &&
    normalizedEmail.includes("@") &&
    (accountEmailLocked || password.length >= 8) &&
    acceptedTerms &&
    firstName.length > 0 &&
    !emailError &&
    !passwordError &&
    !isCheckingEmail &&
    (!accountEmailLocked || normalizedEmail === sessionAccountEmail);

  const handleSignOutForDifferentEmail = async () => {
    setIsSigningOut(true);
    const welcomePath = "/onboarding/welcome";
    try {
      await supabase.auth.signOut();
      navigate(welcomePath, { replace: true });
    } catch (e) {
      console.error("[SetupEmail] sign out failed:", e);
      toast.error(t("onboarding:setup.email.signOutFailed"));
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleRetryPaywall = async () => {
    setIsRetryingPaywall(true);
    setSuppressSignOutHint(true);
    setShowSignOutHint(false);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const outcome = await runWebPaywallFlowAfterSignup({
        userId: userData.user?.id ?? null,
        navigate,
      });
      if (outcome === "success") {
        setPaywallNeedsRetry(false);
        return;
      }
      setPaywallNeedsRetry(true);
      setSuppressSignOutHint(false);
    } finally {
      setIsRetryingPaywall(false);
    }
  };

  const handleContinue = async () => {
    if (!normalizedEmail.includes("@")) {
      toast.error(t("onboarding:setup.email.invalidEmail"));
      return;
    }
    const signupFirstName = firstName;
    if (!signupFirstName) {
      toast.error(t("onboarding:setup.email.needFirstName"));
      navigate(`${setupBase}/name`);
      return;
    }
    if (!accountEmailLocked && (!password || password.length < 8)) {
      toast.error(t("onboarding:setup.email.passwordLength"));
      return;
    }
    if (accountEmailLocked && normalizedEmail !== sessionAccountEmail) {
      toast.error(t("onboarding:setup.email.signOutToChangeEmailToast"));
      return;
    }
    if (!acceptedTerms) {
      toast.error(t("onboarding:setup.email.acceptTerms"));
      return;
    }
    if (emailError) {
      toast.error(emailError);
      if (emailError === t("paywall:emailCollection.emailTaken")) navigate("/login");
      return;
    }

    setIsSubmitting(true);
    setSuppressSignOutHint(true);
    setShowSignOutHint(false);
    try {
      const draftSnapshot = readSetupDraft();
      const sessionPatch: Record<string, unknown> = {
        email: normalizedEmail,
        first_name: signupFirstName,
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

      let uid: string | null = null;

      if (accountEmailLocked) {
        const {
          data: { user: authedUser },
        } = await supabase.auth.getUser();
        uid = authedUser?.id ?? null;
        if (!uid) {
          setSessionAccountEmail(null);
          throw new Error(t("onboarding:setup.email.sessionExpired"));
        }
      } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              first_name: signupFirstName,
              username: usernameForAuth,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (!signUpData.session) {
          await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });
        }

        const {
          data: { user: authedUser },
        } = await supabase.auth.getUser();

        uid = signUpData.user?.id ?? authedUser?.id ?? null;
      }

      if (uid) {
        linkWebOnboardingSessionToUser(uid);
      }
      if (!accountEmailLocked) {
        setSessionAccountEmail(normalizedEmail);
      }
      const releaseSignOutHintAfterPaywall = () => setSuppressSignOutHint(false);

      await ensureSession();
      await updateSession(sessionPatch);

      writeSetupDraft({
        email: normalizedEmail,
        emailMarketingConsent,
      });

      trackMarketingConversion("web_onboarding_signup_complete", {
        source: "setup_email",
        target_path: "/onboarding/web-paywall",
      });
      const outcome = await runWebPaywallFlowAfterSignup({ userId: uid, navigate });
      if (outcome === "skipped") {
        toast.error(t("onboarding:setup.email.subscriptionError"));
        releaseSignOutHintAfterPaywall();
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t("common:error");
      toast.error(message);
      setSuppressSignOutHint(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerContinue = paywallNeedsRetry ? handleRetryPaywall : handleContinue;
  const footerCanContinue = paywallNeedsRetry
    ? !isRetryingPaywall
    : formValid && !isSubmitting;
  const footerContinueText = paywallNeedsRetry
    ? t("onboarding:setup.email.tryAgain")
    : t("common:continue");

  return (
    <OnboardingLayout
      currentPage={10}
      nativeFormPage
      onContinue={footerContinue}
      canContinue={footerCanContinue}
      continueText={footerContinueText}
    >
      <div className="relative z-[1] mx-auto w-full max-w-md space-y-6 text-zinc-900">
        <SetupHeadingBlock
          centered
          title={t("onboarding:setup.email.title")}
          subtitle={t("onboarding:setup.email.subtitle")}
        />

        <div className="w-full space-y-2 text-left">
          <Label htmlFor="setup-email" className={SETUP_LABEL_CLASS}>
            {t("onboarding:setup.email.emailLabel")}
          </Label>
          <Input
            id="setup-email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("onboarding:setup.email.emailPlaceholder")}
            autoComplete="email"
            inputMode="email"
            readOnly={accountEmailLocked}
            aria-readonly={accountEmailLocked}
            className={`${SETUP_FIELD_CLASS} !bg-white/95 !text-zinc-900 placeholder:!text-zinc-400 [color-scheme:light] ${emailError ? "border-destructive" : ""}`}
            style={{
              color: "#18181b",
              WebkitTextFillColor: "#18181b",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
            }}
          />
          {isCheckingEmail ? (
            <p className={SETUP_MUTED_TEXT_CLASS}>{t("onboarding:setup.email.checkingAvailability")}</p>
          ) : null}
          {emailError ? <p className="text-xs text-destructive">{emailError}</p> : null}
          {showSignOutHint ? (
            <p className="text-xs text-zinc-500">
              {t("onboarding:setup.email.wrongEmailHint")}{" "}
              <button
                type="button"
                onClick={() => void handleSignOutForDifferentEmail()}
                disabled={isSigningOut}
                className="font-medium text-zinc-800 underline underline-offset-2 disabled:opacity-60"
              >
                {isSigningOut
                  ? t("dashboard:nav.signingOut")
                  : t("onboarding:setup.email.signOutToChangeEmail")}
              </button>
            </p>
          ) : null}
        </div>

        <div className="w-full space-y-2 text-left">
          <Label htmlFor="setup-password" className={SETUP_LABEL_CLASS}>
            {t("onboarding:setup.email.passwordLabel")}
          </Label>
          <div className="relative">
            <Input
              id="setup-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("onboarding:setup.email.passwordPlaceholder")}
              autoComplete="new-password"
              className={`${SETUP_FIELD_CLASS} pr-11 ${passwordError ? "border-destructive" : ""}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-12 w-11 rounded-2xl text-zinc-500 hover:text-zinc-800"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword
                  ? t("onboarding:setup.email.hidePassword")
                  : t("onboarding:setup.email.showPassword")
              }
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
              id="setup-terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
              className="mt-[3px] shrink-0 border-zinc-300 data-[state=checked]:border-zinc-900 data-[state=checked]:bg-zinc-900 data-[state=checked]:text-white"
            />
            <Label
              htmlFor="setup-terms"
              className="text-xs text-zinc-500 leading-tight cursor-pointer"
            >
              {t("onboarding:setup.email.termsAcceptPrefix")}{" "}
              <button
                type="button"
                onClick={() => navigate("/terms")}
                className="font-medium text-zinc-900 hover:underline"
              >
                {t("onboarding:setup.email.termsOfService")}
              </button>{" "}
              {t("onboarding:setup.email.termsAnd")}{" "}
              <button
                type="button"
                onClick={() => navigate("/privacy")}
                className="font-medium text-zinc-900 hover:underline"
              >
                {t("onboarding:setup.email.privacyPolicy")}
              </button>
              .
            </Label>
          </div>

          <div className="flex items-start gap-2.5">
            <Checkbox
              id="setup-email-marketing"
              checked={emailMarketingConsent}
              onCheckedChange={(checked) => setEmailMarketingConsent(checked === true)}
              className="mt-[3px] shrink-0 border-zinc-300 data-[state=checked]:border-zinc-900 data-[state=checked]:bg-zinc-900 data-[state=checked]:text-white"
            />
            <Label
              htmlFor="setup-email-marketing"
              className="text-xs text-zinc-500 leading-snug cursor-pointer"
            >
              {t("onboarding:setup.email.emailMarketingConsent")}
            </Label>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
