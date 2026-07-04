import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** SPAs keep scroll position across routes unless you reset it. Honors hash anchors when present. */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace(/^#/, "");
      const scrollToTarget = () => {
        document.getElementById(id)?.scrollIntoView({ behavior: "auto" });
      };

      scrollToTarget();
      const retry = window.setTimeout(scrollToTarget, 150);
      return () => window.clearTimeout(retry);
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
}
