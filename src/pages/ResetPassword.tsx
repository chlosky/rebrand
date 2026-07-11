import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { validatePassword, validatePasswordMatch } from "@/lib/password-validation";
import { MarketingSiteHeader } from "@/components/MarketingSiteHeader";

const ResetPassword = () => {
  const { t } = useTranslation(["auth", "settings"]);
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [isValidatingPassword, setIsValidatingPassword] = useState(false);

  const passwordValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;

    const acceptSession = () => {
      setHasValidSession(true);
      setCheckingSession(false);
    };

    const init = async () => {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const type = params.get("type");

      if (type === "recovery" && accessToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? "",
        });
        if (!error) {
          window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
          acceptSession();
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        acceptSession();
        return;
      }

      const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
        if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && nextSession) {
          acceptSession();
        }
      });
      subscription = data.subscription;
      setCheckingSession(false);
    };

    void init();
    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (passwordValidationTimeoutRef.current) {
      clearTimeout(passwordValidationTimeoutRef.current);
    }

    if (!password) {
      setPasswordError(null);
      setIsValidatingPassword(false);
      return;
    }

    setIsValidatingPassword(true);
    setPasswordError(null);

    passwordValidationTimeoutRef.current = setTimeout(() => {
      const result = validatePassword(password);
      setPasswordError(result.error ? t(`passwordValidation.${result.error}`, { ns: "settings" }) : null);
      setIsValidatingPassword(false);
    }, 500);

    return () => {
      if (passwordValidationTimeoutRef.current) {
        clearTimeout(passwordValidationTimeoutRef.current);
      }
    };
  }, [password, t]);

  useEffect(() => {
    if (!confirmPassword) {
      setConfirmPasswordError(null);
      return;
    }

    const result = validatePasswordMatch(password, confirmPassword);
    setConfirmPasswordError(
      result.error ? t(`passwordValidation.${result.error}`, { ns: "settings" }) : null,
    );
  }, [confirmPassword, password, t]);

  const canSubmit =
    !!password &&
    !!confirmPassword &&
    password === confirmPassword &&
    !passwordError &&
    !confirmPasswordError &&
    !isValidatingPassword;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success(t("toasts.passwordResetSuccess"));
      navigate("/login");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("toasts.passwordResetFailed");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-background" style={{ colorScheme: "light" }}>
        <MarketingSiteHeader />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">{t("resetPassword.validatingPassword")}</p>
        </div>
      </main>
    );
  }

  if (!hasValidSession) {
    return (
      <main className="min-h-screen bg-background" style={{ colorScheme: "light" }}>
        <MarketingSiteHeader />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t("resetPassword.title")}</CardTitle>
              <CardDescription>{t("resetPassword.noSessionDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/login")} className="w-full">
                {t("resetPassword.backToSignIn")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background" style={{ colorScheme: "light" }}>
      <MarketingSiteHeader />
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">{t("resetPassword.title")}</CardTitle>
            <CardDescription>{t("resetPassword.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">{t("resetPassword.newPasswordLabel")}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("resetPassword.newPasswordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={passwordError ? "border-destructive" : ""}
                  required
                />
                {isValidatingPassword && (
                  <p className="text-xs text-muted-foreground">{t("resetPassword.validatingPassword")}</p>
                )}
                {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("resetPassword.confirmPasswordLabel")}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t("resetPassword.confirmPasswordPlaceholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={confirmPasswordError ? "border-destructive" : ""}
                  required
                />
                {confirmPasswordError && (
                  <p className="text-xs text-destructive">{confirmPasswordError}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:shadow-glow-primary"
                disabled={!canSubmit || loading}
              >
                {loading ? t("resetPassword.submitting") : t("resetPassword.submit")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default ResetPassword;
