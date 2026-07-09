import { SUPPORT_EMAIL } from "@/site/lib/siteBrand";

export { SUPPORT_EMAIL };

export const CONTACT_INFO = {
  businessName: "Palette Plotting",
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
      "Palette Plotting ships acrylic wall boards to US addresses only. Processing in 1–3 business days, delivery in 5–7 business days after that.",
    lastUpdated: "June 28, 2026",
    sections: [
      {
        paragraphs: [
          "Palette Plotting ships acrylic wall boards to addresses within the United States only. We do not ship internationally at this time.",
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
          "Please double-check your shipping address at checkout. Palette Plotting is not responsible for delays or failed delivery due to incorrect or incomplete addresses. If you notice an error right after ordering, contact us as soon as possible — we will try to update the address before the order ships, but we cannot guarantee changes once fulfillment has started.",
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
          "Palette Plotting is not responsible for delays caused by the shipping carrier, incorrect shipping addresses entered at checkout, or events outside our control.",
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
      "Request a refund within 14 days of delivery. Return shipping is paid by the buyer. Cancel an order within 1 hour of purchase by contacting Palette Plotting support.",
    lastUpdated: "June 28, 2026",
    sections: [
      {
        paragraphs: [
          "We want you to love your Palette Plotting board. If something is not right, contact us and we will work with you on a fair resolution.",
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
      "How Palette Plotting collects, uses, and shares personal information — including Meta (Facebook/Instagram), TikTok, and Google advertising and measurement tools.",
    lastUpdated: "June 28, 2026",
    sections: [
      {
        paragraphs: [
          "This Privacy Policy describes how Palette Plotting (“we”, “us”, or “our”) collects, uses, discloses, and otherwise processes personal information when you visit paletteplot.com, interact with our ads on third-party platforms (including Meta/Facebook and Instagram), browse our products, or place an order.",
          "By using our website or purchasing from us, you acknowledge this policy. If you do not agree, please do not use the site.",
        ],
      },
      {
        heading: "Personal information we collect",
        paragraphs: ["When you visit, purchase from, or interact with our store, we may collect:"],
        list: [
          "Contact details such as your name, email address, phone number, billing address, and shipping address",
          "Text reminder opt-in records, phone numbers used for text reminders, opt-out status, and reminder delivery metadata when you choose SMS reminders",
          "Order information including products purchased, order value, currency, and transaction history",
          "Payment information processed securely by Shopify and its payment providers — Palette Plotting does not store full payment card numbers on our servers",
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
          "SMS opt-in consent, text reminder phone numbers, and text reminder delivery data are not sold, rented, or shared with advertising partners for marketing or cross-context behavioral advertising. We use them only to provide and manage text reminders you choose, process STOP/HELP requests, maintain consent records, and work with SMS service providers under contract.",
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
          "Advanced Matching / customer information parameters: When you provide contact or order details (such as email, name, or address), we or our service providers may send that information to Meta in hashed form (typically SHA-256) to improve event matching, attribution, and ad optimization. This does not include SMS opt-in consent or phone numbers collected specifically for text reminders.",
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
          "We do not sell personal information for monetary consideration. We may share personal information with advertising partners (including Meta, TikTok, and Google) for cross-context behavioral advertising and measurement when permitted by law and our settings. SMS opt-in consent, text reminder phone numbers, and text reminder delivery data are excluded from that advertising sharing.",
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
    metaDescription: "Terms and conditions for using the Palette Plotting website and purchasing acrylic wall boards.",
    lastUpdated: "June 28, 2026",
    sections: [
      {
        paragraphs: [
          "These Terms of Service (“Terms”) govern your access to paletteplot.com and your purchase of products from Palette Plotting. By accessing the site or placing an order, you agree to these Terms.",
        ],
      },
      {
        heading: "Online store",
        paragraphs: [
          "You must be at least 18 years old, or the age of majority in your state, to purchase from Palette Plotting. You agree to provide accurate checkout and shipping information.",
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
          "All content on this website — including text, images, logos, and product designs — is owned by Palette Plotting or its licensors and may not be copied or reused without permission.",
        ],
      },
      {
        heading: "Disclaimer and limitation of liability",
        paragraphs: [
          "Products are provided “as is” except as required by applicable law. To the fullest extent permitted by law, Palette Plotting is not liable for indirect, incidental, or consequential damages arising from your use of the site or products.",
          "Our total liability for any claim related to a product or order is limited to the amount you paid for that order.",
        ],
      },
      {
        heading: "Governing law",
        paragraphs: [
          "These Terms are governed by the laws of the United States and the state in which Palette Plotting operates, without regard to conflict-of-law rules.",
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
    title: "Terms of Service",
    metaDescription:
      "Terms of Service for Palette Plotting — a web-based visual planning workspace with boards, notes, AI assistance, reminders, and Stripe subscription billing.",
    lastUpdated: "July 8, 2026",
    sections: [
      {
        paragraphs: [
          "Effective Date: July 8, 2026",
          "Last Updated: July 8, 2026",
          "These Terms of Service (“Terms”) govern your access to and use of Palette Plotting, including our website, web app, desktop-browser experience, mobile-browser experience, account features, visual workspace tools, planning tools, AI-assisted tools, extraction tools, reminder features, paid subscriptions and related services (collectively, the “Service”).",
          "These Terms are a legal agreement between you and [Legal Company Name] (“Palette Plotting,” “we,” “us,” or “our”). By accessing or using the Service, creating an account, starting a trial, purchasing a subscription, or clicking to accept these Terms, you agree to be bound by these Terms.",
          "If you do not agree to these Terms, do not use the Service.",
        ],
      },
      {
        heading: "1. Who May Use the Service",
        paragraphs: [
          "You may use the Service only if you are legally able to enter into a binding contract with us and are not barred from using the Service under applicable law.",
          "You must be at least 18 years old to create an account, purchase a subscription, or use paid features. If you are under 18, you may not use the Service unless we separately permit it in writing and your parent or legal guardian accepts responsibility for your use.",
          "You are responsible for making sure your use of the Service complies with all laws, rules and regulations that apply to you.",
        ],
      },
      {
        heading: "2. What Palette Plotting Provides",
        paragraphs: [
          "Palette Plotting is a web-based visual planning workspace. The Service may allow users to create, edit, organize and save visual workspaces, boards, images, notes, text, digital structures, checklists, calendars, plans, dates, goals, actions, reminders and related content.",
          "The Service may include features such as:",
        ],
        list: [
          "Visual boards and board sets",
          "A planning area called The Plan",
          "Images, clippings, notes, text, sticky notes, shapes and visual structures",
          "AI-assisted layout, planning, editing, extraction, summarization or organization tools",
          "Tools that extract text, dates, action items or other information from content you upload or create",
          "Reminders, exports, calendar-related features, email reminders, text reminders or similar follow-through tools where available",
          "Account storage, workspace saving and subscription access",
        ],
      },
      {
        paragraphs: [
          "We may add, remove, modify, suspend or discontinue any part of the Service at any time.",
        ],
      },
      {
        heading: "3. Web-Based Service Only",
        paragraphs: [
          "Palette Plotting is currently offered as a web-based service accessible through desktop and mobile web browsers.",
          "Unless we expressly state otherwise:",
        ],
        list: [
          "The Service is not currently sold through Apple App Store billing",
          "The Service is not currently sold through Google Play billing",
          "Subscriptions and paid access are handled through Stripe",
          "Mobile use means use through a mobile web browser, not a native mobile app subscription system",
        ],
      },
      {
        paragraphs: [
          "We may later release native apps, app-store billing, additional platforms, integrations, or other versions of the Service. If we do, additional terms may apply.",
        ],
      },
      {
        heading: "4. Account Registration",
        paragraphs: [
          "To access certain features, you may need to create an account. You agree to provide accurate, current and complete information and to keep your account information updated.",
          "You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. You must notify us promptly if you believe your account has been compromised or used without permission.",
          "We may refuse, suspend or terminate accounts that violate these Terms, create risk for the Service or other users, or appear to involve fraud, abuse, unauthorized access or illegal activity.",
        ],
      },
      {
        heading: "5. Your Content",
        paragraphs: [
          "“User Content” means any content, materials, files, images, text, notes, boards, plans, dates, tasks, reminders, uploads, prompts, inputs, outputs, workspace content, or other materials you submit to, upload to, create in, or store through the Service.",
          "You retain ownership of your User Content, subject to the rights and licenses you grant us in these Terms.",
          "You are responsible for your User Content. You represent and warrant that:",
        ],
        list: [
          "You own your User Content or have the rights needed to use it in the Service",
          "Your User Content does not violate anyone else’s rights",
          "Your User Content does not violate these Terms or applicable law",
          "Your User Content does not include unlawful, infringing, abusive, exploitative, harmful, fraudulent, or malicious material",
        ],
      },
      {
        paragraphs: ["We do not claim ownership of your User Content."],
      },
      {
        heading: "6. License You Grant Us",
        paragraphs: [
          "To operate, maintain, improve and provide the Service, you grant us a limited, worldwide, non-exclusive, royalty-free, sublicensable and transferable license to host, store, reproduce, process, transmit, display, format, modify and otherwise use your User Content solely as necessary to:",
        ],
        list: [
          "Provide the Service to you",
          "Save and display your workspace",
          "Process uploads, images, boards, notes, plans and reminders",
          "Operate AI-assisted, extraction, search, organization and planning features",
          "Provide customer support",
          "Maintain security, backups and system integrity",
          "Comply with law and enforce these Terms",
        ],
      },
      {
        paragraphs: [
          "This license does not give us the right to sell your User Content as standalone content.",
        ],
      },
      {
        heading: "7. AI-Assisted Features",
        paragraphs: [
          "The Service may include AI-assisted features that help generate, summarize, extract, organize, classify, format or suggest content based on your inputs or workspace.",
          "AI-assisted outputs may be inaccurate, incomplete, outdated, biased, duplicative, or unsuitable for your specific situation. You are responsible for reviewing and deciding whether to use any AI-generated or AI-assisted output.",
          "AI features are provided for planning, organization, brainstorming and convenience. They are not a substitute for professional advice, including legal, financial, medical, mental health, tax, design, construction, safety, employment, academic or business advice.",
          "You agree not to rely on AI-assisted outputs as the sole basis for important decisions.",
        ],
      },
      {
        heading: "8. Extraction and Uploaded Materials",
        paragraphs: [
          "The Service may allow you to upload or process images, boards, screenshots, notes, documents or other content so the Service can extract text, dates, action items, reminders or other information.",
          "Extraction tools may misread, omit, misclassify or incorrectly interpret content. You are responsible for reviewing extracted information before relying on it, adding it to The Plan, exporting it, or creating reminders from it.",
          "You must not upload content that you do not have the right to use.",
        ],
      },
      {
        heading: "9. Reminders, Dates, Calendar and Follow-Through Features",
        paragraphs: [
          "The Service may allow you to create actions, dates, goals, calendar exports, email reminders, text reminders, or other follow-through tools.",
          "Reminders are provided for convenience only. We do not guarantee that reminders, notifications, emails, calendar files, text messages, exports, integrations, or other time-based features will be delivered, received, opened, accurate, timely, uninterrupted, or error-free.",
          "You remain responsible for your own deadlines, obligations, appointments, tasks, payments, filings, travel, work, school, health, household, business, legal and personal responsibilities.",
          "Do not rely on the Service as your only reminder system for critical matters.",
        ],
      },
      {
        heading: "10. Subscriptions, Trials and Billing",
        paragraphs: [
          "Certain features of the Service may require a paid subscription. Subscription plans, billing intervals, trial availability, prices, features and limits will be shown at checkout, on the pricing page, or in the Service.",
          "By starting a paid subscription, starting a free trial that converts to a paid subscription, or otherwise purchasing paid access, you authorize us and our payment processor to charge your payment method for the applicable fees, taxes and charges.",
        ],
      },
      {
        heading: "10.1 Stripe Billing",
        paragraphs: [
          "Palette Plotting currently uses Stripe to process payments, manage web checkout, and support web-based subscription billing.",
          "When you make a purchase, you may be redirected to a Stripe-hosted checkout, billing, customer portal, or payment page. Your payment information is processed by Stripe, not directly by Palette Plotting.",
          "Your payment may also be subject to Stripe’s own terms, policies and privacy practices.",
        ],
      },
      {
        heading: "10.2 Automatic Renewal",
        paragraphs: [
          "Subscriptions automatically renew at the end of each billing period unless canceled before renewal. By purchasing a subscription, you authorize recurring charges to your payment method until you cancel.",
          "Your billing period may be weekly, monthly, annual, or another interval shown at checkout.",
        ],
      },
      {
        heading: "10.3 Free Trials",
        paragraphs: [
          "We may offer free trials or promotional access. Trial terms will be shown at signup or checkout.",
          "Unless we state otherwise, if you start a trial that requires payment information, your subscription may automatically begin and your payment method may be charged when the trial ends unless you cancel before the trial period expires.",
          "We may modify, limit, revoke or end trial offers at any time.",
        ],
      },
      {
        heading: "10.4 Price Changes",
        paragraphs: [
          "We may change subscription prices or plan features from time to time. If required by law, we will provide notice before price changes take effect.",
          "Price changes will apply on your next billing cycle unless otherwise stated.",
        ],
      },
      {
        heading: "10.5 Taxes",
        paragraphs: [
          "Fees may be exclusive of taxes, levies, duties or similar governmental assessments. Where applicable, taxes may be calculated and charged at checkout or as otherwise required by law.",
          "You are responsible for any taxes associated with your purchase, except taxes based on our income.",
        ],
      },
      {
        heading: "11. Cancellation",
        paragraphs: [
          "You may cancel your subscription through the account settings, billing portal, customer portal, cancellation link, or other cancellation method we make available.",
          "Unless otherwise stated at cancellation, cancellation takes effect at the end of the current paid billing period. You may continue to access paid features until the end of that billing period, unless your account is terminated for violation of these Terms.",
          "Deleting your account, stopping use of the Service, removing a bookmark, leaving the website, or uninstalling a browser shortcut does not automatically cancel your subscription.",
          "You are responsible for canceling through the available billing method before renewal.",
        ],
      },
      {
        heading: "12. Refunds",
        paragraphs: [
          "Except where required by law, subscription fees are non-refundable and we do not provide refunds or credits for:",
        ],
        list: [
          "Partial billing periods",
          "Unused time",
          "Forgotten cancellations",
          "Accidental purchases",
          "Changes in use",
          "Failure to use the Service",
          "Dissatisfaction after continued access",
          "Loss of access caused by your violation of these Terms",
        ],
      },
      {
        paragraphs: [
          "We may choose to provide a refund or credit at our sole discretion. Providing a refund or credit in one situation does not require us to provide one in the future.",
          "If you believe you were charged in error, contact us at [support email].",
        ],
      },
      {
        heading: "13. Chargebacks and Payment Disputes",
        paragraphs: [
          "If you initiate a chargeback, payment dispute, reversal, or similar process, we may suspend your account or paid access while the dispute is pending.",
          "We reserve the right to contest chargebacks and provide relevant information to Stripe, banks, card networks, payment processors, or other parties involved in the dispute.",
          "Repeated chargebacks, fraudulent payment activity, or payment abuse may result in account termination.",
        ],
      },
      {
        heading: "14. Acceptable Use",
        paragraphs: ["You agree not to use the Service to:"],
        list: [
          "Violate any law, regulation, contract, or third-party right",
          "Upload, create, store, share or process content that infringes intellectual property, privacy, publicity, confidentiality, or other rights",
          "Upload malware, viruses, harmful code, spyware, tracking tools, or malicious files",
          "Attempt to gain unauthorized access to the Service or another user’s account",
          "Interfere with, disrupt, overload, scrape, crawl, reverse engineer, probe, scan, or attack the Service",
          "Bypass usage limits, subscription restrictions, authentication, billing, security, or access controls",
          "Use the Service to create, organize, promote, or facilitate unlawful activity",
          "Impersonate any person or entity",
          "Misrepresent your affiliation with any person or entity",
          "Use automated systems to create accounts or abuse the Service",
          "Resell, sublicense, rent, lease, or commercially exploit the Service without our permission",
          "Use the Service to process highly sensitive information unless we expressly permit it",
          "Use the Service to generate or store content that is abusive, harassing, exploitative, hateful, sexually exploitative, violent, fraudulent, deceptive, or otherwise harmful",
        ],
      },
      {
        paragraphs: [
          "We may investigate and take action against any suspected violation, including removing content, limiting access, suspending accounts, terminating accounts, or reporting activity to appropriate authorities.",
        ],
      },
      {
        heading: "15. Sensitive Information",
        paragraphs: [
          "The Service is not designed for storing highly sensitive information.",
          "You should not upload or store:",
        ],
        list: [
          "Social Security numbers",
          "Government ID numbers",
          "Full financial account numbers",
          "Payment card numbers outside Stripe checkout",
          "Medical records",
          "Protected health information",
          "Legal case files requiring special handling",
          "Tax files requiring special handling",
          "Passwords or security credentials",
          "Confidential third-party information you are not authorized to use",
          "Content subject to heightened regulatory requirements",
        ],
      },
      {
        paragraphs: [
          "We are not responsible for consequences arising from your decision to upload sensitive information to the Service.",
        ],
      },
      {
        heading: "16. Intellectual Property",
        paragraphs: [
          "The Service, including its software, design, interface, code, features, templates, layouts, graphics, branding, text, marks, logos, workflows, systems and other materials, is owned by us or our licensors and is protected by intellectual property and other laws.",
          "Subject to these Terms, we grant you a limited, revocable, non-exclusive, non-transferable, non-sublicensable license to access and use the Service for your personal or internal business purposes.",
          "You may not copy, modify, distribute, sell, lease, reverse engineer, decompile, attempt to extract source code, create derivative works from, or exploit the Service except as allowed by these Terms or applicable law.",
        ],
      },
      {
        heading: "17. Templates, Structures and Built-In Materials",
        paragraphs: [
          "The Service may include templates, layouts, board structures, planning structures, prompts, examples, sample copy, sample content, visual elements, calendars, checklists, stickers, decals, icons or other built-in materials.",
          "Unless otherwise stated, we own or license these materials. You may use them within the Service for your own personal or internal business planning purposes.",
          "You may not resell, redistribute, package, publish, or offer our built-in materials as standalone products, templates, files, downloads, design assets, software components, or competing services.",
        ],
      },
      {
        heading: "18. Feedback",
        paragraphs: [
          "If you submit feedback, suggestions, ideas, comments, feature requests, bug reports, or other input about the Service, you grant us the right to use, copy, modify, publish, distribute and commercialize that feedback without compensation or obligation to you.",
        ],
      },
      {
        heading: "19. Third-Party Services",
        paragraphs: [
          "The Service may rely on or link to third-party services, including payment processors, hosting providers, analytics providers, AI providers, email providers, SMS providers, calendar tools, image services, authentication providers or other tools.",
          "We are not responsible for third-party services, websites, products, policies, outages, security incidents, errors, fees, content, or practices.",
          "Your use of third-party services may be subject to separate terms and privacy policies.",
        ],
      },
      {
        heading: "20. Availability and Changes to the Service",
        paragraphs: [
          "We aim to provide a useful and reliable Service, but we do not guarantee that the Service will be available, uninterrupted, secure, error-free, or compatible with every device, browser, operating system, screen size, network, plugin, extension, or accessibility setting.",
          "We may modify, suspend, limit, discontinue or remove any feature at any time, including free features, paid features, AI features, extraction features, templates, reminders, exports, storage limits, usage limits, or integrations.",
          "We may also perform maintenance, updates, security changes, or emergency fixes that affect availability.",
        ],
      },
      {
        heading: "21. Beta Features",
        paragraphs: [
          "Some features may be labeled beta, experimental, preview, early access, test, or similar. Beta features may be less reliable, less complete, more likely to change, or discontinued without notice.",
          "You use beta features at your own risk.",
        ],
      },
      {
        heading: "22. Data Loss and Backups",
        paragraphs: [
          "We use reasonable efforts to maintain the Service, but we do not guarantee that User Content will always be available, recoverable, backed up, preserved, or free from loss.",
          "You are responsible for maintaining your own copies of important materials, exports, deadlines, plans, images and documents.",
          "We are not liable for loss of User Content, workspace data, plans, reminders, account history, or other information except to the extent required by law.",
        ],
      },
      {
        heading: "23. Account Suspension and Termination",
        paragraphs: ["We may suspend or terminate your account or access to the Service if:"],
        list: [
          "You violate these Terms",
          "Your payment fails or your subscription ends",
          "Your use creates risk for us, other users, the Service, or third parties",
          "We suspect fraud, abuse, unauthorized access, chargeback abuse, security risk, or illegal activity",
          "We are required to do so by law",
          "We discontinue the Service",
        ],
      },
      {
        paragraphs: [
          "You may stop using the Service at any time. You may request account deletion by contacting us at [support email] or through any account deletion method we make available.",
          "Termination does not relieve you of payment obligations incurred before termination.",
        ],
      },
      {
        heading: "24. Effect of Termination",
        paragraphs: [
          "When your account or subscription ends, you may lose access to paid features, saved workspaces, exports, reminders, AI features, extraction tools, or other parts of the Service.",
          "We may retain certain information as needed for legitimate business purposes, legal compliance, dispute resolution, security, fraud prevention, tax, accounting, backup, or enforcement purposes, as described in our Privacy Policy.",
          "Sections that by their nature should survive termination will survive, including ownership, licenses, payment obligations, disclaimers, limitations of liability, indemnity, dispute terms and general provisions.",
        ],
      },
      {
        heading: "25. Privacy",
        paragraphs: [
          "Your use of the Service is also governed by our Privacy Policy, which explains how we collect, use and share information.",
          "Please review our Privacy Policy at: [Privacy Policy URL].",
          "By using the Service, you acknowledge that we may collect and process information as described in the Privacy Policy.",
        ],
      },
      {
        heading: "26. Communications",
        paragraphs: [
          "By creating an account or using the Service, you agree that we may send you transactional, administrative and service-related communications, including account notices, billing notices, subscription updates, security notices, password emails, reminder emails, product notices and support messages.",
          "If you opt in to marketing communications, we may send you promotional emails or updates. You can unsubscribe from marketing emails using the unsubscribe link or other method provided.",
          "Transactional and service-related messages are not marketing messages, and you may continue to receive them as long as you maintain an account or active relationship with us.",
        ],
      },
      {
        heading: "27. No Professional Advice",
        paragraphs: [
          "The Service is provided for visual planning, organization, brainstorming, productivity and personal or business planning support.",
          "The Service does not provide legal, financial, tax, medical, mental health, therapy, academic, real estate, construction, safety, employment, investment, business, or other professional advice.",
          "You should consult qualified professionals before making decisions that require professional advice.",
        ],
      },
      {
        heading: "28. Disclaimers",
        paragraphs: [
          "THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.”",
          "TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, STATUTORY OR OTHERWISE, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, ACCURACY, AVAILABILITY, RELIABILITY, SECURITY, QUIET ENJOYMENT AND ERROR-FREE OPERATION.",
          "WE DO NOT WARRANT THAT:",
        ],
        list: [
          "THE SERVICE WILL MEET YOUR REQUIREMENTS",
          "THE SERVICE WILL BE UNINTERRUPTED, SECURE, TIMELY, ERROR-FREE OR AVAILABLE",
          "WORKSPACES, REMINDERS, EXPORTS, EXTRACTIONS OR AI OUTPUTS WILL BE ACCURATE, COMPLETE OR RELIABLE",
          "DEFECTS WILL BE CORRECTED",
          "USER CONTENT WILL NEVER BE LOST",
          "THE SERVICE WILL BE FREE OF VIRUSES, MALWARE OR HARMFUL COMPONENTS",
          "ANY PARTICULAR RESULT, PLAN, OUTCOME, GOAL, PROJECT, DEADLINE, FOLLOW-THROUGH, PRODUCTIVITY IMPROVEMENT, BUSINESS RESULT OR PERSONAL RESULT WILL OCCUR",
        ],
      },
      {
        paragraphs: [
          "Some jurisdictions do not allow certain disclaimers, so some of the above may not apply to you.",
        ],
      },
      {
        heading: "29. Limitation of Liability",
        paragraphs: [
          "TO THE MAXIMUM EXTENT PERMITTED BY LAW, PALETTE PLOTTING AND ITS OWNERS, OFFICERS, DIRECTORS, EMPLOYEES, CONTRACTORS, AGENTS, AFFILIATES, LICENSORS, SERVICE PROVIDERS AND SUPPLIERS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE, GOODWILL, DATA, CONTENT, BUSINESS, OPPORTUNITY, USE, OR OTHER INTANGIBLE LOSSES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.",
          "TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THE SERVICE OR THESE TERMS WILL NOT EXCEED THE GREATER OF:",
        ],
        list: [
          "The amount you paid to us for the Service in the three months before the event giving rise to the claim; or",
          "$100.",
        ],
      },
      {
        paragraphs: [
          "Some jurisdictions do not allow certain limitations of liability, so some of the above may not apply to you.",
        ],
      },
      {
        heading: "30. Indemnification",
        paragraphs: [
          "You agree to defend, indemnify and hold harmless Palette Plotting and its owners, officers, directors, employees, contractors, agents, affiliates, licensors, service providers and suppliers from and against any claims, damages, losses, liabilities, costs and expenses, including reasonable attorneys’ fees, arising out of or relating to:",
        ],
        list: [
          "Your use of the Service",
          "Your User Content",
          "Your violation of these Terms",
          "Your violation of applicable law",
          "Your violation of another person’s rights",
          "Your misuse of AI, extraction, reminder, export, or planning features",
          "Your fraud, misconduct, negligence, or unauthorized activity",
        ],
      },
      {
        paragraphs: [
          "We reserve the right to control the defense of any matter subject to indemnification. You agree to cooperate with our defense.",
        ],
      },
      {
        heading: "31. Copyright Complaints",
        paragraphs: [
          "If you believe content on the Service infringes your copyright, you may send a notice to:",
          "Copyright Agent: [Name or Legal Department]",
          "Email: [copyright email]",
          "Address: [mailing address]",
          "Your notice should include:",
        ],
        list: [
          "Your physical or electronic signature",
          "Identification of the copyrighted work you claim was infringed",
          "Identification of the allegedly infringing material and where it is located",
          "Your contact information",
          "A statement that you have a good-faith belief that the use is not authorized",
          "A statement that the information in your notice is accurate and, under penalty of perjury, that you are authorized to act on behalf of the copyright owner",
        ],
      },
      {
        paragraphs: [
          "We may remove or disable access to allegedly infringing material and may terminate repeat infringers where appropriate.",
        ],
      },
      {
        heading: "32. Governing Law",
        paragraphs: [
          "These Terms are governed by the laws of the State of [State], without regard to conflict-of-law principles.",
          "The governing law and venue provisions may not deprive you of mandatory consumer protections that apply under the law of your place of residence.",
        ],
      },
      {
        heading: "33. Dispute Resolution",
        paragraphs: [
          "Before filing a claim, you agree to first contact us at [support email] and attempt to resolve the dispute informally. You must include your name, account email, a description of the dispute and the relief you seek.",
          "If we cannot resolve the dispute informally within 30 days, either party may proceed as allowed under these Terms.",
        ],
      },
      {
        heading: "34. Arbitration Agreement",
        paragraphs: [
          "Note: Have counsel review this section before publishing.",
          "To the maximum extent permitted by law, you and Palette Plotting agree that any dispute, claim, or controversy arising out of or relating to these Terms or the Service will be resolved by binding individual arbitration, rather than in court, except that either party may bring qualifying claims in small claims court.",
          "The arbitration will be conducted by [AAA/JAMS/Other Provider] under its applicable consumer or commercial arbitration rules.",
          "The arbitration will take place in [County, State], unless the arbitrator allows remote proceedings or applicable law requires otherwise.",
          "The arbitrator may award the same damages and relief as a court on an individual basis, subject to these Terms.",
        ],
      },
      {
        heading: "35. Class Action Waiver",
        paragraphs: [
          "To the maximum extent permitted by law, you and Palette Plotting agree that each may bring claims against the other only in an individual capacity, and not as a plaintiff or class member in any class, collective, consolidated, private attorney general, or representative proceeding.",
          "The arbitrator may not consolidate claims or preside over any class or representative proceeding unless both parties agree in writing.",
        ],
      },
      {
        heading: "36. Exceptions to Arbitration",
        paragraphs: ["Nothing in these Terms prevents either party from seeking:"],
        list: [
          "Relief in small claims court where available",
          "Temporary or preliminary injunctive relief in court to protect intellectual property, confidential information, security, or unauthorized access",
          "Relief that cannot be waived or limited under applicable law",
        ],
      },
      {
        heading: "37. Changes to These Terms",
        paragraphs: [
          "We may update these Terms from time to time.",
          "If we make material changes, we may notify you by email, in-app notice, website notice, or other reasonable method. The updated Terms will be effective as of the date stated at the top unless otherwise stated.",
          "Your continued use of the Service after updated Terms become effective means you accept the updated Terms.",
          "If you do not agree to the updated Terms, you must stop using the Service and cancel any subscription before the next renewal.",
        ],
      },
      {
        heading: "38. Changes to Pricing or Paid Features",
        paragraphs: [
          "We may change pricing, subscription plans, trial offers, feature availability, usage limits, storage limits, AI usage limits, reminder limits, or plan benefits from time to time.",
          "Where required by law, we will provide notice before material pricing changes take effect.",
          "Continued use of paid features after changes take effect means you accept those changes.",
        ],
      },
      {
        heading: "39. Assignment",
        paragraphs: [
          "You may not assign or transfer these Terms, your account, or your rights under these Terms without our prior written consent.",
          "We may assign or transfer these Terms in connection with a merger, acquisition, financing, sale of assets, corporate reorganization, change of control, or by operation of law.",
        ],
      },
      {
        heading: "40. Severability",
        paragraphs: [
          "If any provision of these Terms is found invalid, unlawful, or unenforceable, that provision will be enforced to the maximum extent permitted, and the remaining provisions will remain in full force and effect.",
        ],
      },
      {
        heading: "41. No Waiver",
        paragraphs: [
          "Our failure to enforce any provision of these Terms does not waive our right to enforce that provision later.",
        ],
      },
      {
        heading: "42. Entire Agreement",
        paragraphs: [
          "These Terms, together with our Privacy Policy and any additional terms presented to you for specific features or purchases, are the entire agreement between you and Palette Plotting regarding the Service.",
          "They supersede any prior or contemporaneous agreements, communications, or understandings regarding the Service.",
        ],
      },
      {
        heading: "43. Contact",
        paragraphs: [
          "Questions about these Terms may be sent to:",
          "[Legal Company Name]",
          "Email: [support/legal email]",
          "Mailing Address: [Business mailing address]",
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
          'This Privacy Policy describes how Palette Plotting ("Palette Plotting," "we," "us," or "our") handles personal information when you use the Palette Plotting software, create an account, subscribe, or contact support.',
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
          "SMS opt-in consent, text reminder phone numbers, opt-out status, and related delivery records when you choose text reminders",
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
          "SMS opt-in consent, text reminder phone numbers, and text reminder delivery data are not sold, rented, or shared with advertising partners for marketing or cross-context behavioral advertising. We use them only to provide and manage text reminders you choose, process STOP/HELP requests, maintain consent records, and work with SMS service providers under contract.",
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
