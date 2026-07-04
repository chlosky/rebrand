import { Link } from "react-router-dom";
import { SiteLayout } from "@/site/components/layout/SiteLayout";
import { CONTACT_INFO } from "@/site/lib/sitePolicies";
import { pageTitle, PRIVACY_POLICY_URL, SITE_NAME, SUPPORT_EMAIL } from "@/site/lib/siteBrand";
import { usePageSeo } from "@/site/lib/usePageSeo";

export default function ContactPage() {
  usePageSeo({
    title: pageTitle("Contact"),
    description:
      `Contact ${SITE_NAME} support for orders, shipping, and returns. ${SUPPORT_EMAIL} · Chicago, IL.`,
    path: "/contact",
  });

  return (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Back to shop
        </Link>
        <header className="mt-4 border-b border-neutral-200 pb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            Contact
          </h1>
        </header>
        <address className="mt-8 space-y-1 not-italic text-sm leading-relaxed text-neutral-600">
          <p className="font-semibold text-neutral-900">{CONTACT_INFO.businessName}</p>
          <p>
            <a href={`mailto:${CONTACT_INFO.email}`} className="text-neutral-900 underline">
              {CONTACT_INFO.email}
            </a>
          </p>
          <p>{CONTACT_INFO.addressLine1}</p>
          <p>{CONTACT_INFO.addressLine2}</p>
          <p>
            <a href={CONTACT_INFO.phoneHref} className="text-neutral-900 underline">
              {CONTACT_INFO.phone}
            </a>
          </p>
        </address>
        <p className="mt-8 text-sm leading-relaxed text-neutral-600">
          For order cancellation, contact us within 1 hour of checkout. For returns, see our{" "}
          <Link to="/policies/refunds" className="font-medium text-neutral-900 underline">
            Refund Policy
          </Link>
          .
        </p>
        <p className="mt-4 text-sm leading-relaxed text-neutral-600">
          For privacy requests, Meta or advertising data questions, or data deletion requests, email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}?subject=Privacy%20Request`} className="font-medium text-neutral-900 underline">
            {SUPPORT_EMAIL}
          </a>{" "}
          with the subject line “Privacy Request.” See our{" "}
          <Link to="/policies/privacy" className="font-medium text-neutral-900 underline">
            Privacy Policy
          </Link>{" "}
          ({PRIVACY_POLICY_URL}).
        </p>
      </div>
    </SiteLayout>
  );
}
