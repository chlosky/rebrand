import { SUPPORT_EMAIL } from "@/site/lib/siteBrand";

export { SUPPORT_EMAIL };

export const CONTACT_INFO = {
  businessName: "palette plot",
  email: SUPPORT_EMAIL,
  streetAddress: "1 N. State Street Suite 1500",
  addressLine1: "1 N. State Street Suite 1500",
  addressLine2: "Chicago, IL 60602",
  addressLocality: "Chicago",
  addressRegion: "IL",
  postalCode: "60602",
  addressCountry: "US",
  phone: "(464) 249-0247",
  phoneHref: "tel:+14642490247",
  phoneE164: "+14642490247",
} as const;

export type PolicySlug =
  | "shipping"
  | "refunds"
  | "privacy"
  | "terms"
  | "app-terms"
  | "app-privacy"
  | "acceptable-use"
  | "billing";

export type PolicySection = {
  heading?: string;
  paragraphs: string[];
  list?: string[];
};

export type SitePolicy = {
  slug: PolicySlug;
  title: string;
  metaDescription: string;
  lastUpdated: string;
  sections: PolicySection[];
};

export const SITE_POLICIES: Record<PolicySlug, SitePolicy> = {
  shipping: {
    slug: "shipping",
    title: "Shipping Policy",
    metaDescription:
      "palette plot ships acrylic wall boards to US addresses only. Processing in 1–3 business days, delivery in 5–7 business days after that.",
    lastUpdated: "June 28, 2026",
    sections: [
      {
        paragraphs: [
          "palette plot ships acrylic wall boards to addresses within the United States only. We do not ship internationally at this time.",
          "We do not ship to P.O. boxes if your carrier cannot deliver oversized packages to that address — use a physical street address where possible.",
        ],
      },
      {
        heading: "Processing time",
        paragraphs: [
          "Orders are processed within 1–3 business days after you place your order (Monday–Friday, excluding U.S. federal holidays). You will receive an email confirmation when your order is placed and another when it ships.",
        ],
      },
      {
        heading: "Delivery time",
        paragraphs: [
          "Most orders arrive within 5–7 business days after they ship. Delivery times are estimates and may vary based on your location, carrier delays, weather, or peak shipping periods.",
        ],
      },
      {
        heading: "Shipping cost",
        paragraphs: [
          "Shipping cost is calculated at checkout using carrier rates based on your delivery address, package weight, and the shipping service you select. The rate shown at checkout is what you pay — no shipping code is required.",
        ],
      },
      {
        heading: "What we ship",
        paragraphs: [
          "Each order includes one 24×36 in acrylic wall board in the color you selected, 4 standoffs, and a sticker sheet. Boards are packaged to protect the acrylic surface and corners in transit.",
        ],
      },
      {
        heading: "Tracking",
        paragraphs: [
          "When your order ships, you will receive a tracking number by email when available from the carrier. Tracking may take up to 24 hours to show movement after the label is created.",
        ],
      },
      {
        heading: "Address accuracy",
        paragraphs: [
          "Please double-check your shipping address at checkout. palette plot is not responsible for delays or failed delivery due to incorrect or incomplete addresses. If you notice an error right after ordering, contact us as soon as possible — we will try to update the address before the order ships, but we cannot guarantee changes once fulfillment has started.",
        ],
      },
      {
        heading: "Undeliverable or returned packages",
        paragraphs: [
          "If a package is returned to us as undeliverable (wrong address, refused delivery, etc.), we will contact you to arrange reshipment. Additional shipping charges may apply for resending the order.",
        ],
      },
      {
        heading: "Damaged or lost shipments",
        paragraphs: [
          "If your board arrives damaged, contact us within 14 days of delivery with your order number and photos of the packaging and product. We will work with you on a replacement or refund as appropriate.",
          "If tracking shows delivered but you did not receive the package, check with household members and neighbors, then contact the carrier. If the issue is not resolved, email us and we will help investigate.",
          "palette plot is not responsible for delays caused by the shipping carrier, incorrect shipping addresses entered at checkout, or events outside our control.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [
          `Questions about shipping? Email ${CONTACT_INFO.email} and include your order number. You can also reach us at ${CONTACT_INFO.phone}.`,
          `${CONTACT_INFO.addressLine1}, ${CONTACT_INFO.addressLine2}`,
        ],
      },
    ],
  },
  refunds: {
    slug: "refunds",
    title: "Refund Policy",
    metaDescription:
      "Request a refund within 14 days of delivery. Return shipping is paid by the buyer. Cancel an order within 1 hour of purchase by contacting palette plot support.",
    lastUpdated: "June 28, 2026",
    sections: [
      {
        paragraphs: [
          "We want you to love your palette plot board. If something is not right, contact us and we will work with you on a fair resolution.",
        ],
      },
      {
        heading: "Order cancellation",
        paragraphs: [
          "You may request cancellation within 1 hour of placing your order by emailing support@paletteplot.com with your order number.",
          "After 1 hour, your order may already be in processing and cannot be guaranteed cancelled. Once an order has shipped, cancellation is no longer available — please see returns below.",
        ],
      },
      {
        heading: "Returns and refunds",
        paragraphs: [
          "You may request a refund within 14 days of delivery for items that are unused, undamaged, and in their original packaging.",
          "Return shipping costs are paid by the buyer. We will provide return instructions after your return request is approved.",
          "To start a return or refund request, email support@paletteplot.com with your order number and a brief description of the issue. We will reply with next steps.",
          "Approved refunds are issued to your original payment method. Please allow 5–10 business days for your bank or card issuer to post the credit after we process the refund.",
        ],
      },
      {
        heading: "Non-returnable items",
        paragraphs: [
          "Custom or personalized orders, items marked final sale, and products that show signs of use, mounting, or damage after delivery may not be eligible for refund.",
        ],
      },
      {
        heading: "Damaged or incorrect orders",
        paragraphs: [
          "If your board arrives damaged or you received the wrong item, contact us at support@paletteplot.com within 14 days of delivery with photos. We will replace or refund eligible orders at no additional shipping cost to you.",
        ],
      },
    ],
  },
  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    metaDescription:
      "How palette plot collects, uses, and shares personal information — including Meta (Facebook/Instagram), TikTok, and Google advertising and measurement tools.",
    lastUpdated: "June 28, 2026",
    sections: [
      {
        paragraphs: [
          "This Privacy Policy describes how palette plot (“we”, “us”, or “our”) collects, uses, discloses, and otherwise processes personal information when you visit paletteplot.com, interact with our ads on third-party platforms (including Meta/Facebook and Instagram), browse our products, or place an order.",
          "By using our website or purchasing from us, you acknowledge this policy. If you do not agree, please do not use the site.",
        ],
      },
      {
        heading: "Personal information we collect",
        paragraphs: ["When you visit, purchase from, or interact with our store, we may collect:"],
        list: [
          "Contact details such as your name, email address, phone number, billing address, and shipping address",
          "Order information including products purchased, order value, currency, and transaction history",
          "Payment information processed securely by Shopify and its payment providers — palette plot does not store full payment card numbers on our servers",
          "Device and usage information such as browser type, operating system, IP address, pages viewed, referring URLs, and approximate location derived from IP",
          "Advertising and analytics identifiers such as cookie IDs, session IDs, click IDs (for example fbclid/fbc from Meta ads), and similar technology used to measure marketing performance",
          "Hashed or unhashed customer information submitted at checkout or through forms, which may be used for advertising measurement and matching when permitted by law and our settings",
          "Communications you send to us, including support emails",
        ],
      },
      {
        heading: "How we use your information",
        paragraphs: ["We use personal information to:"],
        list: [
          "Process and fulfill orders, including shipping to US addresses",
          "Send order confirmations, shipping updates, and customer support replies",
          "Prevent fraud and maintain the security of our website",
          "Improve our website, products, and customer experience",
          "Measure, attribute, and optimize our advertising and marketing (including on Meta, TikTok, and Google)",
          "Build and measure custom audiences, retargeting, and lookalike audiences where permitted",
          "Comply with legal obligations and enforce our terms",
        ],
      },
      {
        heading: "Sharing your information",
        paragraphs: [
          "We share personal information with service providers and advertising partners only as needed to operate our business, measure marketing, and deliver ads. We do not sell your personal information for money.",
          "Under some US state privacy laws, sharing data with advertising partners for cross-context behavioral advertising may be treated separately from a “sale.” See “US state privacy rights” below.",
        ],
        list: [
          "Shopify, our ecommerce platform, to process orders, payments, and checkout events",
          "Meta Platforms, Inc. (Facebook and Instagram), when we use Meta Business Tools such as the Meta Pixel, Meta Conversions API, Advanced Matching, and related measurement products — see the Meta section below",
          "TikTok and Google, when we use their pixels, tags, or server-side measurement tools",
          "Shipping carriers to deliver your order",
          "Email, hosting, analytics, and infrastructure providers that help us run the site",
          "Authorities when required by law or to protect our rights",
        ],
      },
      {
        heading: "Meta (Facebook and Instagram) advertising and measurement",
        paragraphs: [
          "We use Meta Business Tools to advertise on Meta platforms, measure ad performance, attribute purchases to ads, and improve campaign delivery. This includes browser-based tools (such as the Meta Pixel) and server-side tools (such as the Meta Conversions API), including through Shopify and other integrations.",
          "Depending on your interactions and our configuration, Meta may receive event data (for example PageView, ViewContent, AddToCart, InitiateCheckout, and Purchase), device and browser information (such as IP address, user agent, and cookie identifiers including _fbp and _fbc), page URLs, and order value/currency.",
          "Advanced Matching / customer information parameters: When you provide contact or order details (such as email, phone, name, or address), we or our service providers may send that information to Meta in hashed form (typically SHA-256) to improve event matching, attribution, and ad optimization. This supports maximum data sharing and match quality when enabled in Meta Events Manager.",
          "Advanced Aggregated Measurement (AAM) and related aggregated reporting: When individual-level tracking or attribution is limited (for example by browser or device settings), Meta may provide aggregated or modeled measurement so we can understand ad performance without receiving all individual-level details. We use these reports to measure return on ad spend and improve campaigns.",
          "Meta processes this information under its own terms and policies, including the Meta Business Tools Terms (https://www.facebook.com/legal/terms/businesstools) and Meta Privacy Policy (https://www.facebook.com/privacy/policy/).",
          "You can learn more about Meta ads and control some Meta uses of your information at https://www.facebook.com/settings?tab=ads. You may also use industry opt-out tools such as the Digital Advertising Alliance (https://optout.aboutads.info/) and the Network Advertising Initiative (https://optout.networkadvertising.org/).",
        ],
      },
      {
        heading: "Other cookies, pixels, and analytics",
        paragraphs: [
          "Our website uses cookies, pixels, tags, and similar technologies to remember preferences, measure traffic, and support advertising.",
          "Tools we use or may use include Google Analytics (site measurement), TikTok Pixel and TikTok Events API (advertising and purchase measurement), and Meta Business Tools as described above.",
          "Shopify checkout may also load partner scripts related to your order and payment processing.",
          "You can control cookies through your browser settings. Blocking cookies may affect site functionality and how accurately we can measure advertising.",
        ],
      },
      {
        heading: "US state privacy rights",
        paragraphs: [
          "If you reside in California, Colorado, Connecticut, Virginia, Texas, Oregon, or other US states with similar privacy laws, you may have the right to know what personal information we collect, request deletion or correction, and opt out of certain processing.",
          "We do not sell personal information for monetary consideration. We may share personal information with advertising partners (including Meta, TikTok, and Google) for cross-context behavioral advertising and measurement when permitted by law and our settings.",
          "To submit a privacy request — including opt-out of sharing for cross-context behavioral advertising — email support@paletteplot.com with the subject line “Privacy Request” and your name, email, and the request type. We will verify and respond as required by applicable law.",
        ],
      },
      {
        heading: "Data retention",
        paragraphs: [
          "We retain order and account-related information for as long as needed to fulfill orders, provide support, measure advertising, meet legal requirements, and resolve disputes. Data shared with Meta or other ad partners is also subject to their retention policies.",
        ],
      },
      {
        heading: "Your choices",
        paragraphs: [
          "You may request access to, correction of, or deletion of personal information we hold about you by contacting support@paletteplot.com. We may need to retain certain records for legal, accounting, or fraud-prevention purposes.",
          "You may opt out of marketing emails at any time using the unsubscribe link in those messages.",
          "For Meta-related data, you may also adjust ad preferences in your Meta account settings and contact us if you want us to stop sharing your information with Meta for advertising measurement, subject to legal and technical limits.",
        ],
      },
      {
        heading: "Children",
        paragraphs: [
          "Our website is not intended for children under 13, and we do not knowingly collect personal information from children.",
        ],
      },
      {
        heading: "Changes to this policy",
        paragraphs: [
          "We may update this Privacy Policy from time to time. The “Last updated” date at the top of this page will reflect the latest version. Continued use of the site after changes constitutes acceptance of the updated policy.",
        ],
      },
      {
        heading: "Contact us",
        paragraphs: [
          "Questions about this Privacy Policy, Meta data sharing, or your personal information:",
          `${CONTACT_INFO.businessName} · ${CONTACT_INFO.email} · ${CONTACT_INFO.phone}`,
          `${CONTACT_INFO.addressLine1}, ${CONTACT_INFO.addressLine2}`,
          "Privacy policy URL for advertising platform verification: https://paletteplot.com/policies/privacy",
        ],
      },
    ],
  },
  terms: {
    slug: "terms",
    title: "Terms of Service",
    metaDescription: "Terms and conditions for using the palette plot website and purchasing acrylic wall boards.",
    lastUpdated: "June 28, 2026",
    sections: [
      {
        paragraphs: [
          "These Terms of Service (“Terms”) govern your access to paletteplot.com and your purchase of products from palette plot. By accessing the site or placing an order, you agree to these Terms.",
        ],
      },
      {
        heading: "Online store",
        paragraphs: [
          "You must be at least 18 years old, or the age of majority in your state, to purchase from palette plot. You agree to provide accurate checkout and shipping information.",
          "We reserve the right to refuse or cancel any order, limit quantities, or correct pricing errors.",
        ],
      },
      {
        heading: "Products and pricing",
        paragraphs: [
          "Product descriptions, colors, and images are provided for clarity. Minor variations in color or finish may occur due to screen settings, lighting, or manufacturing.",
          "Prices are listed in US dollars. We may change prices at any time; the price charged is the price shown at checkout when you complete your purchase.",
        ],
      },
      {
        heading: "Orders, payment, and cancellation",
        paragraphs: [
          "Orders are processed through Shopify. Payment is due at checkout.",
          "You may request order cancellation within 1 hour of placing your order by emailing support@paletteplot.com. After that window, your order may enter processing and cannot be guaranteed cancelled.",
        ],
      },
      {
        heading: "Shipping",
        paragraphs: [
          "We ship to United States addresses only. See our Shipping Policy for processing (1–3 business days) and delivery (5–7 business days after shipping) timelines.",
        ],
      },
      {
        heading: "Returns and refunds",
        paragraphs: [
          "See our Refund Policy for eligibility, the 14-day return window, return shipping paid by the buyer, and how to contact us about damaged or incorrect orders.",
        ],
      },
      {
        heading: "Third-party services and advertising",
        paragraphs: [
          "Our website integrates with third-party services including Shopify (orders and checkout), Meta (Facebook/Instagram advertising and measurement), TikTok, and Google Analytics. Your use of the site is also subject to those providers’ terms and privacy policies where applicable.",
          "See our Privacy Policy at https://paletteplot.com/policies/privacy for how we collect, share, and use personal information for advertising, including Meta Advanced Matching and aggregated measurement.",
        ],
      },
      {
        heading: "Intellectual property",
        paragraphs: [
          "All content on this website — including text, images, logos, and product designs — is owned by palette plot or its licensors and may not be copied or reused without permission.",
        ],
      },
      {
        heading: "Disclaimer and limitation of liability",
        paragraphs: [
          "Products are provided “as is” except as required by applicable law. To the fullest extent permitted by law, palette plot is not liable for indirect, incidental, or consequential damages arising from your use of the site or products.",
          "Our total liability for any claim related to a product or order is limited to the amount you paid for that order.",
        ],
      },
      {
        heading: "Governing law",
        paragraphs: [
          "These Terms are governed by the laws of the United States and the state in which palette plot operates, without regard to conflict-of-law rules.",
        ],
      },
      {
        heading: "Changes",
        paragraphs: [
          "We may update these Terms at any time by posting a revised version on this page. Your continued use of the site after changes constitutes acceptance.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [
          `Questions about these Terms: ${CONTACT_INFO.email} · ${CONTACT_INFO.phone}`,
          `${CONTACT_INFO.addressLine1}, ${CONTACT_INFO.addressLine2}`,
        ],
      },
    ],
  },
  "app-terms": {
    slug: "app-terms",
    title: "Terms of Use",
    metaDescription:
      "Terms of use for the Palette Plotting software — Vision boards, Action planning, workspace, and related subscription features.",
    lastUpdated: "July 7, 2026",
    sections: [
      {
        paragraphs: [
          'These Terms of Use ("Terms") govern your access to and use of the Palette Plotting software and related services (the "Service"), operated by Palette Plotting LLC ("Palette Plotting," "we," "us," or "our"). By creating an account or using the Service, you agree to these Terms.',
          "You must be at least 18 years old to use the Service.",
        ],
      },
      {
        heading: "The Service",
        paragraphs: [
          "Palette Plotting is a digital planning and vision-board platform. Depending on your plan, the Service may include Vision boards, Action planning and reminders, a workspace (library, image library, and projects), AI-assisted guidance, and related account features.",
          "Palette Plotting is not medical, psychological, legal, or financial advice. Automated or AI-assisted responses are supplemental tools only.",
        ],
      },
      {
        heading: "Accounts and acceptable use",
        paragraphs: [
          "You are responsible for your account credentials and for activity under your account. You agree to provide accurate information and to use the Service lawfully and in line with our Acceptable Use Policy.",
          "We may suspend or terminate access if you violate these Terms or misuse the Service.",
        ],
      },
      {
        heading: "Subscriptions and billing",
        paragraphs: [
          "Paid features may require an active subscription. Pricing, renewal, and cancellation terms are described at checkout and in our Billing & Refunds policy.",
          "Mobile purchases may be billed through Apple or Google; web purchases may be billed through our checkout provider. Platform billing terms may also apply.",
        ],
      },
      {
        heading: "Your content",
        paragraphs: [
          "You retain ownership of content you upload or create in the Service. You grant Palette Plotting a limited license to host, process, and display that content as needed to operate the Service, including backups and support.",
          "You are responsible for ensuring you have rights to any images or materials you upload.",
        ],
      },
      {
        heading: "Intellectual property",
        paragraphs: [
          "Palette Plotting, its branding, software, templates, and library materials are owned by Palette Plotting or its licensors and may not be copied or reused except as allowed by the Service.",
        ],
      },
      {
        heading: "Disclaimer and limitation of liability",
        paragraphs: [
          'The Service is provided "as is" to the fullest extent permitted by law. Palette Plotting is not liable for indirect or consequential damages. Our total liability for any claim relating to the Service is limited to the amount you paid us for the Service in the twelve months before the claim, or one hundred US dollars if you have not paid us.',
        ],
      },
      {
        heading: "Changes and contact",
        paragraphs: [
          "We may update these Terms by posting a revised version. Continued use after changes constitutes acceptance.",
          `Questions: ${CONTACT_INFO.email}`,
        ],
      },
    ],
  },
  "app-privacy": {
    slug: "app-privacy",
    title: "Privacy Policy",
    metaDescription:
      "How Palette Plotting collects, uses, and protects personal information in the software and related account features.",
    lastUpdated: "July 7, 2026",
    sections: [
      {
        paragraphs: [
          'This Privacy Policy describes how Palette Plotting LLC ("Palette Plotting," "we," "us," or "our") handles personal information when you use the Palette Plotting software, create an account, subscribe, or contact support.',
        ],
      },
      {
        heading: "Information we collect",
        paragraphs: ["We may collect:"],
        list: [
          "Account information such as name, username, email address, and phone number when you provide it",
          "Profile, workspace, board, and support content you create or upload",
          "Subscription and billing-related information processed by Apple, Google, Stripe, RevenueCat, or similar providers — we do not store full payment card numbers",
          "Device, app usage, and log information needed to secure and improve the Service",
          "Communications you send through support or feedback forms",
          "Reminder delivery metadata when you enable email, SMS, or calendar-related features",
        ],
      },
      {
        heading: "How we use information",
        paragraphs: ["We use personal information to:"],
        list: [
          "Provide and maintain the Service, including Vision, Action, and workspace features",
          "Process subscriptions, authenticate users, and prevent fraud",
          "Send service messages, support replies, and reminders you request",
          "Improve reliability, security, and product experience",
          "Comply with law and enforce our terms",
        ],
      },
      {
        heading: "AI and optional data training",
        paragraphs: [
          "Some features use automated or AI-assisted processing to provide guidance, analysis, or suggestions within the Service.",
          "If you opt in to data training in your account settings, anonymized or aggregated usage may be used to improve models and product quality. You may turn this off in settings.",
        ],
      },
      {
        heading: "Sharing",
        paragraphs: [
          "We do not sell your personal information. We share information with service providers that help us operate the Service (hosting, authentication, billing, email, SMS, analytics, and support tools) under appropriate contractual protections, and when required by law.",
        ],
      },
      {
        heading: "Retention and your choices",
        paragraphs: [
          "We retain information while your account is active and as needed for billing, support, security, and legal obligations.",
          "You may update profile information in Your Account, manage marketing and reminder preferences in settings, and request account deletion in settings. Deletion is scheduled according to the in-app flow.",
          `Privacy requests: ${CONTACT_INFO.email}`,
        ],
      },
      {
        heading: "Children and changes",
        paragraphs: [
          "The Service is not intended for children under 13.",
          "We may update this Privacy Policy from time to time. The date at the top reflects the latest version.",
        ],
      },
    ],
  },
  "acceptable-use": {
    slug: "acceptable-use",
    title: "Acceptable Use Policy",
    metaDescription: "Rules for using Palette Plotting respectfully and lawfully.",
    lastUpdated: "July 7, 2026",
    sections: [
      {
        paragraphs: [
          "This Acceptable Use Policy applies to your use of Palette Plotting. It supplements our Terms of Use.",
        ],
      },
      {
        heading: "You may not",
        paragraphs: ["When using the Service, you may not:"],
        list: [
          "Harass, threaten, or abuse others or our staff",
          "Upload unlawful content or content you do not have rights to use",
          "Attempt to break, scrape, reverse engineer, or overload the Service",
          "Use the Service for spam, fraud, or impersonation",
          "Use automated features to generate harmful, illegal, or abusive material",
          "Share account access in a way that violates these rules",
        ],
      },
      {
        heading: "Enforcement",
        paragraphs: [
          "We may remove content, limit features, or suspend or terminate accounts that violate this policy or create risk for other users or for Palette Plotting.",
          `Report concerns: ${CONTACT_INFO.email}`,
        ],
      },
    ],
  },
  billing: {
    slug: "billing",
    title: "Billing & Refunds",
    metaDescription: "Subscription billing, cancellation, and refund information for Palette Plotting.",
    lastUpdated: "July 7, 2026",
    sections: [
      {
        paragraphs: [
          "This policy describes billing and refunds for Palette Plotting software subscriptions and related paid features.",
        ],
      },
      {
        heading: "Subscriptions",
        paragraphs: [
          "Paid plans renew automatically unless cancelled before the renewal date. Available plans and prices are shown at checkout or in the app store listing at the time of purchase.",
          "You can manage or cancel a subscription through Your Account billing settings, or through Apple App Store / Google Play subscription management when you purchased on mobile.",
        ],
      },
      {
        heading: "Refunds",
        paragraphs: [
          "Apple App Store and Google Play purchases are subject to each platform's refund policies and billing terms.",
          "For web purchases, refund requests are considered at Palette Plotting's discretion. Contact support@paletteplot.com with your account email and purchase details.",
          "Nothing in this policy limits any non-waivable consumer rights that apply where you live.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [`Billing questions: ${CONTACT_INFO.email}`],
      },
    ],
  },
};

export function policyFromSlug(slug: string | undefined): SitePolicy | undefined {
  if (!slug) return undefined;
  return SITE_POLICIES[slug as PolicySlug];
}
