import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { applyAppDocumentChrome } from "@/lib/appDocumentChrome";
import {
  writeStoredAppearance,
} from "@/lib/appearancePreference";

export type Appearance = "light" | "dark";

interface ThemeContextType {
  theme: Appearance;
  setTheme: (appearance: Appearance) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * ThemeProvider sits outside `BrowserRouter`, so it can't use `useLocation`.
 * Previously this watched the URL with a `setInterval` that polled
 * `window.location.pathname` every 100ms forever — wasteful on Android battery.
 *
 * Instead, patch `history.pushState` / `replaceState` once per page load to
 * dispatch a custom `app:locationchange` event. `popstate` already fires for
 * back/forward; this covers the `navigate()` / `Navigate to=` cases that React
 * Router triggers via pushState/replaceState. No timer.
 */
const APP_LOCATION_CHANGE_EVENT = "app:locationchange";

declare global {
  interface Window {
    __appLocationChangePatched?: boolean;
  }
}

if (typeof window !== "undefined" && !window.__appLocationChangePatched) {
  window.__appLocationChangePatched = true;
  const dispatch = () => window.dispatchEvent(new Event(APP_LOCATION_CHANGE_EVENT));
  const origPush = window.history.pushState.bind(window.history);
  const origReplace = window.history.replaceState.bind(window.history);
  window.history.pushState = ((...args: Parameters<typeof origPush>) => {
    const result = origPush(...args);
    dispatch();
    return result;
  }) as typeof window.history.pushState;
  window.history.replaceState = ((...args: Parameters<typeof origReplace>) => {
    const result = origReplace(...args);
    dispatch();
    return result;
  }) as typeof window.history.replaceState;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme] = useState<Appearance>("light");

  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const updatePathname = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", updatePathname);
    window.addEventListener(APP_LOCATION_CHANGE_EVENT, updatePathname);

    return () => {
      window.removeEventListener("popstate", updatePathname);
      window.removeEventListener(APP_LOCATION_CHANGE_EVENT, updatePathname);
    };
  }, []);

  // Skip the work (especially the 3 native StatusBar plugin calls on Android)
  // when neither theme nor path has actually changed since the last apply.
  const lastAppliedRef = useRef<{ path: string; theme: Appearance } | null>(null);
  useEffect(() => {
    const path =
      typeof window !== "undefined" ? window.location.pathname : pathname;
    const last = lastAppliedRef.current;
    if (last && last.path === path && last.theme === theme) return;
    lastAppliedRef.current = { path, theme };
    applyAppDocumentChrome(path, theme);
  }, [theme, pathname]);

  const setTheme = useCallback((_appearance: Appearance) => {
    writeStoredAppearance("light");
  }, []);

  // Memoize so every navigation doesn't hand all `useTheme()` consumers a new
  // context value and force them to re-render.
  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
