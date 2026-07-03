import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { runIosPaywallFlowAfterSignup } from "@/lib/runIosPaywallFlow";
import { shouldUseRevenueCatPaywallUi } from "@/lib/iosRevenueCatUiGate";
import type { BillingPeriod } from "@/lib/appleIAP";
import { ONBOARDING_ROUTES } from "@/lib/onboardingFlow";
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";
import { runAndroidPaywallFlowAfterSignup } from "@/lib/runAndroidPaywallFlow";
import { runWebPaywallFlowAfterSignup } from "@/lib/runWebPaywallFlow";

const EmailCollection = () => {
  const { t } = useTranslation(["paywall", "common"]);
  const navigate = useNavigate();
  const { ensureSession, updateSession } = useOnboardingSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [appNotificationsConsent, setAppNotificationsConsent] = useState(false);
  const [emailMarketingConsent, setEmailMarketingConsent] = useState(false);
  const [smsMarketingConsent, setSmsMarketingConsent] = useState(false);
  
  // Validation states
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  /** Native iOS (RevenueCat UI path): paywall failed after signup — Try again on this screen. */
  const [paywallNeedsRetry, setPaywallNeedsRetry] = useState(false);
  const [isRetryingPaywall, setIsRetryingPaywall] = useState(false);

  // Refs for debouncing
  const emailCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const usernameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clear localStorage on mount to ensure fresh start
  useEffect(() => {
    localStorage.removeItem('onboarding_answers');
    localStorage.removeItem('selectedCharacter');
    localStorage.removeItem('selected_plan');
    localStorage.removeItem('onboarding_data');
  }, []);

  // Real-time email validation (debounced)
  useEffect(() => {
    // Clear previous timeout
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current);
    }

    // Reset error if email is empty or invalid format
    if (!email || !email.includes("@")) {
      setEmailError(null);
      setIsCheckingEmail(false);
      return;
    }

    // Set checking state
    setIsCheckingEmail(true);
    setEmailError(null);

    // Debounce check by 500ms
    emailCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const { data: emailExists, error: checkError } = await supabase
          .rpc('check_email_exists', { check_email: email.trim() });

        if (checkError) {
          console.error("Error checking email:", checkError);
          setEmailError(null); // Don't show error on check failure
        } else if (emailExists) {
          setEmailError(t("paywall:emailCollection.emailTaken"));
        } else {
          setEmailError(null);
        }
      } catch (e) {
        console.error("Error checking email:", e);
        setEmailError(null);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500);

    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
    };
  }, [email, t]);

  // Real-time username validation (debounced)
  useEffect(() => {
    // Clear previous timeout
    if (usernameCheckTimeoutRef.current) {
      clearTimeout(usernameCheckTimeoutRef.current);
    }

    // Reset error if username is empty
    if (!username.trim()) {
      setUsernameError(null);
      setIsCheckingUsername(false);
      return;
    }

    // Set checking state
    setIsCheckingUsername(true);
    setUsernameError(null);

    // Debounce check by 500ms
    usernameCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const { data: usernameExists, error: checkError } = await supabase
          .rpc('check_username_exists', { check_username: username.trim() });

        if (checkError) {
          console.error("Error checking username:", checkError);
          setUsernameError(null); // Don't show error on check failure
        } else if (usernameExists) {
          setUsernameError(t("paywall:emailCollection.usernameTaken"));
        } else {
          setUsernameError(null);
        }
      } catch (e) {
        console.error("Error checking username:", e);
        setUsernameError(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => {
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
    };
  }, [username, t]);

  // Password validation
  useEffect(() => {
    if (!password) {
      setPasswordError(null);
      return;
    }
    if (password.length < 8) {
      setPasswordError(t("paywall:emailCollection.passwordMinLength"));
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      setPasswordError(t("paywall:emailCollection.passwordMismatch"));
      return;
    }
    setPasswordError(null);
  }, [password, confirmPassword, t]);

  const handleRetryPaywall = async () => {
    setIsRetryingPaywall(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;

      if (isAndroidPaywallContext()) {
        const outcome = await runAndroidPaywallFlowAfterSignup({ userId: uid, navigate });
        if (outcome === "success") { setPaywallNeedsRetry(false); return; }
        setPaywallNeedsRetry(true);
        return;
      }

      const outcome = await runIosPaywallFlowAfterSignup({
        userId: uid,
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
    if (!email || !email.includes("@")) {
      toast.error(t("paywall:emailCollection.invalidEmail"));
      return;
    }

    if (!username.trim()) {
      toast.error(t("paywall:emailCollection.needUsername"));
      return;
    }

    if (!password || password.length < 8) {
      toast.error(t("paywall:emailCollection.needPassword"));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t("paywall:emailCollection.passwordMismatchToast"));
      return;
    }

    if (!firstName.trim()) {
      toast.error(t("paywall:emailCollection.needFirstName"));
      return;
    }

    if (!acceptedTerms) {
      toast.error(t("paywall:emailCollection.acceptTerms"));
      return;
    }

    // Check for errors from real-time validation
    if (emailError) {
      toast.error(emailError);
      if (emailError.includes("already registered")) {
        navigate("/login");
      }
      return;
    }

    if (usernameError) {
      toast.error(usernameError);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            username: username.trim(),
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!signUpData.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          throw new Error(t("paywall:emailCollection.verifyEmailBlocked"));
        }
      }

      const uid = signUpData.user?.id ?? null;

      const isNativeIos = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
      if (isNativeIos) {
        // Save session data in background — don't block the paywall
        ensureSession().then(() => updateSession({
          email: email.trim(),
          first_name: firstName.trim(),
          username: username.trim() || null,
          app_notifications_consent: appNotificationsConsent,
          email_consent: emailMarketingConsent,
          sms_consent: smsMarketingConsent,
        })).catch(() => {});

        let useRcUi = true;
        try {
          useRcUi = await shouldUseRevenueCatPaywallUi();
        } catch {
          useRcUi = false;
        }

        // Older iOS: dedicated paywall screen (Monthly / Annual + StoreKit). Same route as resubscribe.
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

      // Non-iOS: save session data before navigating
      await ensureSession();
      await updateSession({
        email: email.trim(),
        first_name: firstName.trim(),
        username: username.trim() || null,
        app_notifications_consent: appNotificationsConsent,
        email_consent: emailMarketingConsent,
        sms_consent: smsMarketingConsent,
      });

      if (isAndroidPaywallContext()) {
        ensureSession()
          .then(() => updateSession({
            email: email.trim(),
            first_name: firstName.trim(),
            username: username.trim() || null,
            app_notifications_consent: appNotificationsConsent,
            email_consent: emailMarketingConsent,
            sms_consent: smsMarketingConsent,
          }))
          .catch(() => {});

        setPaywallNeedsRetry(false);
        const outcome = await runAndroidPaywallFlowAfterSignup({ userId: uid, navigate });
        if (outcome === "success") {
          return;
        }
        if (outcome === "skipped") {
          setPaywallNeedsRetry(true);
          return;
        }
        setPaywallNeedsRetry(true);
        return;
      }
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
        setPaywallNeedsRetry(true);
        return;
      }
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
        navigate("/onboarding/ios-paywall", { replace: true });
        return;
      }
      const outcome = await runWebPaywallFlowAfterSignup({ userId: uid, navigate });
      if (outcome === "skipped") {
        toast.error(t("paywall:emailCollection.subscriptionError"));
      }
    } catch (e: unknown) {
      console.error("Error saving email:", e);
      const message = e instanceof Error ? e.message : t("paywall:emailCollection.saveFailed");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formReady =
    email &&
    email.includes("@") &&
    password &&
    confirmPassword &&
    password.length >= 8 &&
    password === confirmPassword &&
    acceptedTerms &&
    firstName.trim() &&
    username.trim() &&
    !isSubmitting &&
    !emailError &&
    !passwordError &&
    !usernameError &&
    !isCheckingEmail &&
    !isCheckingUsername;

  const footerContinue = paywallNeedsRetry ? handleRetryPaywall : handleContinue;
  const footerCanContinue = paywallNeedsRetry ? !isRetryingPaywall : formReady;
  const footerContinueText = paywallNeedsRetry
    ? t("paywall:emailCollection.tryAgain")
    : t("common:continue");

  return (
    <OnboardingLayout
      currentPage={7}
      onContinue={footerContinue}
      canContinue={footerCanContinue}
      continueText={footerContinueText}
    >
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("paywall:emailCollection.title")}
          </h1>
        </div>

        <div className="w-full space-y-4 text-left">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-left">
              {t("paywall:emailCollection.emailLabel")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={t("paywall:emailCollection.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`h-12 rounded-xl ${emailError ? "border-destructive" : ""}`}
              autoComplete="email"
              autoFocus
            />
            {isCheckingEmail && (
              <p className="text-xs text-muted-foreground">{t("paywall:emailCollection.checkingEmail")}</p>
            )}
            {emailError && (
              <p className="text-xs text-destructive">{emailError}</p>
            )}
          </div>

          <div className="flex gap-3">
            <div className="space-y-2 flex-1">
              <Label htmlFor="firstName" className="text-left">
                {t("paywall:emailCollection.firstNameLabel")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder={t("paywall:emailCollection.firstNamePlaceholder")}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-10 rounded-xl"
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="username" className="text-left">
                {t("paywall:emailCollection.usernameLabel")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                type="text"
                placeholder={t("paywall:emailCollection.usernamePlaceholder")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`h-10 rounded-xl ${usernameError ? "border-destructive" : ""}`}
                autoComplete="username"
              />
              {isCheckingUsername && (
                <p className="text-xs text-muted-foreground">{t("paywall:emailCollection.checkingUsername")}</p>
              )}
              {usernameError && (
                <p className="text-xs text-destructive">{usernameError}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="space-y-2 flex-1">
              <Label htmlFor="password" className="text-left">
                {t("paywall:emailCollection.passwordLabel")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={t("paywall:emailCollection.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`h-10 rounded-xl ${passwordError ? "border-destructive" : ""}`}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="confirmPassword" className="text-left">
                {t("paywall:emailCollection.confirmLabel")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t("paywall:emailCollection.confirmPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`h-10 rounded-xl ${passwordError ? "border-destructive" : ""}`}
                autoComplete="new-password"
              />
            </div>
          </div>
          {passwordError && (
            <p className="text-xs text-destructive">{passwordError}</p>
          )}

          <div className="space-y-2.5 pt-2">
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="terms"
                className="text-xs text-muted-foreground leading-tight cursor-pointer"
              >
                {t("paywall:emailCollection.termsAcceptPrefix")}{" "}
                <button
                  type="button"
                  onClick={() => navigate("/terms")}
                  className="text-foreground font-medium hover:underline"
                >
                  {t("paywall:emailCollection.termsOfService")}
                </button>
                {" "}{t("paywall:emailCollection.termsAnd")}{" "}
                <button
                  type="button"
                  onClick={() => navigate("/privacy")}
                  className="text-foreground font-medium hover:underline"
                >
                  {t("paywall:emailCollection.privacyPolicy")}
                </button>
                .
              </Label>
            </div>

            <div className="flex items-start gap-2.5">
              <Checkbox
                id="app-notifications"
                checked={appNotificationsConsent}
                onCheckedChange={(checked) => setAppNotificationsConsent(checked === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="app-notifications"
                className="text-xs text-muted-foreground leading-tight cursor-pointer"
              >
                {t("paywall:emailCollection.appNotificationsConsent")}
              </Label>
            </div>

            <div className="flex items-start gap-2.5">
              <Checkbox
                id="email"
                checked={emailMarketingConsent}
                onCheckedChange={(checked) => setEmailMarketingConsent(checked === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="email"
                className="text-xs text-muted-foreground leading-tight cursor-pointer"
              >
                {t("paywall:emailCollection.emailMarketingConsent")}
              </Label>
            </div>

            <div className="flex items-start gap-2.5 hidden">
              <Checkbox
                id="sms"
                checked={smsMarketingConsent}
                onCheckedChange={(checked) => setSmsMarketingConsent(checked === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="sms"
                className="text-xs text-muted-foreground leading-tight cursor-pointer"
              >
                {t("paywall:emailCollection.smsMarketingConsent")}
              </Label>
            </div>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default EmailCollection;
