import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { CartNavLink } from "@/site/components/layout/CartNavLink";
import { OrganizationJsonLd } from "@/site/components/layout/OrganizationJsonLd";
import { SiteFooter } from "@/site/components/layout/SiteFooter";
import { UrgencyTicker } from "@/site/components/layout/UrgencyTicker";
import { GUIDE_CATALOG } from "@/site/lib/guidePublicManifest";
import { SITE_CONTAINER, SITE_NAME } from "@/site/lib/siteBrand";
import { cn } from "@/site/lib/utils";

const navItemClass =
  "text-sm font-medium text-neutral-900 transition-colors hover:text-neutral-600";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(navItemClass, isActive && "underline decoration-neutral-300 underline-offset-4");

type SiteLayoutProps = {
  children: ReactNode;
};

export function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <main
      className="flex min-h-screen flex-col bg-white font-sans text-neutral-900 antialiased"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <header className="border-b border-neutral-200 bg-white">
        <div className={`${SITE_CONTAINER} grid grid-cols-1 items-center gap-4 py-3 md:grid-cols-2 md:gap-10`}>
          <Link
            to="/"
            className="text-lg font-semibold tracking-tight text-neutral-900 hover:text-neutral-700"
          >
            {SITE_NAME}
          </Link>
          <nav
            className="flex items-center justify-start gap-5 sm:gap-6 md:justify-end"
            aria-label="Site navigation"
          >
            <NavLink to="/" end className={navLinkClass}>
              Shop
            </NavLink>
            <NavLink to={GUIDE_CATALOG.path} className={navLinkClass}>
              The Guide
            </NavLink>
            <Link to="/onboarding/welcome" className={navItemClass}>
              The Tool
            </Link>
            <NavLink to="/about" className={navLinkClass}>
              About
            </NavLink>
            <Link to="/login" className={navItemClass}>
              Sign in
            </Link>
            <CartNavLink />
          </nav>
        </div>
      </header>
      <UrgencyTicker />
      <div className="flex-1">{children}</div>
      <OrganizationJsonLd />
      <SiteFooter />
    </main>
  );
}
