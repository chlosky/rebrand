import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { TikTokEvents } from "@/plugins/tikTokEvents";
import {
  FacebookAnalytics,
  FacebookEventName,
  isMetaNativeConfigured,
} from "@/lib/metaFacebook";
import { AppHeader } from "@/components/AppHeader";
import { WELCOME_LIGHT_BASE } from "@/components/onboarding/WelcomeCosmicBackground";
import {
  SETUP_FIELD_CLASS,
  SETUP_HEADING_SUBTITLE_CLASS,
  SETUP_HEADING_TITLE_CLASS,
  SETUP_LABEL_CLASS,
  SETUP_MUTED_TEXT_CLASS,
  SETUP_PRIMARY_CTA_CLASS,
} from "@/lib/onboardingSetupTheme";
import { cn } from "@/lib/utils";

const Auth = () => {
  const { t } = useTranslation("auth");

  useEffect(() => {
    const prevTitle = document.title;
    document.title = t("signIn.pageTitle");
    return () => {
      document.title = prevTitle;
    };
  }, [t]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    html.style.setProperty("background", WELCOME_LIGHT_BASE, "important");
    html.style.setProperty("background-color", WELCOME_LIGHT_BASE, "important");
    body.style.setProperty("background", WELCOME_LIGHT_BASE, "important");
    body.style.setProperty("background-color", WELCOME_LIGHT_BASE, "important");
    root?.style.setProperty("background", WELCOME_LIGHT_BASE, "important");
    root?.style.setProperty("background-color", WELCOME_LIGHT_BASE, "important");
    themeMeta?.setAttribute("content", WELCOME_LIGHT_BASE);

    return () => {
      html.style.removeProperty("background");
      html.style.removeProperty("background-color");
      body.style.removeProperty("background");
      body.style.removeProperty("background-color");
      root?.style.removeProperty("background");
      root?.style.removeProperty("background-color");
    };
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectAfterAuth =
    typeof (location.state as { from?: unknown } | null)?.from === "string"
      ? String((location.state as { from: string }).from)
      : "/workspace";
  const trackActivity = async () => {};

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      if (Capacitor.getPlatform() === "android") {
        void TikTokEvents.trackEvent({ eventName: "LOGIN" }).catch(() => {});
      }
      if (Capacitor.isNativePlatform() && isMetaNativeConfigured()) {
        void FacebookAnalytics.logEvent({ event: FacebookEventName.CompletedRegistration }).catch(
          () => {},
        );
      }

      navigate(
        redirectAfterAuth.startsWith("/") ? redirectAfterAuth : "/workspace",
        { replace: true },
      );
    } catch (error: unknown) {
      void trackActivity();
      toast.error(error instanceof Error ? error.message : t("toasts.resetLinkFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-password-reset", {
        body: { email: resetEmail.trim() },
      });

      if (error) throw error;
      if (data && typeof data === "object" && "error" in data && data.error) {
        throw new Error(String(data.error));
      }

      setResetSent(true);
      toast.success(t("toasts.resetLinkSent"));
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : t("toasts.resetLinkFailed"),
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white font-sans text-zinc-900 antialiased">
      <AppHeader hideAuthButton />

      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            {resetSent ? (
              <h1 className={SETUP_HEADING_TITLE_CLASS}>{t("forgotPassword.checkEmailTitle")}</h1>
            ) : (
              <>
                <h1 className={SETUP_HEADING_TITLE_CLASS}>{t("signIn.title")}</h1>
                <p className={cn(SETUP_HEADING_SUBTITLE_CLASS, "mt-2 text-center")}>
                  {t("signIn.description")}
                </p>
              </>
            )}
          </div>

          {isForgotPassword ? (
            <div className="space-y-4">
              {resetSent ? (
                <div className="space-y-4 text-center">
                  <p className={SETUP_MUTED_TEXT_CLASS}>{t("forgotPassword.checkEmailBody")}</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full rounded-xl border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setResetSent(false);
                      setResetEmail("");
                    }}
                  >
                    {t("forgotPassword.backToSignIn")}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail" className={SETUP_LABEL_CLASS}>
                      {t("signIn.emailLabel")}
                    </Label>
                    <Input
                      id="resetEmail"
                      type="email"
                      placeholder={t("signIn.emailPlaceholder")}
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className={SETUP_FIELD_CLASS}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className={cn(SETUP_PRIMARY_CTA_CLASS, "w-full")}
                    disabled={resetLoading}
                  >
                    {resetLoading ? t("forgotPassword.sending") : t("forgotPassword.sendResetLink")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsForgotPassword(false)}
                    className="w-full text-zinc-600 hover:text-zinc-900"
                  >
                    {t("forgotPassword.backToSignIn")}
                  </Button>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className={SETUP_LABEL_CLASS}>
                  {t("signIn.emailLabel")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("signIn.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={SETUP_FIELD_CLASS}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className={SETUP_LABEL_CLASS}>
                    {t("signIn.passwordLabel")}
                  </Label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-xs text-zinc-500 hover:text-zinc-900 hover:underline"
                  >
                    {t("signIn.forgotPasswordLink")}
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("signIn.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={SETUP_FIELD_CLASS}
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button
                type="submit"
                className={cn(SETUP_PRIMARY_CTA_CLASS, "w-full")}
                disabled={loading}
              >
                {loading ? t("signIn.submitting") : t("signIn.submit")}
              </Button>
              <p className={cn(SETUP_MUTED_TEXT_CLASS, "pt-2 text-center")}>
                {t("signIn.noAccount")}{" "}
                <button
                  type="button"
                  onClick={() => navigate("/onboarding/welcome")}
                  className="font-medium text-zinc-900 underline-offset-2 hover:underline"
                >
                  {t("signIn.signUp")}
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
