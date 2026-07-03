import { useTranslation } from "react-i18next";
import { useMarketingLocaleLng } from "@/contexts/MarketingLocaleContext";

/** Marketing copy on homepage, quiz, and What is Palette Plotting only — other web pages stay English. */
export function useMarketingTranslation() {
  const lng = useMarketingLocaleLng();
  return useTranslation("marketing", { lng });
}
