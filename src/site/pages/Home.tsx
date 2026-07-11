import { useState } from "react";
import { Link } from "react-router-dom";
import { HeroVideo } from "@/site/components/home/HeroVideo";
import { SiteLayout } from "@/site/components/layout/SiteLayout";
import { PaletteLetterSignup } from "@/site/components/newsletter/PaletteLetterSignup";
import { boardColorCatalogSrc } from "@/site/lib/boardColorCatalog";
import {
  ALL_BOARD_COLOR_IDS,
  BOARD_COLORS,
  BOARD_PRICE_LABEL,
  productUrlForColor,
} from "@/site/lib/boardPageVariants";
import { GUIDE_CATALOG } from "@/site/lib/guidePublicManifest";
import { SITE_CONTAINER, SITE_NAME } from "@/site/lib/siteBrand";
import { usePageSeo } from "@/site/lib/usePageSeo";

const HOME_DESCRIPTION =
  "Aesthetic acrylic boards for organizing, moodboarding, planning, and envisioning. Standoffs and sticker sheet included. US shipping calculated at checkout.";

export default function Home() {
  const [heroSlide, setHeroSlide] = useState(0);
  const isBoardHero = heroSlide === 0;

  usePageSeo({
    title: `${SITE_NAME} — Aesthetic Acrylic Boards`,
    description: HOME_DESCRIPTION,
    path: "/",
  });

  return (
    <SiteLayout>
      <div className={`${SITE_CONTAINER} pb-6 pt-6 sm:pb-8 sm:pt-8`}>
        <section className="grid grid-cols-1 gap-6 pb-24 md:grid-cols-2 md:grid-rows-[auto_1fr] md:items-stretch md:gap-x-10 md:gap-y-5 md:pb-32">
          <p className="order-1 text-xs font-medium uppercase tracking-wide text-neutral-500 sm:text-sm md:col-start-1 md:row-start-1">
            Organize + Moodboard + Plan + Envision
          </p>

          <div className="order-2 md:col-start-2 md:row-start-1 md:row-span-2">
            <HeroVideo onActiveChange={setHeroSlide} />
          </div>

          <div className="order-3 flex flex-col md:col-start-1 md:row-start-2 md:min-h-0 md:h-full">
            <h1 className="text-3xl font-semibold leading-snug tracking-tight text-neutral-900 sm:text-4xl md:text-[2.5rem] md:leading-normal">
              Your super aesthetic
              <br />
              companion for every
              <br />
              organizing need.
            </h1>
            <p className="mt-4 flex flex-col gap-1 text-base leading-relaxed text-neutral-600 md:mt-5 md:gap-2 md:text-lg">
              {isBoardHero ? (
                <>
                  <span>Available in multiple colors</span>
                  <span>Handmade, laser cut holes, edge polished</span>
                  <span>Ready to mount on wall</span>
                  <span>Standoffs and sticker sheet included</span>
                  <span>Digital Guide on the method free with Board</span>
                </>
              ) : (
                <>
                  <span>Your new favorite tool for</span>
                  <span>vision boarding, moodboarding,</span>
                  <span>home organization and</span>
                  <span>late night strategy sessions</span>
                  <span>Design, Download, Remind</span>
                </>
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-3 md:mt-auto md:pt-6">
              <a
                href="#colors"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                Choose your color
              </a>
              <Link
                to="/onboarding/welcome"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-neutral-300 px-5 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
              >
                Get the Tool
              </Link>
            </div>
          </div>
        </section>

        <section id="colors" className="scroll-mt-8">
          <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            <li key={GUIDE_CATALOG.path}>
              <Link
                to={GUIDE_CATALOG.path}
                className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                aria-label={`${GUIDE_CATALOG.label} — ${GUIDE_CATALOG.priceLabel}`}
              >
                <div className="aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 transition-shadow group-hover:shadow-md">
                  <img
                    src={GUIDE_CATALOG.thumbnail.src}
                    alt={GUIDE_CATALOG.thumbnail.alt}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <p className="mt-2 text-sm font-medium text-neutral-900">{GUIDE_CATALOG.label}</p>
                <p className="text-sm text-neutral-600">{GUIDE_CATALOG.priceLabel}</p>
              </Link>
            </li>
            {ALL_BOARD_COLOR_IDS.map((colorId) => {
              const color = BOARD_COLORS[colorId];
              const imageSrc = boardColorCatalogSrc(colorId);
              return (
                <li key={colorId}>
                  <Link
                    to={productUrlForColor(colorId)}
                    className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                    aria-label={`${color.label} — ${BOARD_PRICE_LABEL}`}
                  >
                    <div className="aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 transition-shadow group-hover:shadow-md">
                      <img
                        src={imageSrc}
                        alt={`${color.label} moodboard`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <p className="mt-2 text-sm font-medium text-neutral-900">{color.label}</p>
                    <p className="text-sm text-neutral-600">{BOARD_PRICE_LABEL}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <PaletteLetterSignup source="homepage" layout="card" className="mt-16" />
      </div>
    </SiteLayout>
  );
}
