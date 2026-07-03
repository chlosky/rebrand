#!/usr/bin/env python3
"""Generate Android post-paywall provisioning handoff (full path + shared code, code only)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "chatgpt-android-post-paywall-provisioning-handoff.md"
FENCE = "```"

GLOBS = [
    "src/pages/onboarding/setup/*.ts",
    "src/pages/onboarding/setup/*.tsx",
    "src/components/onboarding/*",
]

EXPLICIT = [
    # App shell + routes (full file — includes /onboarding/android-post-paywall + setup routes)
    "src/App.tsx",
    "src/components/ProtectedRoute.tsx",
    "src/pages/Dashboard.tsx",
    # Android paywall + signup entry
    "src/pages/onboarding/AndroidPaywall.tsx",
    "src/pages/onboarding/EmailCollection.tsx",
    # Android post-paywall loading (2.8s cap + background provisioning)
    "src/pages/onboarding/AndroidPostPaywallLoading.tsx",
    # Android paywall / entitlement flow
    "src/lib/runAndroidPaywallFlow.ts",
    "src/lib/androidPostPurchaseEntitlementGate.ts",
    "src/lib/isAndroidPaywallContext.ts",
    "src/lib/onboardingFlow.ts",
    "src/lib/onboardingSetupTheme.ts",
    "src/lib/onboardingReadAffirmations.ts",
    "src/lib/conditionalSpecificityStep7.ts",
    "src/lib/conditionalSpecificityStorage.ts",
    # Setup draft → provisioning inputs (shared)
    "src/lib/setupDraft.ts",
    "src/lib/setupDraftBackendSync.ts",
    "src/lib/embodyPracticesCatalog.ts",
    "src/lib/affirmations-data.ts",
    # Provisioning pipeline (shared iOS + Android)
    "src/lib/postPaywallProvisioning.ts",
    "src/lib/audioProcessor.ts",
    # RevenueCat (native — required for Google Play entitlement sync)
    "src/services/revenueCat.ts",
    "src/services/pushNotifications.ts",
    # Shared UI used by setup / Android paywall / loading screens
    "src/components/IosAppHeader.tsx",
    "src/components/ui/button.tsx",
    "src/components/ui/card.tsx",
    "src/components/ui/checkbox.tsx",
    "src/components/ui/input.tsx",
    "src/components/ui/label.tsx",
    "src/components/ui/textarea.tsx",
    "src/lib/utils.ts",
    "src/debugLog.ts",
    # Hooks + auth used by setup / Android paywall
    "src/hooks/useOnboardingSession.ts",
    "src/hooks/use-native-app.ts",
    "src/contexts/AuthContext.tsx",
    "src/integrations/supabase/client.ts",
    "src/integrations/supabase/types.ts",
    # DB
    "supabase/migrations/20260505120000_user_setup_path_tables.sql",
    "supabase/migrations/20260514200000_add_user_plans_starter_provisioned.sql",
    # Edge functions
    "supabase/functions/sync-revenuecat-entitlement/index.ts",
    "supabase/functions/generate-affirmations/index.ts",
    "supabase/functions/generate-affirmation-audio/index.ts",
    "supabase/functions/get-subliminal-params/index.ts",
    "supabase/functions/post-paywall-welcome-message/index.ts",
    "supabase/functions/claim-onboarding-session/index.ts",
    "supabase/functions/update-onboarding-session/index.ts",
    "supabase/functions/_shared/supportCategories.ts",
    "supabase/functions/_shared/manifestationLexicon.ts",
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


def collect_files() -> list[str]:
    found: set[str] = set(EXPLICIT)
    for pattern in GLOBS:
        for path in ROOT.glob(pattern):
            if path.is_file():
                found.add(path.relative_to(ROOT).as_posix())
    return sorted(found)


def fenced(lang: str, body: str) -> list[str]:
    return [FENCE + lang, body.rstrip(), FENCE, ""]


def main() -> None:
    version_code = android_version_code()
    files = collect_files()
    lines = [
        "# Android post-paywall provisioning — full code handoff",
        "",
        "Branch: Mobile-app",
        f"versionCode: {version_code}",
        f"Files: {len(files)}",
        "",
        "Android path: setup → AndroidPaywall / signup email → runAndroidPaywallFlow →",
        "/onboarding/android-post-paywall → androidPostPurchaseEntitlementGate →",
        "dashboard (≤2.8s cap, optimistic) + background provisionPostPaywallIfNeeded.",
        "",
        "Includes shared setup UI, postPaywallProvisioning, edge functions, migrations.",
        "Excludes iOS-only and web-Stripe paywall modules.",
        "",
        "---",
        "",
    ]

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
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes, {len(files)} files)")


if __name__ == "__main__":
    main()
