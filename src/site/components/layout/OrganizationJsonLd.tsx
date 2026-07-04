import { useLayoutEffect } from "react";
import {
  ORGANIZATION_JSON_LD,
  ORGANIZATION_JSON_LD_SCRIPT_ID,
} from "@/site/lib/organizationJsonLd";

/** Injects Organization JSON-LD on every page for Google Merchant Center verification. */
export function OrganizationJsonLd() {
  useLayoutEffect(() => {
    let el = document.getElementById(ORGANIZATION_JSON_LD_SCRIPT_ID);
    if (!el) {
      el = document.createElement("script");
      el.id = ORGANIZATION_JSON_LD_SCRIPT_ID;
      el.setAttribute("type", "application/ld+json");
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(ORGANIZATION_JSON_LD);
  }, []);

  return null;
}
