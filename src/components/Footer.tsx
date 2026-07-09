import { useNavigate } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import {
  MARKETING_SUPPORT_EMAIL,
  MARKETING_SMS_DISPLAY,
  MARKETING_SMS_E164,
} from "@/lib/marketingContact";

const FOOTER_LINK_ROWS = [
  [
    { label: "What is palette plotting?", path: "/what-is-palette-plotting" },
    { label: "FAQ", path: "/faq" },
    { label: "Billing", path: "/billing" },
  ],
  [
    { label: "Terms of Use", path: "/terms" },
    { label: "Privacy Policy", path: "/privacy" },
    { label: "Acceptable Use Policy", path: "/acceptable-use" },
    { label: "Contact", path: "/contact" },
  ],
] as const;

const linkClass =
  "text-sm text-muted-foreground hover:text-foreground transition-colors";

export const Footer = () => {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-primary/20 bg-background py-12 px-6 text-foreground sm:py-14">
      <div className="mx-auto flex max-w-7xl flex-col items-center text-center">
        <p className="text-sm font-medium text-muted-foreground">PALETTE PLOTTING LLC</p>
        <p className="mt-2 text-sm text-muted-foreground">© {year} palette plotting. All rights reserved.</p>

        <nav className="mx-auto mt-8 flex w-full max-w-3xl flex-col items-center gap-4" aria-label="Footer">
          {FOOTER_LINK_ROWS.map((row) => (
            <ul
              key={row.map((l) => l.path).join("-")}
              className="flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-2"
            >
              {row.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() => navigate(link.path)}
                    className={linkClass}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          ))}
        </nav>

        <p className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            <span>1 North State Street Ste 1500, Chicago, IL 60602</span>
          </span>
          <span className="text-muted-foreground/50" aria-hidden>
            ·
          </span>
          <a
            href={`tel:${MARKETING_SMS_E164}`}
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <Phone className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            {MARKETING_SMS_DISPLAY}
          </a>
          <span className="text-muted-foreground/50" aria-hidden>
            ·
          </span>
          <a
            href={`mailto:${MARKETING_SUPPORT_EMAIL}`}
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <Mail className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            {MARKETING_SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </footer>
  );
};
