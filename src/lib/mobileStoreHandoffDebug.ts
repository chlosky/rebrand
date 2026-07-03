type StoreHandoffDebugPayload = Record<string, string | number | boolean | null | undefined>;

const DEBUG_QUERY = "debug=store";
const DEBUG_STORAGE_KEY = "marketing_store_debug";

export function isStoreHandoffDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (import.meta.env.DEV) return true;
  try {
    if (window.location.search.includes(DEBUG_QUERY)) return true;
    if (localStorage.getItem(DEBUG_STORAGE_KEY) === "1") return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function logStoreHandoff(event: string, payload?: StoreHandoffDebugPayload): void {
  if (!isStoreHandoffDebugEnabled()) return;
  console.log("[store-handoff]", event, payload ?? {});
}
