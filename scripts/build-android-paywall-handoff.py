#!/usr/bin/env python3
"""Generate Android paywall handoff (purchase flow + RC + post-paywall entry, code only)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "chatgpt-android-paywall-handoff.md"
FENCE = "```"

EXPLICIT = [
    "src/components/ProtectedRoute.tsx",
    "src/pages/onboarding/AndroidPaywall.tsx",
    "src/pages/onboarding/AndroidPostPaywallLoading.tsx",
    "src/pages/onboarding/EmailCollection.tsx",
    "src/pages/onboarding/setup/Email.tsx",
    "src/pages/PaymentProcessing.tsx",
    "src/pages/Activate.tsx",
    "src/lib/runAndroidPaywallFlow.ts",
    "src/lib/androidPostPurchaseEntitlementGate.ts",
    "src/lib/isAndroidPaywallContext.ts",
    "src/lib/postPaywallProvisioning.ts",
    "src/services/revenueCat.ts",
    "src/components/IosAppHeader.tsx",
    "src/components/ui/button.tsx",
    "src/lib/utils.ts",
    "src/debugLog.ts",
    "src/contexts/AuthContext.tsx",
    "src/integrations/supabase/client.ts",
    "supabase/functions/sync-revenuecat-entitlement/index.ts",
    "supabase/functions/_shared/revenueCatSecretEnv.ts",
    "supabase/functions/_shared/revenuecatUserPlansSync.ts",
]

LANG = {
    ".ts": "typescript",
    ".tsx": "tsx",
    ".sql": "sql",
}


def android_version_code() -> str:
    bg = ROOT / "android/app/build.gradle"
    if bg.exists():
        match = re.search(r"versionCode\s+(\d+)", bg.read_text(encoding="utf-8"))
        if match:
            return match.group(1)
    return "?"


def app_paywall_routes_excerpt() -> str:
    app = (ROOT / "src/App.tsx").read_text(encoding="utf-8")
    lines: list[str] = []
    for line in app.splitlines():
        if any(
            k in line
            for k in (
                "AndroidPaywall",
                "AndroidPostPaywall",
                "android-paywall",
                "android-post-paywall",
                "isAndroidPaywallContext",
                "LegacyOnboardingPricing",
                "WebResubscribe",
                "IsNativePaywallOr",
            )
        ):
            lines.append(line)
    return "\n".join(lines)


def fenced(lang: str, body: str) -> list[str]:
    return [FENCE + lang, body.rstrip(), FENCE, ""]


def main() -> None:
    version_code = android_version_code()
    files = sorted(EXPLICIT)
    lines = [
        "# Android paywall — full code handoff",
        "",
        "Branch: Mobile-app",
        f"versionCode: {version_code}",
        f"Files: {len(files) + 1}",
        "",
        "Android paywall path: setup Email / EmailCollection / AndroidPaywall →",
        "runAndroidPaywallFlow → RevenueCat presentPaywall →",
        "/onboarding/android-post-paywall → androidPostPurchaseEntitlementGate → dashboard.",
        "",
        "Includes post-paywall loading (2.8s cap) and shared provisionPostPaywallIfNeeded.",
        "",
        "---",
        "",
        "## src/App.tsx (Android paywall routes excerpt)",
        "",
    ]
    lines += fenced("tsx", app_paywall_routes_excerpt())

    for rel in files:
        p = ROOT / rel
        lines.append(f"## {rel}")
        lines.append("")
        if not p.exists():
            lines += ["(missing)", ""]
            continue
        lang = LANG.get(p.suffix, p.suffix.lstrip("."))
        lines += fenced(lang, p.read_text(encoding="utf-8"))

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes, {len(files) + 1} sections)")


if __name__ == "__main__":
    main()
