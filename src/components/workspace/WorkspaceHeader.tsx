import { useNavigate } from "react-router-dom";
import {
  CircleHelp,
  Loader2,
  LogOut,
  Settings,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { endStripeTrialEarly } from "@/lib/endStripeTrialEarly";
import { usePlottingPro } from "@/hooks/usePlottingPro";
import { toast } from "sonner";
import { BRAND_LOGO_CLASS } from "@/lib/siteBrand";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

export function workspaceShellClass(dark: boolean) {
  return cn(
    "min-h-[100dvh] antialiased md:min-h-screen",
    dark ? "bg-black text-white" : "bg-[#f3f0eb] text-zinc-900 md:bg-[#faf8f5]",
  );
}

export function workspaceHeaderClass(dark: boolean) {
  return cn(
    "border-b",
    dark ? "border-white bg-black" : "border-zinc-200/80 bg-white backdrop-blur-sm",
  );
}

export function WorkspaceHeader({ tabs }: { tabs?: React.ReactNode }) {
  const { t } = useTranslation("dashboard");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { hasPro, onTrial, hadTrial, loading: planLoading, refreshPlan } = usePlottingPro();
  const dark = theme === "dark";
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [endingTrial, setEndingTrial] = useState(false);
  const userEmail = user?.email ?? "";

  const handleEndTrial = async () => {
    if (!user?.id || endingTrial) return;
    setEndingTrial(true);
    try {
      const result = await endStripeTrialEarly(user.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      refreshPlan();
      toast.success(t("trial.success"));
      window.location.reload();
    } catch {
      toast.error(t("trial.error"));
    } finally {
      setEndingTrial(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      const { data } = await supabase.from("profiles").select("username, avatar_url").eq("id", user.id).maybeSingle();
      if (data?.username) setUsername(data.username);
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    })();
  }, [user?.id]);

  const iconBtn = cn(
    "h-9 w-9 border-0 bg-transparent p-0 shadow-none",
    dark
      ? "text-white hover:bg-white/10 hover:text-white"
      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
  );

  return (
    <header className={workspaceHeaderClass(dark)}>
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => navigate("/workspace")}
          className={cn(BRAND_LOGO_CLASS, dark ? "text-white" : "text-neutral-900")}
        >
          palette plotting
        </button>

        <div className="flex items-center gap-1">
          {onTrial ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "mr-1 h-8 rounded-full px-3 text-xs font-semibold",
                    dark
                      ? "border border-white text-white hover:bg-white hover:text-black"
                      : "border border-zinc-300 text-zinc-800 hover:bg-zinc-100",
                  )}
                >
                  {t("trial.endEarly")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className={dark ? "border border-white bg-black text-white" : undefined}>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("trial.confirmTitle")}</AlertDialogTitle>
                  <AlertDialogDescription className={dark ? "text-white" : undefined}>
                    {t("trial.confirmBody")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={endingTrial}>{t("trial.cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      void handleEndTrial();
                    }}
                    disabled={endingTrial}
                  >
                    {endingTrial ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("trial.ending")}
                      </span>
                    ) : (
                      t("trial.confirmCta")
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : !planLoading && !hasPro ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate("/onboarding/web-paywall")}
              className={cn(
                "mr-1 h-8 rounded-full px-3 text-xs font-semibold",
                dark
                  ? "border border-white text-white hover:bg-white hover:text-black"
                  : "border border-zinc-300 text-zinc-800 hover:bg-zinc-100",
              )}
            >
              {hadTrial ? t("trial.getPremium") : t("trial.start")}
            </Button>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" className={cn(iconBtn, "w-auto px-1")}>
                <Avatar className="h-6 w-6">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt={username || userEmail} /> : null}
                  <AvatarFallback className={cn("text-xs", dark ? "border border-white bg-black text-white" : "bg-zinc-100")}>
                    {(username || userEmail || "U")[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className={cn("w-56 z-50", dark ? "border border-white bg-black text-white" : "bg-white")}
            >
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{username || t("profile.defaultUser")}</p>
                  <p className={cn("text-xs", dark ? "text-white" : "text-muted-foreground")}>{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className={dark ? "bg-white" : undefined} />
              <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                {t("profile.yourAccount")}
              </DropdownMenuItem>
              <DropdownMenuSeparator className={dark ? "bg-white" : undefined} />
              <DropdownMenuItem
                onClick={() => void supabase.auth.signOut().then(() => navigate("/login"))}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t("nav.signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={iconBtn}
            aria-label={t("nav.help")}
            onClick={() => navigate("/workspace/help")}
          >
            <CircleHelp className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {tabs ? (
        <div className={cn("mx-auto flex max-w-3xl gap-1 overflow-x-auto px-4 sm:px-6", dark ? "border-t border-white" : "")}>
          {tabs}
        </div>
      ) : null}
    </header>
  );
}
