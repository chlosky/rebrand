import { Link } from "react-router-dom";
import { SiteLayout } from "@/site/components/layout/SiteLayout";
import { DEFAULT_PRODUCT_PATH } from "@/site/lib/boardPageVariants";
import { pageTitle, SITE_NAME } from "@/site/lib/siteBrand";
import { usePageSeo } from "@/site/lib/usePageSeo";

export default function AboutPage() {
  usePageSeo({
    title: pageTitle("About"),
    description:
      `${SITE_NAME} makes acrylic wall boards for simpler planning, clearer vision-setting, and spaces that feel intentional.`,
    path: "/about",
  });

  return (
    <SiteLayout>
      <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Shop
        </Link>
        <header className="mt-4 border-b border-neutral-200 pb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            About {SITE_NAME}
          </h1>
        </header>
        <div className="mt-8 space-y-5 text-sm leading-relaxed text-neutral-600 sm:text-base">
          <p>
            {SITE_NAME} started with a simple idea: the things you look at every day should make your
            life easier — not add noise to it.
          </p>
          <p>
            We make acrylic wall boards in colors that actually belong on your wall. Not plain
            whiteboards. Not poster board that curls at the edges. One clean panel, mounted with
            standoffs, ready for whatever you need it to be.
          </p>
          <p>
            <strong className="font-medium text-neutral-900">Planning, simpler.</strong> Weekly
            schedules, to-do lists, meal plans, family calendars — write it, wipe it, change it.
            Acrylic that looks like part of your room, not an afterthought in the corner.
          </p>
          <p>
            <strong className="font-medium text-neutral-900">Vision, clearer.</strong> Goals, photos,
            goals, photos, quotes, mood boards — your board holds what matters at full size, at
            eye level, where you will actually see it. What you see every day shapes what you believe
            is possible.
          </p>
          <p>
            <strong className="font-medium text-neutral-900">Life, a little more intentional.</strong>{" "}
            Every order includes standoffs and a sticker sheet so you can start as soon as it is on
            the wall. Pick a color that fits your space. Hang it once. Use it every day.
          </p>
          <p>
            That is the whole point — less clutter, less friction, more clarity. One board that does
            the work of ten scattered notes and half-finished lists.
          </p>
        </div>
        <p className="mt-10">
          <Link
            to={DEFAULT_PRODUCT_PATH}
            className="inline-flex min-h-[44px] items-center rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Shop boards
          </Link>
        </p>
      </article>
    </SiteLayout>
  );
}
