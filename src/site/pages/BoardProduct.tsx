import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, Star } from "lucide-react";
import { ProductShippingInfo } from "@/site/components/product/ProductShippingInfo";
import { SiteLayout } from "@/site/components/layout/SiteLayout";
import { Button } from "@/site/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/site/components/ui/dialog";
import { SITE_NAME } from "@/site/lib/siteBrand";
import { cn } from "@/site/lib/utils";
import {
  ALL_BOARD_COLOR_IDS,
  BOARD_COLORS,
  BOARD_REVIEW_PHOTOS,
  BOARD_REVIEWS,
  SHARED_FAQ,
  SHARED_INCLUDED,
  SHARED_PRODUCT_BODY,
  SHARED_PRODUCT_COLORS,
  SHARED_PRODUCT_DESCRIPTION,
  SHARED_PRODUCT_HIGHLIGHTS,
  SHARED_PRODUCT_IMPORTANT_NOTES,
  SHARED_PRODUCT_POPULAR_USES,
  TRUST_BADGES,
  boardVariantFromPathname,
  getReviewStats,
  productDisplayTitle,
  productPageMetaTitle,
  type BoardColorId,
  type BoardReview,
} from "@/site/lib/boardPageVariants";
import { boardColorCatalogSrc } from "@/site/lib/boardColorCatalog";
import { productOfferShippingJsonLd, PRODUCT_SHIPPING } from "@/site/lib/productShipping";
import { SITE_ORIGIN, usePageSeo } from "@/site/lib/usePageSeo";
import {
  trackGAAddToCart,
  trackGAViewItem,
  trackMetaAddToCart,
  trackMetaViewContent,
  trackTikTokAddToCart,
  trackTikTokViewContent,
} from "@/site/lib/analytics";
import {
  BOARD_SIZE_OPTIONS,
  DEFAULT_BOARD_SIZE,
  STANDOFF_OPTIONS,
  boardPriceForSize,
  boardPriceLabelForSize,
  boardSizeOption,
  isBoardVariantConfigured,
  shopifyVariantId,
  type BoardSizeId,
  type StandoffId,
} from "@/site/lib/shopifyVariants";
import { addBoardToCart } from "@/site/lib/boardCart";

function galleryImageUsesContain(src: string): boolean {
  return src.includes("color-options") || src.includes("standoffs");
}

