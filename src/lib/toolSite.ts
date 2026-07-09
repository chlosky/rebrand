const ACCESS_STORAGE_KEY = "palette_site_access_granted";

export function isToolSiteHost(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname.toLowerCase() === "tool.paletteplot.com";
}

export function isSiteAccessRequired(): boolean {
  if (import.meta.env.VITE_SITE_LOCK_ENABLED === "true") return true;
  return isToolSiteHost();
}

export function hasSiteAccessGrant(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(ACCESS_STORAGE_KEY) === "1";
}

export function storeSiteAccessGrant(): void {
  sessionStorage.setItem(ACCESS_STORAGE_KEY, "1");
}
