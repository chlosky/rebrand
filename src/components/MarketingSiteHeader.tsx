import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingStoreCtaProvider } from "@/hooks/useMarketingStoreCta";

/** Shared marketing nav for web pages (FAQ, blog, legal, login, etc.) — matches homepage header. */
export const MarketingSiteHeader = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      setUserEmail(user.email || "");
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .single();

      if (profileData) {
        if (profileData.username) setUsername(profileData.username);
        setAvatarUrl(profileData.avatar_url || "");
      }
    };

    void fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: "global" });
    await supabase.auth.signOut({ scope: "local" });
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k?.startsWith("subscription_check_")) sessionStorage.removeItem(k);
      }
    } catch {
      /* ignore */
    }
    navigate("/", { replace: true });
  };

  return (
    <MarketingStoreCtaProvider>
      <MarketingHeader
        showMobileDownloadApp={!Capacitor.isNativePlatform()}
        user={user}
        isLoading={isLoading}
        username={username}
        avatarUrl={avatarUrl}
        userEmail={userEmail}
        onLogout={() => void handleLogout()}
      />
      <div
        style={{ height: "calc(72px + env(safe-area-inset-top, 0px))" }}
        aria-hidden
      />
    </MarketingStoreCtaProvider>
  );
};
