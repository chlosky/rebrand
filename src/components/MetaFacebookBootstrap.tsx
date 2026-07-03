import { useEffect } from "react";
import { ensureMetaPixelLoaded, initMetaAppEvents } from "@/lib/metaFacebook";

/** Web Meta Pixel + native Meta App Events bootstrap (no-op until env credentials are set). */
export function MetaFacebookBootstrap() {
  useEffect(() => {
    ensureMetaPixelLoaded();
    void initMetaAppEvents();
  }, []);
  return null;
}
