import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { TikTokEvents } from "@/plugins/tikTokEvents";
import {
  FacebookAnalytics,
  FacebookEventName,
  isMetaNativeConfigured,
} from "@/lib/metaFacebook";
import { IosAppHeader } from "@/components/IosAppHeader";
import {
  WelcomeCosmicBackground,
  WELCOME_DEEP_BLACK_BASE,
  WELCOME_DEEP_BLACK_SHELL_BG,
} from "@/components/onboarding/WelcomeCosmicBackground";
import { cn } from "@/lib/utils";
// import { useActivityTracker } from "@/hooks/useActivityTracker"; // Disabled

/** White-card fields — override theme + browser autofill blue/yellow fill. */
const AUTH_FIELD_CLASS = cn(
  "!border-zinc-200 !bg-white !text-zinc-900 placeholder:!text-zinc-400 [color-scheme:light]",
  "[&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_1000px_#ffffff_inset]",
  "[&:-webkit-autofill]:[-webkit-text-fill-color:#18181b]",
  "[&:-webkit-autofill:hover]:[-webkit-box-shadow:0_0_0_1000px_#ffffff_inset]",
  "[&:-webkit-autofill:focus]:[-webkit-box-shadow:0_0_0_1000px_#ffffff_inset]",
  "[&:-webkit-autofill]:[transition:background-color_9999s_ease-out_0s]",
);

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
    const shellBg = WELCOME_DEEP_BLACK_SHELL_BG;
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    html.style.setProperty("background", shellBg, "important");
    html.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    body.style.setProperty("background", shellBg, "important");
    body.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    root?.style.setProperty("background", shellBg, "important");
    root?.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    themeMeta?.setAttribute("content", WELCOME_DEEP_BLACK_BASE);

    return () => {
      html.style.removeProperty("background");
      html.style.removeProperty("background-color");
      body.style.removeProperty("background");
      body.style.removeProperty("background-color");
      root?.style.removeProperty("background");
      root?.style.removeProperty("background-color");
    };
  }, []);
  
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  // const { trackActivity } = useActivityTracker(); // Disabled
  const trackActivity = async () => {}; // Stub

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let emailToUse = emailOrUsername;

      // If input doesn't contain @, treat it as username and look up the email
      if (!emailOrUsername.includes('@')) {
        const { data: email, error: lookupError } = await supabase
          .rpc('get_email_by_username', {
            lookup_username: emailOrUsername
          });

        if (lookupError || !email) {
          toast.error(t("toasts.usernameNotFound"));
          setLoading(false);
          return;
        }

        if (!email) {
          toast.error(t("toasts.usernameNotFound"));
          setLoading(false);
          return;
        }

        emailToUse = email;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });
      if (error) throw error;

      if (Capacitor.getPlatform() === "android") {
        void TikTokEvents.trackEvent({ eventName: "LOGIN" }).catch(() => {});
      }
      if (Capacitor.isNativePlatform() && isMetaNativeConfigured()) {
        void FacebookAnalytics.logEvent({ event: FacebookEventName.CompletedRegistration }).catch(() => {});
      }

      navigate("/workspace");
    } catch (error: any) {
      // await trackActivity({ action: 'login_failed', details: { email: emailOrUsername, error: error.message } }); // Disabled
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      let emailToUse = resetEmail;

      // If input doesn't contain @, treat it as username and look up the email
      if (!resetEmail.includes('@')) {
        const { data: email, error: lookupError } = await supabase
          .rpc('get_email_by_username', {
            lookup_username: resetEmail
          });

        if (lookupError || !email) {
          toast.error(t("toasts.usernameNotFound"));
          setResetLoading(false);
          return;
        }

        emailToUse = email;
      }

      // Use custom email function instead of Supabase's default
      const { error } = await supabase.functions.invoke("send-password-reset", {
        body: { email: emailToUse },
      });

      if (error) throw error;

      setResetSent(true);
      toast.success(t("toasts.resetLinkSent"));
    } catch (error: any) {
      toast.error(error.message || t("toasts.resetLinkFailed"));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen font-sans text-white antialiased"
      style={{ backgroundColor: WELCOME_DEEP_BLACK_BASE }}
    >
      <WelcomeCosmicBackground
        className="pointer-events-none fixed inset-0 z-0"
        tone="deep-black"
      />
      <IosAppHeader cosmicShell hideAuthButton />

      <div className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
        <div className="w-full max-w-md">

        <Card className="rounded-3xl border-0 bg-white text-foreground shadow-sm">
          <CardHeader>
            {resetSent ? (
              <CardTitle className="text-2xl text-center">{t("forgotPassword.checkEmailTitle")}</CardTitle>
            ) : (
              <>
                <CardTitle className="text-2xl">{t("signIn.title")}</CardTitle>
                <CardDescription>
                  {t("signIn.description")}
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            {isForgotPassword ? (
              <div className="space-y-4">
                {resetSent ? (
                  <div className="space-y-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      {t("forgotPassword.checkEmailBody")}
                    </p>
                    <Button
                      onClick={() => {
                        setIsForgotPassword(false);
                        setResetSent(false);
                        setResetEmail("");
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      {t("forgotPassword.backToSignIn")}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="resetEmail">{t("signIn.emailOrUsernameLabel")}</Label>
                      <Input
                        id="resetEmail"
                        type="text"
                        placeholder={t("signIn.emailOrUsernamePlaceholder")}
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className={AUTH_FIELD_CLASS}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-primary hover:shadow-glow-primary"
                      disabled={resetLoading}
                    >
                      {resetLoading ? t("forgotPassword.sending") : t("forgotPassword.sendResetLink")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsForgotPassword(false)}
                      className="w-full"
                    >
                      {t("forgotPassword.backToSignIn")}
                    </Button>
                  </form>
                )}
              </div>
            ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailOrUsername">{t("signIn.emailOrUsernameLabel")}</Label>
                <Input
                  id="emailOrUsername"
                  type="text"
                  placeholder={t("signIn.emailOrUsernamePlaceholder")}
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  className={AUTH_FIELD_CLASS}
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-2">
                  <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("signIn.passwordLabel")}</Label>
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-xs text-muted-foreground hover:text-foreground hover:underline"
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
                  className={AUTH_FIELD_CLASS}
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:shadow-glow-primary"
                disabled={loading}
              >
                {loading ? t("signIn.submitting") : t("signIn.submit")}
              </Button>
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  {t("signIn.noAccount")}{' '}
                  <button
                    type="button"
                    onClick={() => navigate("/onboarding/welcome")}
                    className="text-primary hover:underline font-medium"
                  >
                    {t("signIn.signUp")}
                  </button>
                </p>
              </div>
            </form>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
