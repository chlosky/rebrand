import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import {
  clearStoredMarketingLocale,
  detectMarketingLocale,
  marketingLocaleForPath,
  type MarketingDisplayLocale,
  writeStoredMarketingLocale,
  isMarketingLocale,
} from "@/lib/marketingLocale";

type MarketingLocaleContextValue = {
  marketingLocale: MarketingDisplayLocale;
  setMarketingLocale: (locale: MarketingDisplayLocale) => void;
};

const MarketingLocaleContext = createContext<MarketingLocaleContextValue | null>(null);

export function MarketingLocaleProvider({ children }: { children: ReactNode }) {
  const [marketingLocale, setMarketingLocaleState] = useState<MarketingDisplayLocale>(() =>
    detectMarketingLocale(),
  );

  const setMarketingLocale = useCallback((locale: MarketingDisplayLocale) => {
    if (locale === "en") {
      clearStoredMarketingLocale();
    } else if (isMarketingLocale(locale)) {
      writeStoredMarketingLocale(locale);
    }
    setMarketingLocaleState(locale);
  }, []);

  const value = useMemo(
    () => ({ marketingLocale, setMarketingLocale }),
    [marketingLocale, setMarketingLocale],
  );

  return (
    <MarketingLocaleContext.Provider value={value}>{children}</MarketingLocaleContext.Provider>
  );
}

export function useMarketingLocaleContext(): MarketingLocaleContextValue {
  const ctx = useContext(MarketingLocaleContext);
  if (!ctx) {
    throw new Error("useMarketingLocaleContext must be used within MarketingLocaleProvider");
  }
  return ctx;
}

/** Active i18n language for marketing copy on the current route. */
export function useMarketingLocaleLng(): MarketingDisplayLocale {
  const { pathname } = useLocation();
  const { marketingLocale } = useMarketingLocaleContext();
  return marketingLocaleForPath(pathname, marketingLocale);
}
