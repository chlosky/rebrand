import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const HOMEPAGE_SECTION_HASHES = new Set([
  "#download-app",
  "#newsletter",
  "#features",
  "#how-it-works",
  "#testimonials",
]);

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname === "/" && HOMEPAGE_SECTION_HASHES.has(window.location.hash)) {
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

