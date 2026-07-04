/** Public product page copy — no paid guide body content. */

export const GUIDE_PUBLIC_SECTIONS = [
  { slug: "start-here", title: "Start Here" },
  {
    slug: "core-setup",
    title: "The Core Setup – 4 Vision Board Rebrand",
  },
  { slug: "why-color-matters", title: "Why Color Matters" },
  { slug: "color-guide", title: "The Color Guide" },
  { slug: "build-your-board-system", title: "Build Your Board System" },
  {
    slug: "what-goes-on-each-board",
    title: "What Goes on Each Board & How to Use Them",
  },
  { slug: "more-details-on-resets", title: "More Details on Resets" },
  { slug: "a-note-on-the-boards", title: "A Note on the Boards" },
] as const;

export const GUIDE_PRODUCT_TITLE =
  "Palette Plotting Guide: The 4-Board Rebrand & Vision Board Method";

/** Short line under the title on the product page. */
export const GUIDE_PRODUCT_SUBTITLE =
  "A mobile-first digital guide for setting up a color-coded vision board wall with three focus boards and one plan board.";

/** Must match the price on the Shopify product listing. */
export const GUIDE_PRICE_USD = 14.99;
export const GUIDE_PRICE_LABEL = "$14.99";

export const GUIDE_READER_PATH = "/palette-plotting-guide/read/start-here";
export const GUIDE_OPEN_SECTION_ID = "open-guide";

export const GUIDE_PRODUCT_HERO = {
  src: "/guide/hero.png",
  alt: "Yellow acrylic board with Visualize. Organize. Lock In. written in dry erase marker",
} as const;

/** Home catalog grid — same tile pattern as board colors. */
export const GUIDE_CATALOG = {
  path: "/palette-plotting-guide",
  label: "4 Vision Board Rebrand",
  priceLabel: GUIDE_PRICE_LABEL,
  thumbnail: GUIDE_PRODUCT_HERO,
} as const;

export const GUIDE_PREVIEW_DESCRIPTION = GUIDE_PRODUCT_SUBTITLE;

export const GUIDE_TAGLINE = "Visualize. Organize. Lock In.";

export const GUIDE_PRODUCT_BODY = [
  GUIDE_PRODUCT_SUBTITLE,
  "The Palette Plotting Guide walks you through the method behind the 4-board setup: how to choose your focus areas, pick board colors, separate each category, add images, statements, stickers, notes, dates, numbers, and turn the final board into a plan.",
  "Use the method with whatever materials you already have, or use it alongside acrylic boards for a cleaner wall setup.",
  "This is a digital guide/reader on paletteplot.com. No physical board is included with this product.",
] as const;

export const GUIDE_INCLUDED = [
  "The 4-board rebrand setup",
  "How to choose your three focus areas",
  "How to use the plan board",
  "Color guide for each board color",
  "What goes on each board",
  "Board placement tips",
  "Weekly and monthly reset tips",
] as const;

export const GUIDE_HIGHLIGHTS = [
  "Three focus boards plus one plan board",
  "Color-coded categories you can see at a glance",
  "Works with materials you already have",
  "Built to pair with acrylic boards for a cleaner wall setup",
  "Read on phone, tablet, or desktop",
  "One-time purchase — yours to keep",
] as const;

export const GUIDE_FAQ = [
  {
    q: "How do I get the guide?",
    a: "Add the Palette Plotting Guide to cart and check out on this site.",
  },
  {
    q: "How do I open it after I buy?",
    a: "Come back to this page, enter the email you used at checkout, and tap Open guide. The reader opens right here on paletteplot.com.",
  },
  {
    q: "How long do I have access?",
    a: "Your purchase stays with the email you used at checkout.",
  },
  {
    q: "Is a physical board included?",
    a: "No. This is a digital guide only. Use it with whatever you already have, or pair it with Palette Plot acrylic boards if you want a cleaner wall setup.",
  },
] as const;
