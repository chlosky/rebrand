/** Shared catalog and copy for palette plotting acrylic board product landing pages. */

import { BOARD_COLOR_CATALOG_IMAGES } from "@/site/lib/boardColorCatalog";
import { BOARD_COLORS, type BoardColorId } from "@/site/lib/boardColors";
import { SITE_NAME } from "@/site/lib/siteBrand";

export type { BoardColorId } from "@/site/lib/boardColors";
export { ALL_BOARD_COLOR_IDS, BOARD_COLORS } from "@/site/lib/boardColors";

export type BoardPageSlug =
  | "dry-erase-boards"
  | "home-decor-boards"
  | "vision-boards"
  | "neon-boards";

export const BOARD_PRICE_LABEL = "From $99.99";
export const BOARD_SIZE_LABEL = "24×36";

/** Matches Shopify product title — last segment is board color only (never standoff/variant options). */
export const BOARD_PRODUCT_TITLE_PREFIX =
  "Acrylic Wall Board | Home Office Plan | Organization | Vision Board | Moodboarding | Home Plan | To Do List";

export function productDisplayTitle(color?: BoardColorId): string {
  const colorLabel = color ? BOARD_COLORS[color]?.label : undefined;
  return `${BOARD_PRODUCT_TITLE_PREFIX} | ${colorLabel ?? "Multicolor"}`;
}

export function productPageMetaTitle(color?: BoardColorId): string {
  return `${productDisplayTitle(color)} | ${SITE_NAME}`;
}

export const SHARED_INCLUDED = [
  "1 acrylic dry erase board",
  "1 set of wall standoffs",
  "1 set of stickers",
  "Access to Digital guide on rebranding / vision boarding method",
] as const;

/** Shared product description copy used on every board landing page. */
export const SHARED_PRODUCT_BODY = [
  "Our blank acrylic dry erase board, with multiple color options, are made to be both beautiful and useful. Use it for notes, goals, chores, grocery lists, bills, reminders, schedules or anything you want to keep visible throughout the day.",
  "The clean acrylic design works in kitchens, bedrooms, offices, entryways, dorm rooms, salons, studios and home workspaces. Hang it vertically or horizontally depending on your space and how you want to use it.",
] as const;

export const SHARED_PRODUCT_HIGHLIGHTS = [
  "Sleek, modern acrylic design",
  "Reusable dry erase writing surface",
  "Great for home, office, school or business use",
  "Can be used vertically or horizontally",
  "Easy to wipe clean and use again",
  "Minimal floating wall-mounted look",
] as const;

export const SHARED_PRODUCT_COLORS =
  "Multiple colors are available: rose gold, neon pink, light pink, red, orange, yellow, green, light green, blue, sky blue, white, black, clear";

export const SHARED_PRODUCT_POPULAR_USES =
  "Use as an acrylic wall calendar, chore board, grocery list board, goal planner, habit tracker, family command center, message board, mood board, vision board, weekly planner, office task board, salon note board, kitchen reminder board, meal planning board, bill tracker, study board or to-do list board.";

export const SHARED_PRODUCT_IMPORTANT_NOTES = [
  "Please select your preferred size and hardware option before checkout.",
  "Dry erase markers are recommended. For best results, wipe the board regularly and avoid leaving marker ink on the surface for extended periods.",
  "Shop policies, processing times and shipping details can be found in the listing and shop information. By placing an order, you are confirming that you have reviewed the product details and selected the correct options.",
] as const;

export const SHARED_PRODUCT_DESCRIPTION = [
  ...SHARED_PRODUCT_BODY,
  SHARED_PRODUCT_COLORS,
  SHARED_PRODUCT_POPULAR_USES,
].join(" ");

