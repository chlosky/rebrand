import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import {
  DigitalAccessNotice,
  DigitalLibraryLogin,
  signOutDigitalLibrary,
  useDigitalProductAccess,
} from "@/site/components/digital/DigitalLibraryLogin";
import { SiteLayout } from "@/site/components/layout/SiteLayout";
import { Button } from "@/site/components/ui/button";
import {
  trackGAAddToCart,
  trackMetaAddToCart,
  trackTikTokAddToCart,
} from "@/site/lib/analytics";
import {
  GUIDE_FAQ,
  GUIDE_HIGHLIGHTS,
  GUIDE_INCLUDED,
  GUIDE_OPEN_SECTION_ID,
  GUIDE_PRICE_LABEL,
  GUIDE_PRICE_USD,
  GUIDE_PRODUCT_BODY,
  GUIDE_PRODUCT_HERO,
  GUIDE_PRODUCT_TITLE,
  GUIDE_PUBLIC_SECTIONS,
  GUIDE_READER_PATH,
  GUIDE_TAGLINE,
} from "@/site/lib/guidePublicManifest";
import { addVariantToCart } from "@/site/lib/shopifyStorefront";
import { SHOPIFY_GUIDE_VARIANT_ID } from "@/site/lib/shopifyVariants";
import { pageTitle, SITE_NAME } from "@/site/lib/siteBrand";
import { cn } from "@/site/lib/utils";
import { SITE_ORIGIN, usePageSeo } from "@/site/lib/usePageSeo";

