import { useMarketingTranslation } from "@/hooks/useMarketingTranslation";
import {
  marketingLegalAcceptableUsePath,
  marketingLegalBillingPath,
  marketingLegalPrivacyPath,
  marketingLegalTermsPath,
} from "@/lib/marketingLocale";
import { useNavigate } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import {
  MARKETING_SUPPORT_EMAIL,
  MARKETING_SMS_DISPLAY,
  MARKETING_SMS_E164,
} from "@/lib/marketingContact";

const linkClass =
  "text-sm text-neutral-600 hover:text-neutral-900 transition-colors";

function scrollToHash(path: string) {
  const id = path.slice(1);
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", path);
  }
}

export function MarketingFooter() {
  const { t } = useMarketingTranslation();
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  const footerLinkRows = [
    [
      { label: t("home.footer.whatIs"), path: "/what-is-palette-plotting" },
      { label: t("home.footer.faq"), path: "/faq" },
      { label: t("home.footer.community"), path: "/community" },
      { label: t("home.footer.billing"), path: marketingLegalBillingPath() },
    ],
    [
      { label: t("home.footer.terms"), path: marketingLegalTermsPath() },
      { label: t("home.footer.privacy"), path: marketingLegalPrivacyPath() },
      { label: t("home.footer.acceptableUse"), path: marketingLegalAcceptableUsePath() },
      { label: t("home.footer.contact"), path: "/contact" },
    ],
  ];

  const handleLink = (path: string) => {
    if (path.startsWith("#")) {
      scrollToHash(path);
      return;
    }
    navigate(path);
  };

  return (
    <footer className="mt-auto border-t border-neutral-200 bg-white py-12 text-neutral-900 sm:py-14">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 text-center sm:px-6">
        <p className="text-sm font-medium text-neutral-500">{t("home.footer.company")}</p>
        <p className="mt-2 text-sm text-neutral-500">{t("home.footer.copyright", { year })}</p>

        <nav className="mx-auto mt-8 flex w-full max-w-3xl flex-col items-center gap-4" aria-label={t("home.footer.footerNav")}>
          {footerLinkRows.map((row) => (
            <ul
              key={row.map((l) => l.path).join("-")}
              className="flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-2"
            >
              {row.map((link) => (
                <li key={link.path}>
                  <button type="button" onClick={() => handleLink(link.path)} className={linkClass}>
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          ))}
        </nav>

        <p className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-neutral-600">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            <span>1 North State Street Ste 1500, Chicago, IL 60602</span>
          </span>
          <span className="text-neutral-300" aria-hidden>
            ·
          </span>
          <a
            href={`tel:${MARKETING_SMS_E164}`}
            className="inline-flex items-center gap-1.5 hover:text-neutral-900 transition-colors"
          >
            <Phone className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            {MARKETING_SMS_DISPLAY}
          </a>
          <span className="text-neutral-300" aria-hidden>
            ·
          </span>
          <a
            href={`mailto:${MARKETING_SUPPORT_EMAIL}`}
            className="inline-flex items-center gap-1.5 hover:text-neutral-900 transition-colors"
          >
            <Mail className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            {MARKETING_SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </footer>
  );
}
