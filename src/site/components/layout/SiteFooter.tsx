import { Link } from "react-router-dom";
import { CONTACT_INFO } from "@/site/lib/sitePolicies";
import { SITE_CONTAINER, SITE_NAME } from "@/site/lib/siteBrand";

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50 py-8 text-sm text-neutral-500">
      <div className={`${SITE_CONTAINER} space-y-4`}>
        <p className="font-medium text-neutral-800">{SITE_NAME}</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Footer policies">
          <Link to="/about" className="hover:text-neutral-900">
            About
          </Link>
          <Link to="/policies/shipping" className="hover:text-neutral-900">
            Shipping
          </Link>
          <Link to="/policies/refunds" className="hover:text-neutral-900">
            Refunds
          </Link>
          <Link to="/policies/privacy" className="hover:text-neutral-900">
            Privacy
          </Link>
          <Link to="/policies/terms" className="hover:text-neutral-900">
            Terms
          </Link>
          <Link to="/contact" className="hover:text-neutral-900">
            Contact
          </Link>
        </nav>
        <address className="space-y-1 not-italic leading-relaxed">
          <p className="font-medium text-neutral-800">{CONTACT_INFO.businessName}</p>
          <p>
            <a href={`mailto:${CONTACT_INFO.email}`} className="hover:text-neutral-900">
              {CONTACT_INFO.email}
            </a>
          </p>
          <p>
            <a href={CONTACT_INFO.phoneHref} className="hover:text-neutral-900">
              {CONTACT_INFO.phone}
            </a>
          </p>
          <p>{CONTACT_INFO.addressLine1}</p>
          <p>{CONTACT_INFO.addressLine2}</p>
        </address>
        <p>© {new Date().getFullYear()} {SITE_NAME}</p>
      </div>
    </footer>
  );
}