function ProductMediaGallery({
  images,
  activeIndex,
  onSelect,
  fallbackSwatch,
  fallbackLabel,
}: {
  images: Array<{ src: string; alt: string }>;
  activeIndex: number;
  onSelect: (index: number) => void;
  fallbackSwatch: string;
  fallbackLabel: string;
}) {
  const active = images[activeIndex];
  const activeUsesContain = active ? galleryImageUsesContain(active.src) : false;

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
        {active ? (
          <img
            src={active.src}
            alt={active.alt}
            className={cn(
              "w-full",
              activeUsesContain
                ? "aspect-[4/3] object-contain bg-white p-2 sm:p-3"
                : "aspect-square object-cover",
            )}
            loading="eager"
            decoding="async"
          />
        ) : (
          <div
            className="aspect-square w-full"
            style={{
              background: fallbackSwatch,
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
            }}
          >
            <div className="flex h-full items-end p-4">
              <p className="text-sm font-medium text-neutral-800">{fallbackLabel}</p>
            </div>
          </div>
        )}
      </div>

      {images.length > 1 ? (
        <div
          className="mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="list"
          aria-label="Product photos"
        >
          {images.map((item, index) => {
            const thumbUsesContain = galleryImageUsesContain(item.src);
            return (
              <button
                key={item.src}
                type="button"
                role="listitem"
                onClick={() => onSelect(index)}
                className={cn(
                  "h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                  index === activeIndex
                    ? "border-neutral-900"
                    : "border-transparent opacity-70 hover:opacity-100",
                )}
                aria-label={`View photo ${index + 1}`}
                aria-current={index === activeIndex ? "true" : undefined}
              >
                <img
                  src={item.src}
                  alt=""
                  className={cn(
                    "h-full w-full",
                    thumbUsesContain ? "object-contain bg-white p-1" : "object-cover",
                  )}
                  loading="lazy"
                  decoding="async"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

type DisplayReview = BoardReview & { id: string };

function ReviewStars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const starClass = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className={cn("flex gap-0.5")} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            starClass,
            i < rating ? "fill-neutral-900 text-neutral-900" : "fill-none text-neutral-300",
          )}
          aria-hidden
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: DisplayReview }) {
  return (
    <article className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <ReviewStars rating={review.rating} />
          <p className="mt-3 text-sm leading-relaxed text-neutral-700">&ldquo;{review.quote}&rdquo;</p>
          <p className="mt-3 text-xs text-neutral-400">— {review.name}</p>
        </div>
        {review.photo ? (
          <img
            src={review.photo}
            alt=""
            className="h-20 w-20 shrink-0 rounded-lg border border-neutral-200 object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : null}
      </div>
    </article>
  );
}

function BoardReviewsSection() {
  const [allReviewsOpen, setAllReviewsOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const allReviews = useMemo<DisplayReview[]>(() =>
    BOARD_REVIEWS.map((review, index) => ({ ...review, id: `static-${index}` })),
  []);

  const reviewCount = allReviews.length;
  const averageRating = useMemo(() => {
    const sum = allReviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / reviewCount) * 10) / 10;
  }, [allReviews, reviewCount]);

  const starCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    for (const review of allReviews) {
      const bucket = Math.min(5, Math.max(1, Math.round(review.rating))) - 1;
      counts[bucket] += 1;
    }
    return counts;
  }, [allReviews]);

  const previewReviews = useMemo(() => {
    const withPhoto = allReviews.filter((review) => review.photo);
    if (withPhoto.length >= 2) return withPhoto.slice(0, 2);
    return allReviews.slice(0, 2);
  }, [allReviews]);

  return (
    <section className="mt-12" aria-labelledby="board-reviews-heading">
      <h2 id="board-reviews-heading" className="text-lg font-semibold text-neutral-900">
        Customer reviews
      </h2>

      <div className="mt-4 flex gap-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <div className="shrink-0 text-center">
          <p className="text-3xl font-semibold leading-none text-neutral-900">{averageRating.toFixed(1)}</p>
          <ReviewStars rating={Math.round(averageRating)} size="md" />
          <p className="mt-2 text-xs text-neutral-400">
            {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
          </p>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = starCounts[stars - 1] ?? 0;
            const pct = reviewCount ? Math.round((count / reviewCount) * 100) : 0;
            return (
              <div key={stars} className="flex items-center gap-2 text-xs text-neutral-500">
                <span className="w-3 shrink-0">{stars}</span>
                <Star className="h-3 w-3 shrink-0 fill-neutral-900 text-neutral-900" aria-hidden />
                <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full rounded-full bg-neutral-900" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 shrink-0 text-right tabular-nums">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-neutral-700">Photos from customers</p>
        <div
          className="mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="list"
          aria-label="Customer review photos"
        >
          {BOARD_REVIEW_PHOTOS.map((photo) => (
            <button
              key={photo.src}
              type="button"
              role="listitem"
              onClick={() => setPhotoPreview(photo.src)}
              className="h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-lg border border-neutral-200 transition-opacity hover:opacity-90"
              aria-label={photo.alt}
            >
              <img src={photo.src} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {previewReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="mt-4 min-h-[44px] w-full"
        onClick={() => setAllReviewsOpen(true)}
      >
        See all customer reviews
      </Button>

      <Dialog open={allReviewsOpen} onOpenChange={setAllReviewsOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto border-neutral-200 bg-white text-neutral-900">
          <DialogHeader>
            <DialogTitle className="text-neutral-900">All customer reviews</DialogTitle>
            <DialogDescription className="text-neutral-500">
              {reviewCount} reviews · {averageRating.toFixed(1)} average
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-4">
            {allReviews.map((review) => (
              <li key={review.id}>
                <ReviewCard review={review} />
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      <Dialog open={photoPreview !== null} onOpenChange={(open) => !open && setPhotoPreview(null)}>
        <DialogContent className="max-w-md border-neutral-200 bg-white p-2 text-neutral-900">
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Customer review photo"
              className="max-h-[70vh] w-full rounded-lg object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default function BoardProduct() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const variant = boardVariantFromPathname(pathname);

  const sortedColors = ALL_BOARD_COLOR_IDS.map((id) => BOARD_COLORS[id]);

  const [size, setSize] = useState<BoardSizeId>(DEFAULT_BOARD_SIZE);
  const [standoff, setStandoff] = useState<StandoffId>("silver");
  const [color, setColor] = useState<BoardColorId>("rose_gold");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [cartPending, setCartPending] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  useEffect(() => {
    if (!variant) return;
    const fromQuery = searchParams.get("color");
    if (fromQuery && fromQuery in BOARD_COLORS) {
      setColor(fromQuery as BoardColorId);
      return;
    }
    setColor(ALL_BOARD_COLOR_IDS[0]);
  }, [variant?.slug, searchParams]);

  const selectedPriceUsd = boardPriceForSize(size);
  const selectedPriceLabel = boardPriceLabelForSize(size);
  const checkoutReady = isBoardVariantConfigured(size, standoff, color);

  useEffect(() => {
    if (!variant) return;
    trackTikTokViewContent({
      contentId: shopifyVariantId(size, standoff, color) ?? `${size}-${standoff}-${color}`,
      contentName: productDisplayTitle(color),
      price: selectedPriceUsd,
    });
    trackMetaViewContent({
      contentId: shopifyVariantId(size, standoff, color) ?? `${size}-${standoff}-${color}`,
      contentName: productDisplayTitle(color),
      price: selectedPriceUsd,
    });
    trackGAViewItem({
      contentId: shopifyVariantId(size, standoff, color) ?? `${size}-${standoff}-${color}`,
      contentName: productDisplayTitle(color),
      price: selectedPriceUsd,
    });
  }, [variant, color, standoff, size, selectedPriceUsd]);

  const productJsonLd = useMemo(() => {
    if (!variant) return undefined;
    const { averageRating, reviewCount } = getReviewStats(BOARD_REVIEWS);
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: productDisplayTitle(color),
      description: SHARED_PRODUCT_DESCRIPTION,
      brand: { "@type": "Brand", name: SITE_NAME },
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: selectedPriceUsd.toFixed(2),
        availability: "https://schema.org/InStock",
        url: `${SITE_ORIGIN}${variant.path}`,
        shippingDetails: productOfferShippingJsonLd(),
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: averageRating.toFixed(1),
        reviewCount: String(reviewCount),
        bestRating: "5",
      },
    };
  }, [variant, color, selectedPriceUsd]);

  usePageSeo({
    title: variant ? productPageMetaTitle(color) : SITE_NAME,
    description: variant?.metaDescription ?? `${SITE_NAME} acrylic wall boards.`,
    path: variant?.path ?? "/",
    ogType: "product",
    jsonLd: productJsonLd,
  });

  const galleryImages = useMemo(() => {
    if (!variant) return [];
    const label = BOARD_COLORS[color]?.label ?? "Board";
    const colorShot = {
      src: boardColorCatalogSrc(color),
      alt: `${label} acrylic dry erase board`,
    };
    const extras =
      variant.productImages?.gallery?.filter(
        (item) => !item.src.includes("color-options") && item.src !== colorShot.src,
      ) ?? [];
    return [colorShot, ...extras];
  }, [variant, color]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [color]);

  if (!variant) {
    if (pathname === "/manifestation-board" || pathname === "/manifestation-board/") {
      return <Navigate to="/vision-boards" replace />;
    }
    if (pathname === "/manifestation-boards" || pathname === "/manifestation-boards/") {
      return <Navigate to="/vision-boards" replace />;
    }
    return <Navigate to="/" replace />;
  }

  const selectedColor = BOARD_COLORS[color] ?? BOARD_COLORS.rose_gold;

  const handleAddToCart = async () => {
    setCartPending(true);
    setCartError(null);
    try {
      const item = {
        contentId: shopifyVariantId(size, standoff, color) ?? `${size}-${standoff}-${color}`,
        contentName: productDisplayTitle(color),
        price: selectedPriceUsd,
        quantity,
      };
      addBoardToCart({ size, standoff, color, quantity });
      trackTikTokAddToCart(item);
      trackMetaAddToCart(item);
      trackGAAddToCart(item);
      navigate("/cart");
    } catch (error) {
      setCartError(
        error instanceof Error ? error.message : "Could not add to cart. Please try again.",
      );
    } finally {
      setCartPending(false);
    }
  };

  const addToCartButton = (
    <div>
      <Button
        type="button"
        size="lg"
        className="h-12 min-h-[44px] w-full rounded-xl bg-neutral-900 text-base font-semibold text-white hover:bg-neutral-800"
        onClick={handleAddToCart}
        disabled={cartPending || !checkoutReady}
      >
        {cartPending ? "Adding…" : `Add to Cart — ${selectedPriceLabel}`}
      </Button>
      {cartError ? <p className="mt-2 text-sm text-red-600">{cartError}</p> : null}
    </div>
  );

  return (
    <SiteLayout>
      <div className="mx-auto max-w-lg px-4 pb-28 pt-4 sm:px-6 sm:py-8 md:pb-12">
        <header className="mb-4">
          <h1 className="text-lg font-semibold leading-snug text-neutral-900 sm:text-xl">
            {productDisplayTitle(color)}
          </h1>
          {variant.subheadline ? (
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{variant.subheadline}</p>
          ) : null}
        </header>

        <ProductMediaGallery
          images={galleryImages}
          activeIndex={activeImageIndex}
          onSelect={setActiveImageIndex}
          fallbackSwatch={selectedColor.swatch}
          fallbackLabel={selectedColor.label}
        />

        <div className="mt-5">
          <p className="text-lg font-medium text-neutral-900">{selectedPriceLabel}</p>
          <p className="mt-1 text-sm text-neutral-500">
            Shop Pay Installments and other payment methods available at checkout.
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            US shipping calculated at checkout · {PRODUCT_SHIPPING.processingTime} processing ·{" "}
            {PRODUCT_SHIPPING.deliveryTime.toLowerCase()}
          </p>
          <p className="mt-1 text-sm font-medium text-neutral-900">24 x 36 board is pictured above.</p>
        </div>

        <section className="mt-5 border-t border-neutral-200 pt-5" aria-labelledby="board-size-heading">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="board-size-heading" className="text-sm text-neutral-700">
              Size (inches)
            </h2>
            <span className="text-sm text-neutral-900">{boardSizeOption(size).label}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2" role="list" aria-label="Choose board size">
            {BOARD_SIZE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="listitem"
                onClick={() => setSize(option.id)}
                className={cn(
                  "min-h-[44px] rounded-full border px-4 py-2 text-sm transition-colors",
                  size === option.id
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 text-neutral-700 hover:border-neutral-400",
                )}
                aria-pressed={size === option.id}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5 border-t border-neutral-200 pt-5" aria-labelledby="board-color-heading">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="board-color-heading" className="text-sm text-neutral-700">
              Color
            </h2>
            <span className="text-sm text-neutral-900">{selectedColor.label}</span>
          </div>
          <div
            className="mt-3 grid grid-cols-7 gap-x-2 gap-y-3 py-1"
            role="list"
            aria-label={variant.colorSelectorLabel}
          >
            {sortedColors.map((option) => (
              <button
                key={option.id}
                type="button"
                role="listitem"
                onClick={() => setColor(option.id)}
                className={cn(
                  "mx-auto h-9 w-9 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-1",
                  color === option.id
                    ? "bg-neutral-900 p-0.5"
                    : "ring-1 ring-neutral-200 hover:ring-neutral-400",
                )}
                aria-label={option.label}
                aria-pressed={color === option.id}
              >
                <span
                  className="block h-full w-full rounded-full"
                  style={{ background: option.swatch }}
                  aria-hidden
                />
              </button>
            ))}
          </div>
          {variant.colorHelperText ? (
            <p className="mt-2 text-xs text-neutral-400">{variant.colorHelperText}</p>
          ) : null}
        </section>

        <section className="mt-5 border-t border-neutral-200 pt-5" aria-labelledby="board-standoff-heading">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="board-standoff-heading" className="text-sm text-neutral-700">
              Standoffs
            </h2>
            <span className="text-sm text-neutral-900 capitalize">{standoff}</span>
          </div>
          <div className="mt-3 flex gap-2" role="list" aria-label="Choose standoff finish">
            {STANDOFF_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="listitem"
                onClick={() => setStandoff(option.id)}
                className={cn(
                  "min-h-[44px] rounded-full border px-4 py-2 text-sm transition-colors",
                  standoff === option.id
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 text-neutral-700 hover:border-neutral-400",
                )}
                aria-pressed={standoff === option.id}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5 border-t border-neutral-200 pt-5" aria-labelledby="board-qty-heading">
          <h2 id="board-qty-heading" className="text-sm text-neutral-700">
            Quantity
          </h2>
          <div className="mt-2 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="min-h-[44px] min-w-[44px]"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
            >
              −
            </Button>
            <span className="min-w-[2rem] text-center text-base font-medium text-neutral-900">{quantity}</span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="min-h-[44px] min-w-[44px]"
              disabled={quantity >= 10}
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              aria-label="Increase quantity"
            >
              +
            </Button>
          </div>
        </section>

        <div className="mt-5 hidden md:block">{addToCartButton}</div>

        <ProductShippingInfo />

        <div className="mt-6 space-y-4 text-sm leading-relaxed text-neutral-600">
          {SHARED_PRODUCT_BODY.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>

        <section className="mt-10" aria-labelledby="board-included-heading">
          <h2 id="board-included-heading" className="text-lg font-semibold text-neutral-900">
            What is included?
          </h2>
          <ul className="mt-4 space-y-3">
            {SHARED_INCLUDED.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-neutral-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-900" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10" aria-labelledby="board-highlights-heading">
          <h2 id="board-highlights-heading" className="text-lg font-semibold text-neutral-900">
            Why you&apos;ll love it
          </h2>
          <ul className="mt-4 space-y-3">
            {SHARED_PRODUCT_HIGHLIGHTS.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-neutral-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-900" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-10 text-sm leading-relaxed text-neutral-600">{SHARED_PRODUCT_COLORS}</p>

        <section className="mt-10" aria-labelledby="board-popular-uses-heading">
          <h2 id="board-popular-uses-heading" className="text-lg font-semibold text-neutral-900">
            Popular uses
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-neutral-600">{SHARED_PRODUCT_POPULAR_USES}</p>
        </section>

        <section className="mt-10" aria-labelledby="board-important-notes-heading">
          <h2 id="board-important-notes-heading" className="text-lg font-semibold text-neutral-900">
            Important notes
          </h2>
          <div className="mt-4 space-y-3">
            {SHARED_PRODUCT_IMPORTANT_NOTES.map((note) => (
              <p key={note.slice(0, 48)} className="text-sm leading-relaxed text-neutral-600">
                {note}
              </p>
            ))}
          </div>
        </section>

        <ul className="mt-6 flex flex-wrap gap-2">
          {TRUST_BADGES.map((badge) => (
            <li
              key={badge}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-500"
            >
              ✦ {badge}
            </li>
          ))}
        </ul>

        <p className="mt-3 text-center text-xs text-neutral-400">{variant.trustLine}</p>

        {variant.giftNote ? (
          <p className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-600">
            {variant.giftNote}
          </p>
        ) : null}

        <BoardReviewsSection />

        <section className="mt-12 pb-4" aria-labelledby="board-faq-heading">
          <h2 id="board-faq-heading" className="text-lg font-semibold text-neutral-900">
            FAQ
          </h2>
          <div className="mt-4 divide-y divide-neutral-200 rounded-xl border border-neutral-200">
            {SHARED_FAQ.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    className="flex min-h-[44px] w-full items-start justify-between gap-3 px-4 py-4 text-left"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >
                    <span className="font-medium text-neutral-900">{item.q}</span>
                    <ChevronDown
                      className={cn(
                        "mt-0.5 h-5 w-5 shrink-0 text-neutral-900 transition-transform",
                        isOpen && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>
                  {isOpen ? (
                    <p className="px-4 pb-4 text-sm leading-relaxed text-neutral-600">{item.a}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
        {addToCartButton}
      </div>
    </SiteLayout>
  );
}
