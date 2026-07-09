import { useEffect, useState } from "react";
import { useMarketingTranslation } from "@/hooks/useMarketingTranslation";
import { useNavigate } from "react-router-dom";
import { LogIn, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TextHelpHeaderBubble } from "@/components/TextHelpHeaderBubble";
import { cn } from "@/lib/utils";
import { useMarketingStoreCta } from "@/hooks/useMarketingStoreCta";
import {
  MARKETING_LOGO_CLASS,
  MARKETING_PRIMARY_CTA_CLASS,
  MARKETING_HEADER_BORDER_CLASS,
} from "@/components/marketing/marketingVisualTheme";
import {
  PALETTE_PLOTTING_APP_STORE_URL,
  PALETTE_PLOTTING_GOOGLE_PLAY_URL,
} from "@/lib/appStore";

type MarketingHeaderProps = {
  /** Marketing subpages (FAQ, blog, legal): compact download CTA on mobile only. */
  showMobileDownloadApp?: boolean;
  user: { id: string; email?: string } | null;
  isLoading: boolean;
  username: string;
  avatarUrl: string;
  userEmail: string;
  onLogout: () => void;
};

export function MarketingHeader({
  showMobileDownloadApp = false,
  user,
  isLoading,
  username,
  avatarUrl,
  userEmail,
  onLogout,
}: MarketingHeaderProps) {
  const { t } = useMarketingTranslation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const navLinks = [
    { label: t("home.header.community"), href: "/community", route: true as const },
    { label: t("home.header.faq"), href: "/faq", route: true as const },
  ];
  const cta = useMarketingStoreCta();
  const shellBase = "#ffffff";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-40"
        style={{
          height: "env(safe-area-inset-top, 0px)",
          background: shellBase,
        }}
        aria-hidden
      />
      <header
        className={cn(
          "marketing-header fixed left-0 right-0 z-50 transition-colors duration-300",
          scrolled
            ? `${MARKETING_HEADER_BORDER_CLASS} backdrop-blur-md`
            : "border-b border-transparent bg-white",
        )}
        style={{ top: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="shrink-0 text-left transition-opacity hover:opacity-90"
          >
            <span className={cn(MARKETING_LOGO_CLASS, "text-lg")}>palette plotting</span>
          </button>

          <nav className="hidden items-center gap-6 lg:flex" aria-label={t("home.header.mainNav")}>
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  if ("route" in link && link.route) {
                    e.preventDefault();
                    navigate(link.href);
                  }
                }}
                className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex min-w-0 shrink items-center justify-end gap-1 sm:gap-2">
            {!isLoading && user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="relative h-8 w-8 rounded-full border border-white/15 hover:bg-white/10"
                    >
                      <Avatar className="h-8 w-8">
                        {avatarUrl && <AvatarImage src={avatarUrl} alt={username || userEmail || "User"} />}
                        <AvatarFallback className="bg-white/10 text-sm text-white">
                          {username ? username[0].toUpperCase() : userEmail[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{username || t("home.header.user")}</p>
                        <p className="text-xs text-muted-foreground">{userEmail}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      {t("home.header.yourAccount")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      {t("home.header.logOut")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="sm"
                  className="inline-flex h-8 border-white/20 bg-white/5 px-2.5 text-xs text-white hover:bg-white/10 hover:text-white sm:px-3 sm:text-sm"
                  onClick={() => navigate("/dashboard/boards")}
                >
                  {t("home.header.dashboard")}
                </Button>
              </>
            ) : (
              <>
                <span className="hidden md:inline-flex">
                  <TextHelpHeaderBubble />
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="inline-flex h-8 shrink-0 px-2.5 text-xs font-medium text-white/65 hover:bg-white/10 hover:text-white sm:px-3 sm:text-sm"
                  onClick={() => navigate("/login")}
                >
                  <LogIn className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                  {t("home.header.signIn")}
                </Button>
                {showMobileDownloadApp ? (
                  <a
                    href={
                      typeof navigator !== "undefined" && /android/i.test(navigator.userAgent)
                        ? PALETTE_PLOTTING_GOOGLE_PLAY_URL
                        : PALETTE_PLOTTING_APP_STORE_URL
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 shrink-0 items-center rounded-full bg-white px-3 text-xs font-semibold text-black hover:bg-white/90 md:hidden"
                  >
                    {t("home.header.downloadApp")}
                  </a>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  className={cn(
                    MARKETING_PRIMARY_CTA_CLASS,
                    "hidden h-8 shrink-0 items-center justify-center px-3 text-xs md:inline-flex sm:text-sm",
                  )}
                  onClick={() => cta.onStoreClick("header")}
                >
                  {t("home.hero.ctaDownload")}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