export const SHARED_FAQ = [
  {
    q: "What comes with the board?",
    a: "Every order includes one acrylic dry erase board, one set of wall standoffs, and one set of stickers.",
  },
  {
    q: "How does it hang?",
    a: "The standoffs mount directly into your wall using standard drywall anchors — takes about 15 minutes with no special tools. The board floats about half an inch off the surface for a clean, minimal look.",
  },
  {
    q: "Can I write on it?",
    a: "Yes. Standard dry erase markers write and wipe clean on the acrylic surface. For permanent lettering — calendar headers, section titles, your name — vinyl lettering works beautifully.",
  },
  {
    q: "What sizes are available?",
    a: "12×24 ($99.99), 18×24 ($139.99), and 24×36 ($199.99). Select your size on the product page before checkout.",
  },
  {
    q: "How do stickers and photos work on it?",
    a: "The included sticker sheet adheres directly to the acrylic. Photos, magazine cutouts, and printed clippings attach the same way and peel off cleanly when you're ready to refresh.",
  },
  {
    q: "How long does shipping take?",
    a: "We ship to US addresses only. Orders process in 1–3 business days, then delivery typically takes 5–7 business days after that. Every board is carefully packaged to arrive in perfect condition.",
  },
] as const;

export const TRUST_BADGES = [
  "Stickers included",
  "Standoffs included",
  "Ships in 5–7 business days",
  "Multiple colors available",
  "Ships to all 50 states",
] as const;

export type BoardReview = {
  quote: string;
  name: string;
  rating: number;
  photo?: string;
};

export const BOARD_REVIEW_PHOTOS: Array<{ src: string; alt: string }> = [
  { src: "/board/reviews/review-01.png", alt: "Customer photo of pink acrylic board in a home office" },
  { src: "/board/reviews/review-02.png", alt: "Customer photo of black acrylic board in a kitchen" },
  { src: "/board/reviews/review-03.png", alt: "Customer photo of pink acrylic board above a gaming desk" },
  { src: "/board/reviews/review-04.png", alt: "Customer photo of white acrylic board in a bedroom" },
  { src: "/board/reviews/review-05.png", alt: "Customer photo of blue acrylic board with a to-do list" },
  { src: "/board/reviews/review-06.png", alt: "Customer photo of pink acrylic board with weekly planning" },
  { src: "/board/reviews/review-07.png", alt: "Customer photo of red acrylic board in an entryway" },
  { src: "/board/reviews/review-08.png", alt: "Customer photo of rose gold acrylic board in a bedroom" },
];

export const BOARD_REVIEWS: BoardReview[] = [
  {
    quote:
      "I've been looking for a colored dry erase board that actually looks good on the wall. This one looks even better in person. My office finally feels put together.",
    name: "Madison R., verified buyer",
    rating: 5,
    photo: "/board/reviews/review-01.png",
  },
  {
    quote:
      "Got rose gold for our kitchen planning area and black for this room. We get compliments every time someone visits. It was worth it.",
    name: "Jenna T., verified buyer",
    rating: 5,
    photo: "/board/reviews/review-02.png",
  },
  {
    quote:
      "Neon pink is even better in person. Hung it in about 20 minutes and I use it constantly for weekly planning.",
    name: "Alexis M., verified buyer",
    rating: 5,
    photo: "/board/reviews/review-06.png",
  },
  {
    quote:
      "Bought one as a housewarming gift — my friend said it was the best gift she'd received. Packaging was nice and it looks beautiful on the wall. I ordered one for myself too.",
    name: "Sara K., verified buyer",
    rating: 5,
    photo: "/board/reviews/review-04.png",
  },
  {
    quote:
      "We use ours for the family schedule and it has made our mornings smoother. Functional and genuinely pretty. Red was the right call.",
    name: "Rachel B., verified buyer",
    rating: 5,
    photo: "/board/reviews/review-07.png",
  },
  {
    quote:
      "I wanted something for my home office that wasn't a plain whiteboard or overpriced decor. This is both. Worth the price.",
    name: "Danielle W., verified buyer",
    rating: 5,
  },
  {
    quote:
      "I hesitated at the price but as soon as it was on the wall I knew it was worth it. My room looks completely different.",
    name: "Kayla J., verified buyer",
    rating: 5,
    photo: "/board/reviews/review-08.png",
  },
  {
    quote:
      "Rose gold is gorgeous in person. People always ask what it is when they see my setup.",
    name: "Tiana M., verified buyer",
    rating: 5,
  },
  {
    quote:
      "I put my goals and photos on it and it changed how I feel about them — seeing everything on the wall every day makes a difference. Stickers made setup easy.",
    name: "Brianna C., verified buyer",
    rating: 5,
  },
  {
    quote:
      "Having my goals and photos on the wall every day hits different than keeping them on my phone. This board is the focal point of my room now.",
    name: "Destiny A., verified buyer",
    rating: 5,
  },
  {
    quote:
      "I chose clear and it looks amazing. It's become part of my morning routine — the first thing I look at when I sit down at my desk.",
    name: "Simone V., verified buyer",
    rating: 5,
  },
  {
    quote:
      "I picked green and use it for planning headers and photos. It's the most used thing on my wall. Happy I spent the money.",
    name: "Amara L., verified buyer",
    rating: 5,
  },
  {
    quote:
      "Neon pink under good lighting looks incredible. My desk area finally looks the way I wanted.",
    name: "Jordan K., verified buyer",
    rating: 5,
    photo: "/board/reviews/review-03.png",
  },
  {
    quote:
      "I was unsure about the price but the green looks so good on my wall. Clean and bold — exactly what I was going for.",
    name: "Marcus T., verified buyer",
    rating: 4,
  },
  {
    quote:
      "Blue was the best addition to my room this year. Clean, bold, and the standoffs look minimal and high quality.",
    name: "Riley S., verified buyer",
    rating: 5,
    photo: "/board/reviews/review-05.png",
  },
];

