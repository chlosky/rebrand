import type { ReactNode } from "react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingSiteHeader } from "@/components/MarketingSiteHeader";
import { MARKETING_PAGE_SHELL_CLASS } from "@/components/marketing/marketingVisualTheme";

type MarketingSiteLayoutProps = {
  children: ReactNode;
};

/** Bright marketing shell — palette plotting styling across FAQ, blog, legal, billing, contact. */
export function MarketingSiteLayout({ children }: MarketingSiteLayoutProps) {
  return (
    <main
      className={`marketing-site flex min-h-screen flex-col ${MARKETING_PAGE_SHELL_CLASS}`}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <MarketingSiteHeader />
      <div className="marketing-site-body flex-1">{children}</div>
      <MarketingFooter />
    </main>
  );
}
