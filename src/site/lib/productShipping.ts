import { SITE_ORIGIN } from "@/site/lib/siteBrand";

/** Product-page shipping copy — must match /policies/shipping and Shopify checkout for Google Merchant Center. */
export const PRODUCT_SHIPPING = {
  costLabel: "Calculated at checkout",
  costNote: "US carrier rates based on your address, package weight, and selected service.",
  destination: "United States only",
  processingTime: "1–3 business days",
  deliveryTime: "5–7 business days after your order ships",
  policyPath: "/policies/shipping",
  policyUrl: `${SITE_ORIGIN}/policies/shipping`,
} as const;

export function productOfferShippingJsonLd() {
  return {
    "@type": "OfferShippingDetails",
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: "US",
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: 1,
        maxValue: 3,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: 5,
        maxValue: 7,
        unitCode: "DAY",
      },
    },
  };
}
