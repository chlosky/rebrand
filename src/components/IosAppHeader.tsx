import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type IosAppHeaderProps = {
  /** When true, show Sign out instead of Login and return to welcome after signing out. */
  signOutInsteadOfLogin?: boolean;
  /** Match onboarding welcome cosmic shell (dark starfield behind content). */
  cosmicShell?: boolean;
  /** Hide Login / Sign out (e.g. on the sign-in page itself). */
  hideAuthButton?: boolean;
};

/**
 * Header for iOS app screens (secure checkout, sign-in) that matches the Privacy Policy header.
 * Palette Plotting title links back to the welcome page; Login button links to sign-in.
 */
export const IosAppHeader = ({
  signOutInsteadOfLogin = false,
  cosmicShell = false,
  hideAuthButton = false,
}: IosAppHeaderProps) => {
  const { t } = useTranslation(["dashboard", "common"]);
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      navigate("/onboarding/welcome", { replace: true });
    } catch (e) {
      console.error("Sign out failed:", e);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <>
      <div
        className={cosmicShell ? "fixed top-0 left-0 right-0 z-40" : "fixed top-0 left-0 right-0 bg-background z-40"}
        style={{
          height: "env(safe-area-inset-top, 0px)",
          ...(cosmicShell ? { backgroundColor: "#020104" } : {}),
        }}
      />
      <header
        className={
          cosmicShell
            ? "fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#020104]/80 backdrop-blur-md"
            : "fixed top-0 left-0 right-0 z-50 border-b border-primary/10 bg-background"
        }
        style={{ top: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/onboarding/welcome")}
              className={
                cosmicShell
                  ? "font-sans text-sm font-semibold tracking-tight text-white/90 transition-opacity hover:opacity-80 cursor-pointer"
                  : "text-lg font-bold bg-gradient-primary bg-clip-text text-transparent dark:bg-none dark:text-foreground hover:opacity-80 transition-opacity cursor-pointer"
              }
            >
              Palette Plotting
            </button>
            {!hideAuthButton ? (
            signOutInsteadOfLogin ? (
              <Button
                variant="outline"
                className={
                  cosmicShell
                    ? "h-8 border-white/20 bg-white/10 px-3 text-sm text-white hover:bg-white/15 hover:text-white"
                    : "border-foreground/20 hover:bg-primary/10 h-8 px-3 text-sm"
                }
                onClick={() => void handleSignOut()}
                disabled={isSigningOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isSigningOut ? t("dashboard:nav.signingOut") : t("dashboard:nav.signOut")}
              </Button>
            ) : (
              <Button
                variant="outline"
                className={
                  cosmicShell
                    ? "h-8 border-white/20 bg-white/10 px-3 text-sm text-white hover:bg-white/15 hover:text-white"
                    : "border-foreground/20 hover:bg-primary/10 h-8 px-3 text-sm"
                }
                onClick={() => navigate("/login")}
              >
                <LogIn className="mr-2 h-4 w-4" />
                {t("signIn", { ns: "common" })}
              </Button>
            )
            ) : null}
          </div>
        </div>
      </header>
      <div style={{ height: "calc(64px + env(safe-area-inset-top, 0px))" }} />
    </>
  );
};
