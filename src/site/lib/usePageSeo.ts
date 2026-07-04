import { useLayoutEffect } from "react";
import { JSON_LD_SCRIPT_ID, SITE_NAME, SITE_ORIGIN } from "@/site/lib/siteBrand";

export { SITE_ORIGIN } from "@/site/lib/siteBrand";

type PageSeoOptions = {
  title: string;
  description: string;
  path?: string;
  ogType?: "website" | "product";
  /** Absolute URL for social preview / thumbnail (og:image, twitter:image). */
  ogImage?: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
};

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function upsertJsonLd(data: PageSeoOptions["jsonLd"]) {
  const id = JSON_LD_SCRIPT_ID;
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.setAttribute("type", "application/ld+json");
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/** Sets document title, meta description, Open Graph, Twitter, canonical, and optional JSON-LD. */
export function usePageSeo({
  title,
  description,
  path = "/",
  ogType = "website",
  ogImage,
  jsonLd,
}: PageSeoOptions) {
  const canonical = `${SITE_ORIGIN}${path}`;

  useLayoutEffect(() => {
    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", ogType);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    if (ogImage) {
      upsertMeta("property", "og:image", ogImage);
      upsertMeta("name", "twitter:image", ogImage);
    }
    upsertCanonical(canonical);

    if (jsonLd) {
      upsertJsonLd(jsonLd);
    } else {
      document.getElementById(JSON_LD_SCRIPT_ID)?.remove();
    }
  }, [title, description, canonical, ogType, ogImage, jsonLd]);
}
