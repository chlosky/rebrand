import { useNavigate } from "react-router-dom";
import {
  CircleHelp,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const WORKSPACE_DARK_BG = "#000000";
const WORKSPACE_DOCUMENT_LIGHT_BG = "#ffffff";
const WORKSPACE_MOBILE_SHELL_BG = "#f3f0eb";
const WORKSPACE_DESKTOP_SHELL_BG = "#faf8f5";

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
  const dark = theme === "dark";
  const isMobile = useIsMobile();
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
    const docBg = dark ? WORKSPACE_DARK_BG : WORKSPACE_DOCUMENT_LIGHT_BG;
    const rootBg = dark
      ? WORKSPACE_DARK_BG
      : isMobile
        ? WORKSPACE_MOBILE_SHELL_BG
        : WORKSPACE_DESKTOP_SHELL_BG;
    document.documentElement.style.setProperty("background-color", docBg, "important");
    document.body.style.setProperty("background-color", docBg, "important");
    const root = document.getElementById("root");
    if (root) root.style.setProperty("background-color", rootBg, "important");
    return () => {
      document.documentElement.style.removeProperty("background-color");
      document.body.style.removeProperty("background-color");
      if (root) root.style.removeProperty("background-color");
    };
  }, [dark, isMobile]);

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
          className={cn("font-welcome-serif text-lg", dark ? "text-white" : "text-zinc-900")}
        >
          Palette Plotting
        </button>

        <div className="flex items-center gap-1">
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