export function getReviewStats(reviews: BoardReview[]) {
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount === 0
      ? 0
      : Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount) * 10) /
        10;
  return { reviewCount, averageRating };
}

export type BoardProductImages = {
  defaultHero: string;
  heroByColor?: Partial<Record<BoardColorId, string>>;
  gallery?: Array<{ src: string; alt: string }>;
};

export type BoardPageVariant = {
  slug: BoardPageSlug;
  path: `/${BoardPageSlug}`;
  metaDescription: string;
  h1: string;
  subheadline: string;
  colorSelectorLabel: string;
  colorHelperText?: string;
  giftNote?: string;
  trustLine: string;
  productImages?: BoardProductImages;
};

export const BOARD_PAGE_VARIANTS: Record<BoardPageSlug, BoardPageVariant> = {
  "dry-erase-boards": {
    slug: "dry-erase-boards",
    path: "/dry-erase-boards",
    metaDescription:
      "Acrylic Dry Erase Board · 24×36 — colored acrylic wall board for planning and organization. Multiple colors, standoffs & sticker sheet included. $199.99.",
    h1: "Acrylic Dry Erase Board",
    subheadline:
      "Colored acrylic board for lists, calendars, and everyday wall organization.",
    colorSelectorLabel: "Choose your color",
    trustLine:
      "Ships in 5–7 business days · Wipes clean · Standoffs and stickers included",
    productImages: {
      defaultHero: BOARD_COLOR_CATALOG_IMAGES.rose_gold,
      heroByColor: BOARD_COLOR_CATALOG_IMAGES,
      gallery: [
        {
          src: "/board/dry-erase/hero-pink-kawaii-desk.png",
          alt: "Pink acrylic dry erase board above a kawaii desk with tulips, pastel stationery, and My Melody decor",
        },
        {
          src: "/board/dry-erase/hero-mood-board.png",
          alt: "Acrylic mood board with May calendar, photos, and pastel desk accessories",
        },
        {
          src: "/board/dry-erase/hero-yellow-desk.png",
          alt: "Yellow acrylic dry erase board above a bright home office desk with natural light",
        },
        {
          src: "/board/dry-erase/hero-yellow-planner.png",
          alt: "Yellow acrylic board with daily plan, habit tracker, and aesthetic desk setup",
        },
        {
          src: "/board/dry-erase/hero-weekly-planner.png",
          alt: "Pink acrylic weekly planner board with photos and priority checklist",
        },
        {
          src: "/board/dry-erase/hero-weekly-grid.png",
          alt: "Pink acrylic weekly grid planner above a pastel desk with tulips and stationery",
        },
        {
          src: "/board/dry-erase/color-options.png",
          alt: "palette plotting acrylic color options including translucent and opaque finishes",
        },
        {
          src: "/board/dry-erase/standoffs.png",
          alt: "Silver and gold brushed standoff mounting hardware for acrylic wall boards",
        },
      ],
    },
  },
  "home-decor-boards": {
    slug: "home-decor-boards",
    path: "/home-decor-boards",
    metaDescription:
      "Home Command Board · 24×36 — scripture, schedules, and goals on one beautiful acrylic wall board. Multiple colors, standoffs & sticker sheet included. $199.99.",
    h1: "Home Command Board",
    subheadline:
      "Scripture, schedules, and goals — the intentional corner of your home, on one board.",
    colorSelectorLabel: "Choose your color",
    giftNote:
      "Works beautifully as a gift — for a housewarming, a birthday, a new home, a new chapter. Ships safely packaged and ready to give.",
    trustLine:
      "Ships in 5–7 business days · Carefully packaged · palette plotting — beautiful tools for organized lives",
    productImages: {
      defaultHero: "/board/home-decor/hero-rose-gold-desk.png",
      heroByColor: {
        rose_gold: "/board/home-decor/hero-rose-gold-desk.png",
        light_pink: "/board/home-decor/hero-rose-gold-desk.png",
        neon_pink: "/board/home-decor/hero-rose-gold-desk.png",
        orange: "/board/home-decor/hero-monthly-calendar.png",
        white_opaque: "/board/home-decor/hero-weekly-planner.png",
        light_green: "/board/home-decor/hero-prayer-board.png",
      },
      gallery: [
        {
          src: "/board/home-decor/hero-rose-gold-desk.png",
          alt: "Rose gold acrylic board above a home desk with roses, hydrangeas, and a rose gold laptop",
        },
        {
          src: "/board/home-decor/hero-command-center.png",
          alt: "Rose gold acrylic board organized with weekly schedule, prayer list, scripture, and family notes",
        },
        {
          src: "/board/home-decor/hero-weekly-planner.png",
          alt: "Acrylic weekly planner board with verse of the week in a warm home setting",
        },
        {
          src: "/board/home-decor/hero-monthly-calendar.png",
          alt: "Peach acrylic board with monthly calendar, intentions, and vision board layout",
        },
        {
          src: "/board/home-decor/hero-prayer-board.png",
          alt: "Hand writing prayer requests and gratitude on a rose gold acrylic wall board",
        },
        {
          src: "/board/home-decor/color-options.png",
          alt: "palette plotting acrylic color options including translucent and opaque finishes",
        },
        {
          src: "/board/home-decor/standoffs.png",
          alt: "Silver and gold brushed standoff mounting hardware for acrylic wall boards",
        },
      ],
    },
  },
  "vision-boards": {
    slug: "vision-boards",
    path: "/vision-boards",
    metaDescription:
      "Acrylic Vision Board · 24×36 — photos, goals, and where you're headed on a board people notice. Multiple colors including rose gold and pink. $199.99.",
    h1: "Acrylic Vision Board",
    subheadline: "The board people stop and ask about — photos, goals, and where you're headed.",
    colorSelectorLabel: "Choose your color",
    colorHelperText: "Rose gold is our most popular. Multiple colors available.",
    trustLine: "Ships in 5–7 business days · Looks incredible on your wall",
    productImages: {
      defaultHero: "/board/vision/hero-rose-gold-desk.png",
      heroByColor: {
        rose_gold: "/board/vision/hero-rose-gold-desk.png",
        light_pink: "/board/vision/hero-rose-gold-desk.png",
        neon_pink: "/board/vision/hero-rose-gold-desk.png",
        yellow: "/board/vision/hero-yellow-desk.png",
        clear: "/board/vision/hero-collage.png",
        orange: "/board/vision/hero-desk-setup.png",
      },
      gallery: [
        {
          src: "/board/vision/hero-rose-gold-desk.png",
          alt: "Rose gold acrylic vision board above a soft desk with roses, hydrangeas, and a rose gold laptop",
        },
        {
          src: "/board/vision/hero-photo-grid.png",
          alt: "Rose gold acrylic vision board with aesthetic photo grid above a soft pink desk",
        },
        {
          src: "/board/vision/hero-yellow-desk.png",
          alt: "Yellow acrylic vision board above a bright home office desk with natural light",
        },
        {
          src: "/board/vision/hero-collage.png",
          alt: "Pink acrylic vision board collage with peonies, travel photos, and luxury aesthetic",
        },
        {
          src: "/board/vision/hero-desk-setup.png",
          alt: "Acrylic vision board above a rose gold laptop desk with fairy lights and moodboard clippings",
        },
        {
          src: "/board/vision/color-options.png",
          alt: "palette plotting acrylic color options including translucent and opaque finishes",
        },
        {
          src: "/board/vision/standoffs.png",
          alt: "Silver and gold brushed standoff mounting hardware for acrylic wall boards",
        },
      ],
    },
  },
  "neon-boards": {
    slug: "neon-boards",
    path: "/neon-boards",
    metaDescription:
      "Neon Acrylic Board · 24×36 — one panel that sets the whole mood, especially under LED light. Neon pink, green, yellow, blue & more. $199.99.",
    h1: "Neon Acrylic Board",
    subheadline:
      "One panel that sets the whole mood — especially under LED light.",
    colorSelectorLabel: "Choose your color",
    colorHelperText:
      "Neon pink, yellow, blue, and green look best under LED lighting.",
    trustLine: "Ships in 5–7 business days · Arrives ready to change your room",
    productImages: {
      defaultHero: "/board/neon/hero-pink-kawaii.png",
      heroByColor: {
        neon_pink: "/board/neon/hero-pink-kawaii.png",
        rose_gold: "/board/neon/hero-pink-kawaii.png",
        light_pink: "/board/neon/hero-pink-glow.png",
        yellow: "/board/neon/hero-yellow-desk.png",
        sky_blue: "/board/neon/hero-blue-gaming.png",
        blue: "/board/neon/hero-blue-gaming.png",
        green: "/board/neon/hero-blue-gaming.png",
      },
      gallery: [
        {
          src: "/board/neon/hero-pink-kawaii.png",
          alt: "Neon pink acrylic board in a kawaii gaming room with pink desk setup and LED lighting",
        },
        {
          src: "/board/neon/hero-pink-glow.png",
          alt: "Neon pink acrylic board glowing above a pink aesthetic gaming desk",
        },
        {
          src: "/board/neon/hero-yellow-desk.png",
          alt: "Neon yellow acrylic board above a bright home office desk",
        },
        {
          src: "/board/neon/hero-blue-gaming.png",
          alt: "Blue acrylic board above a gaming desk with blue RGB lighting",
        },
        {
          src: "/board/neon/color-options.png",
          alt: "palette plotting acrylic color options including translucent and opaque finishes",
        },
        {
          src: "/board/home-decor/standoffs.png",
          alt: "Silver and gold brushed standoff mounting hardware for acrylic wall boards",
        },
      ],
    },
  },
};

export const BOARD_PAGE_SLUGS = Object.keys(BOARD_PAGE_VARIANTS) as BoardPageSlug[];

/** Default product page — clearest general listing (planning / kawaii). */
export const DEFAULT_PRODUCT_PATH = "/dry-erase-boards" as const;

export function productUrlForColor(colorId: BoardColorId): string {
  return `${DEFAULT_PRODUCT_PATH}?color=${colorId}`;
}

export function boardVariantFromPathname(pathname: string): BoardPageVariant | null {
  const path = pathname.replace(/\/$/, "") || "/";
  const slug = path.slice(1) as BoardPageSlug;
  return BOARD_PAGE_VARIANTS[slug] ?? null;
}
