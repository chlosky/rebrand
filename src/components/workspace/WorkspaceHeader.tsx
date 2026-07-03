import { useNavigate } from "react-router-dom";
import {
  Check,
  CircleHelp,
  LogOut,
  Moon,
  Settings,
  Sun,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

const WORKSPACE_DARK_BG = "#000000";
const WORKSPACE_LIGHT_BG = "#faf8f5";

export function workspaceShellClass(dark: boolean) {
  return cn("min-h-screen antialiased", dark ? "bg-black text-white" : "bg-[#faf8f5] text-zinc-900");
}

export function workspaceHeaderClass(dark: boolean) {
  return cn(
    "border-b backdrop-blur-sm",
    dark ? "border-white/10 bg-black/95" : "border-zinc-200/80 bg-white/90",
  );
}

export function WorkspaceHeader({ tabs }: { tabs?: React.ReactNode }) {
  const { t } = useTranslation("dashboard");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const userEmail = user?.email ?? "";

  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      const { data } = await supabase.from("profiles").select("username, avatar_url").eq("id", user.id).maybeSingle();
      if (data?.username) setUsername(data.username);
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    })();
  }, [user?.id]);

  useEffect(() => {
    const bg = dark ? WORKSPACE_DARK_BG : WORKSPACE_LIGHT_BG;
    document.documentElement.style.setProperty("background-color", bg, "important");
    document.body.style.setProperty("background-color", bg, "important");
    return () => {
      document.documentElement.style.removeProperty("background-color");
      document.body.style.removeProperty("background-color");
    };
  }, [dark]);

  const iconBtn = cn(
    "h-9 w-9 rounded-lg border p-0",
    dark
      ? "border-white/12 bg-transparent text-white hover:bg-white/10 hover:text-white"
      : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
  );

  return (
    <header className={workspaceHeaderClass(dark)}>
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => navigate("/workspace")}
          className={cn("font-welcome-serif text-lg", dark ? "text-white" : "text-zinc-900")}
        >
          Palette Plotting
        </button>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="icon" className={iconBtn} aria-label={t("nav.appearance")}>
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className={cn("w-52 z-50", dark ? "border border-white/12 bg-black text-white" : "bg-white")}
            >
              <DropdownMenuLabel>{t("nav.appearance")}</DropdownMenuLabel>
              <DropdownMenuSeparator className={dark ? "bg-white/10" : undefined} />
              <DropdownMenuItem className="gap-2" onClick={() => setTheme("light")}>
                <span className="h-3 w-3 rounded-full border border-zinc-300 bg-white" aria-hidden />
                <span className="flex-1">{t("appearance.light")}</span>
                {theme === "light" ? <Check className="h-4 w-4 opacity-70" /> : null}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => setTheme("dark")}>
                <span className="h-3 w-3 rounded-full border border-white/20 bg-black" aria-hidden />
                <span className="flex-1">{t("appearance.dark")}</span>
                {theme === "dark" ? <Check className="h-4 w-4 opacity-70" /> : null}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className={iconBtn}
            aria-label={t("nav.help")}
            onClick={() => navigate("/workspace/help")}
          >
            <CircleHelp className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className={cn(iconBtn, "w-auto px-2")}>
                <Avatar className="h-6 w-6">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt={username || userEmail} /> : null}
                  <AvatarFallback className={cn("text-xs", dark ? "bg-white/10 text-white" : "bg-zinc-100")}>
                    {(username || userEmail || "U")[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className={cn("w-56 z-50", dark ? "border border-white/12 bg-black text-white" : "bg-white")}
            >
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{username || t("profile.defaultUser")}</p>
                  <p className={cn("text-xs", dark ? "text-white/55" : "text-muted-foreground")}>{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className={dark ? "bg-white/10" : undefined} />
              <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                {t("profile.yourAccount")}
              </DropdownMenuItem>
              <DropdownMenuSeparator className={dark ? "bg-white/10" : undefined} />
              <DropdownMenuItem
                onClick={() => void supabase.auth.signOut().then(() => navigate("/login"))}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t("nav.signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {tabs ? (
        <div className={cn("mx-auto flex max-w-3xl gap-1 overflow-x-auto px-4 sm:px-6", dark ? "border-t border-white/10" : "")}>
          {tabs}
        </div>
      ) : null}
    </header>
  );
}
