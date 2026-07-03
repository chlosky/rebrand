import { Home, Sparkles, User, PenLine } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";

export const BottomNav = () => {
  const { t } = useTranslation("dashboard");
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [userEmail, setUserEmail] = useState<string>("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        setUserEmail(user.email || "");

        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single();

        if (profileData) {
          if (profileData.username) {
            setUsername(profileData.username);
          }
          setAvatarUrl(profileData.avatar_url || "");
        }
      }
    };

    fetchUserData();
  }, [user]);

  const navItems = [
    { icon: Home, label: t("nav.home"), path: "/dashboard" },
    { icon: PenLine, label: t("nav.affirmScript"), path: "/dashboard/affirmations-builder" },
    { icon: Sparkles, label: t("nav.yourJourney"), path: "/dashboard/your-journey" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-primary/10 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2 pb-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Check if active - for affirmations, also match viewer route
          const isActive =
            location.pathname === item.path ||
            (item.path === "/dashboard/affirmations-builder" &&
              location.pathname.startsWith("/dashboard/affirmation-viewer")) ||
            (item.path === "/dashboard/your-journey" &&
              (location.pathname === "/dashboard/your-journey" ||
                location.pathname.startsWith("/dashboard/your-journey/")));
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-1"
              style={{
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div 
                className={cn(
                  "rounded-full p-2.5",
                  isActive ? "bg-muted" : "bg-transparent"
                )}
                style={{
                  transition: 'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: 'scale(1)',
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.95)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Icon 
                  className={cn("h-5 w-5", isActive ? "text-foreground" : "text-muted-foreground")}
                  style={{
                    transition: 'color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </div>
              <span 
                className="text-xs font-medium text-muted-foreground pb-0.5"
                style={{
                  transition: 'color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
        
        {/* User Profile Button */}
        <button
          onClick={() => navigate("/settings")}
          className="flex flex-col items-center justify-center gap-0.5 px-3 py-1"
          style={{
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div 
            className={cn(
              "rounded-full p-2.5",
              location.pathname === "/settings" ? "bg-muted" : "bg-transparent"
            )}
            style={{
              transition: 'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'scale(1)',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div 
              className={cn(
                "h-[22px] w-[22px] rounded-full border-2 flex items-center justify-center text-xs font-medium",
                location.pathname === "/settings" 
                  ? "border-foreground text-foreground" 
                  : "border-muted-foreground text-muted-foreground"
              )}
              style={{
                transition: 'border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {username ? username[0].toUpperCase() : userEmail[0]?.toUpperCase() || 'U'}
            </div>
          </div>
          <span 
            className="text-xs font-medium text-muted-foreground pb-0.5"
            style={{
              transition: 'color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Profile
          </span>
        </button>
      </div>
    </nav>
  );
};
