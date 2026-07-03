const HIDDEN_ATTR = "data-rc-hidden-paywall-media";

const INVALID_SRC =
  /^(?:file:|capacitor:|\/assets\/|\.\/assets|bundle:\/\/|res:\/\/)/i;

function isInvalidSrc(src: string | null | undefined): boolean {
  const value = (src ?? "").trim();
  if (!value || value === "#") return true;
  return INVALID_SRC.test(value);
}

function shouldHideImage(img: HTMLImageElement): boolean {
  if (isInvalidSrc(img.getAttribute("src"))) return true;
  return img.complete && img.naturalHeight === 0;
}

/** Hide a broken hero slot without touching plan rows or CTAs below. */
function hideImageBlock(img: HTMLImageElement, root: HTMLElement): void {
  const mark = (el: HTMLElement) => {
    el.setAttribute(HIDDEN_ATTR, "true");
  };

  const rootTop = root.getBoundingClientRect().top;
  const imgTop = img.getBoundingClientRect().top;
  const inTopHero = imgTop - rootTop < 360;

  let node: HTMLElement | null = img.parentElement;
  for (let depth = 0; depth < 8 && node && node !== root; depth += 1) {
    const imgs = node.querySelectorAll("img");
    const tallEnough = node.getBoundingClientRect().height > 48;
    if (inTopHero && imgs.length === 1 && tallEnough) {
      mark(node);
      return;
    }
    node = node.parentElement;
  }

  mark(img);
}

function scanPaywallImages(root: HTMLElement): void {
  root.querySelectorAll("img").forEach((img) => {
    if (img.getAttribute(HIDDEN_ATTR) === "true") return;

    const hide = () => hideImageBlock(img, root);

    if (shouldHideImage(img)) {
      hide();
      return;
    }

    img.addEventListener("error", hide, { once: true });
  });
}

/**
 * RevenueCat web paywalls often ship a dashboard hero image URL that 404s on web
 * (native asset paths, empty src, etc.). Hide only broken/invalid top media.
 */
export function attachHideBrokenRevenueCatPaywallMedia(root: HTMLElement): () => void {
  scanPaywallImages(root);

  const observer = new MutationObserver(() => scanPaywallImages(root));
  observer.observe(root, { childList: true, subtree: true });

  return () => observer.disconnect();
}