export default function PalettePlottingGuidePreviewPage() {
  const access = useDigitalProductAccess();
  const location = useLocation();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [cartPending, setCartPending] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  const guideHeroUrl = `${SITE_ORIGIN}${GUIDE_PRODUCT_HERO.src}`;

  const productJsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Product",
      name: GUIDE_PRODUCT_TITLE,
      description: GUIDE_PRODUCT_BODY[0],
      image: [guideHeroUrl],
      brand: { "@type": "Brand", name: SITE_NAME },
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: String(GUIDE_PRICE_USD),
        availability: "https://schema.org/InStock",
        url: `${SITE_ORIGIN}/palette-plotting-guide`,
      },
    }),
    [guideHeroUrl],
  );

  usePageSeo({
    title: pageTitle(GUIDE_PRODUCT_TITLE),
    description: GUIDE_PRODUCT_BODY[0],
    path: "/palette-plotting-guide",
    ogType: "product",
    ogImage: guideHeroUrl,
    jsonLd: productJsonLd,
  });

  useEffect(() => {
    if (location.hash !== `#${GUIDE_OPEN_SECTION_ID}`) return;

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(GUIDE_OPEN_SECTION_ID)?.scrollIntoView({ behavior: "smooth" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.hash]);

  async function handleSignOut() {
    await signOutDigitalLibrary();
    window.location.href = "/palette-plotting-guide";
  }

  async function handleAddToCart() {
    setCartPending(true);
    setCartError(null);
    try {
      const item = {
        contentId: SHOPIFY_GUIDE_VARIANT_ID,
        contentName: GUIDE_PRODUCT_TITLE,
        price: GUIDE_PRICE_USD,
        quantity: 1,
      };
      await addVariantToCart(SHOPIFY_GUIDE_VARIANT_ID, 1);
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
  }

  const buyButton = (
    <div>
      <Button
        type="button"
        size="lg"
        className="h-12 min-h-[44px] w-full rounded-xl bg-neutral-900 text-base font-semibold text-white hover:bg-neutral-800"
        onClick={handleAddToCart}
        disabled={cartPending}
      >
        {cartPending ? "Adding…" : `Add to Cart — ${GUIDE_PRICE_LABEL}`}
      </Button>
      {cartError ? <p className="mt-2 text-sm text-red-600">{cartError}</p> : null}
    </div>
  );

  const primaryAction = access.entitled ? (
    <a
      href={GUIDE_READER_PATH}
      className="inline-flex h-12 min-h-[44px] w-full items-center justify-center rounded-xl bg-neutral-900 text-base font-semibold text-white hover:bg-neutral-800"
    >
      Open guide
    </a>
  ) : (
    buyButton
  );

  return (
    <SiteLayout>
      <div className="mx-auto max-w-lg px-4 pb-28 pt-4 sm:px-6 sm:py-8 md:pb-12">
        <DigitalAccessNotice />

        <header className="mb-4 mt-2">
          <h1 className="text-lg font-semibold leading-snug text-neutral-900 sm:text-xl">
            {GUIDE_PRODUCT_TITLE}
          </h1>
          <p className="mt-2 text-sm font-medium text-neutral-900">{GUIDE_TAGLINE}</p>
        </header>

        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
          <img
            src={GUIDE_PRODUCT_HERO.src}
            alt={GUIDE_PRODUCT_HERO.alt}
            className="aspect-square w-full object-cover"
            loading="eager"
            decoding="async"
          />
        </div>

        <div className="mt-5">
          <p className="text-lg font-medium text-neutral-900">{GUIDE_PRICE_LABEL}</p>
          <p className="mt-1 text-sm text-neutral-500">
            Digital guide · one-time purchase · read on this site
          </p>
          <p className="mt-2 text-sm leading-relaxed text-red-600">
            Customers that have already purchased a board automatically receive free access. Simply{" "}
            <a
              href={`#${GUIDE_OPEN_SECTION_ID}`}
              className="font-medium underline underline-offset-2 hover:text-red-700"
            >
              scroll down
            </a>{" "}
            to unlock with email after purchase.
          </p>
        </div>

        <div className="mt-5 hidden md:block">{primaryAction}</div>

        {access.authenticated ? (
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-3 hidden text-sm text-neutral-500 hover:text-neutral-900 md:inline-block"
          >
            Sign out
          </button>
        ) : null}

        <div className="mt-6 space-y-4 text-sm leading-relaxed text-neutral-600">
          {GUIDE_PRODUCT_BODY.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>

        <section className="mt-10" aria-labelledby="guide-included-heading">
          <h2 id="guide-included-heading" className="text-lg font-semibold text-neutral-900">
            What is included?
          </h2>
          <ul className="mt-4 space-y-3">
            {GUIDE_INCLUDED.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-neutral-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-900" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10" aria-labelledby="guide-highlights-heading">
          <h2 id="guide-highlights-heading" className="text-lg font-semibold text-neutral-900">
            Why you&apos;ll love it
          </h2>
          <ul className="mt-4 space-y-3">
            {GUIDE_HIGHLIGHTS.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-neutral-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-900" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10" aria-labelledby="guide-sections-heading">
          <h2 id="guide-sections-heading" className="text-lg font-semibold text-neutral-900">
            What&apos;s inside
          </h2>
          <ol className="mt-4 space-y-2">
            {GUIDE_PUBLIC_SECTIONS.map((section, index) => (
              <li
                key={section.slug}
                className="flex gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700"
              >
                <span className="font-medium text-neutral-400">{String(index + 1).padStart(2, "0")}</span>
                <span>{section.title}</span>
              </li>
            ))}
          </ol>
        </section>

        <section
          id={GUIDE_OPEN_SECTION_ID}
          className="mt-10 scroll-mt-24 border-t border-neutral-200 pt-8"
        >
          <DigitalLibraryLogin productSlug="palette-plotting-guide" />
        </section>

        <section className="mt-12 pb-4" aria-labelledby="guide-faq-heading">
          <h2 id="guide-faq-heading" className="text-lg font-semibold text-neutral-900">
            FAQ
          </h2>
          <div className="mt-4 divide-y divide-neutral-200 rounded-xl border border-neutral-200">
            {GUIDE_FAQ.map((item, index) => {
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
        {primaryAction}
      </div>
    </SiteLayout>
  );
}
