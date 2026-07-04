import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackGAPageView, trackMetaPageView, trackTikTokPageView } from "@/site/lib/analytics";

/** Fires TikTok, Meta, and GA4 page views on SPA route changes (initial load included). */
export function AnalyticsListener() {
  const location = useLocation();

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    trackTikTokPageView(path);
    trackMetaPageView();
    trackGAPageView(path);
  }, [location.pathname, location.search]);

  return null;
}
