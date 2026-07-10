const ACCESS_STORAGE_KEY = "palette_site_access_granted";

const TOOL_SITE_HOSTS = new Set([
  "tool.paletteplotting.com",
  "tool.paletteplot.com",
]);

export function isToolSiteHost(): boolean {
  if (typeof window === "undefined") return false;
  return TOOL_SITE_HOSTS.has(window.location.hostname.toLowerCase());
}

export function isSiteAccessRequired(): boolean {
  return import.meta.env.VITE_SITE_LOCK_ENABLED === "true";
}

export function hasSiteAccessGrant(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(ACCESS_STORAGE_KEY) === "1";
}

export function storeSiteAccessGrant(): void {
  sessionStorage.setItem(ACCESS_STORAGE_KEY, "1");
}
