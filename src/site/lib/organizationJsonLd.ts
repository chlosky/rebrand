import { CONTACT_INFO } from "@/site/lib/sitePolicies";
import { SITE_NAME, SITE_ORIGIN } from "@/site/lib/siteBrand";

export const ORGANIZATION_JSON_LD_SCRIPT_ID = "palette-plot-org-json-ld";

/** Organization schema for Google Merchant Center / Shopping site verification. */
export const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_ORIGIN,
  email: CONTACT_INFO.email,
  telephone: CONTACT_INFO.phoneE164,
  address: {
    "@type": "PostalAddress",
    streetAddress: CONTACT_INFO.streetAddress,
    addressLocality: CONTACT_INFO.addressLocality,
    addressRegion: CONTACT_INFO.addressRegion,
    postalCode: CONTACT_INFO.postalCode,
    addressCountry: CONTACT_INFO.addressCountry,
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: CONTACT_INFO.email,
    telephone: CONTACT_INFO.phoneE164,
    areaServed: "US",
    availableLanguage: ["English"],
  },
} as const;
