#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "chatgpt-android-splash-launcher-handoff-v243.md"
FENCE = "```"

HOME_SCREEN_TEXT = [
    "android/app/src/main/res/values/ic_launcher_background.xml",
    "android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml",
    "android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml",
    "ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json",
    "ios/App/App/Assets.xcassets/AppIcon.appiconset/SOURCE.txt",
    "public/manifest.json",
    "scripts/generate-favicon-pngs.mjs",
    "scripts/compose-launcher-icons.py",
]

HOME_SCREEN_BINARY = [
    "public/welcome-logo.png",
    "public/apple-ios-logo.png",
    "public/icon-196.png",
    "public/icon-512.png",
    "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
    "android/app/src/main/res/mipmap-hdpi/ic_launcher.png",
    "android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png",
    "android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png",
    "android/app/src/main/res/mipmap-mdpi/ic_launcher.png",
    "android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png",
    "android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png",
    "android/app/src/main/res/mipmap-xhdpi/ic_launcher.png",
    "android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png",
    "android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png",
    "android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png",
    "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png",
    "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png",
    "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png",
    "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png",
    "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png",
]

TEXT_FILES = [
    "android/app/src/main/res/values-v31/styles.xml",
    "android/app/src/main/res/values/styles.xml",
    "android/app/src/main/res/values/colors.xml",
    "android/app/src/main/res/drawable/splash.xml",
    "android/app/src/main/res/drawable/ic_paletteplotting_splash_wordmark_vector.xml",
    "android/app/src/main/AndroidManifest.xml",
    "android/app/src/main/java/com/paletteplotting/app/MainActivity.java",
    "android/variables.gradle",
    "capacitor.config.ts",
    "android/app/src/main/assets/capacitor.config.json",
    "ios/App/App/capacitor.config.json",
    "scripts/extract-splash-wordmark.py",
    "scripts/compose-splash-assets.py",
    "src/components/NativeAppRootRedirect.tsx",
    "src/pages/onboarding/Welcome.tsx",
    "ios/App/App/Base.lproj/LaunchScreen.storyboard",
    "ios/App/App/Assets.xcassets/SplashLogo.imageset/Contents.json",
    "ios/App/App/Assets.xcassets/Splash.imageset/Contents.json",
]

BINARY = [
    "android/app/src/main/res/drawable-nodpi/ic_paletteplotting_splash_wordmark.png",
    "android/app/src/main/res/drawable-nodpi/ic_paletteplotting_splash_flat.png",
    "android/app/src/main/res/drawable-nodpi/ic_paletteplotting_splash_icon_flat.png",
    "public/welcome-logo.png",
    "public/welcome-logo-mark-only.png",
    "public/apple-ios-logo.png",
    "ios/App/App/Assets.xcassets/SplashLogo.imageset/splash-logo.png",
    "ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png",
    "ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png",
    "ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png",
]

LANG = {
    ".ts": "typescript",
    ".tsx": "tsx",
    ".xml": "xml",
    ".java": "java",
    ".gradle": "gradle",
    ".json": "json",
    ".py": "python",
    ".storyboard": "xml",
}


def fenced(lang: str, body: str) -> list[str]:
    return [FENCE + lang, body.rstrip(), FENCE, ""]


def main() -> None:
    bg = (ROOT / "android/app/build.gradle").read_text(encoding="utf-8")
    vc_match = re.search(r"versionCode\s+(\d+)", bg)
    version_code = vc_match.group(1) if vc_match else "?"

    lines = [
        "# Android splash + launch + home screen icon — full code handoff",
        "",
        "Branch: Mobile-app",
        f"versionCode: {version_code}",
        "",
        "---",
        "",
        "# Splash + launch",
        "",
    ]

    excerpt = "\n".join(
        line.strip()
        for line in bg.splitlines()
        if "versionCode" in line or "core-splashscreen" in line
    )
    lines += ["## android/app/build.gradle (excerpt)", ""] + fenced("gradle", excerpt)

    plist = (ROOT / "ios/App/App/Info.plist").read_text(encoding="utf-8")
    pex: list[str] = []
    for key in ("UILaunchStoryboardName", "UIMainStoryboardFile"):
        i = plist.find(f"<key>{key}</key>")
        if i >= 0:
            end = plist.find("\n", plist.find("</string>", i) + 1) + 1
            pex.append(plist[i:end].rstrip())
    lines += ["## ios/App/App/Info.plist (excerpt)", ""] + fenced("xml", "\n".join(pex))

    app = (ROOT / "src/App.tsx").read_text(encoding="utf-8")
    aex = [
        line
        for line in app.splitlines()
        if "NativeAppRootRedirect" in line or "<NativeSplashGate />" in line
    ]
    lines += ["## src/App.tsx (excerpt)", ""] + fenced("tsx", "\n".join(aex))

    dash = (ROOT / "src/pages/Dashboard.tsx").read_text(encoding="utf-8")
    dex: list[str] = []
    capture = False
    for line in dash.splitlines():
        if "signalNativeSplashReadyToHide" in line and "import" in line:
            dex.append(line)
        if "Native: tell the splash gate" in line:
            capture = True
        if capture:
            dex.append(line)
            if line.strip() == "}, []);":
                break
    lines += ["## src/pages/Dashboard.tsx (excerpt)", ""] + fenced("tsx", "\n".join(dex))

    auth = (ROOT / "src/contexts/AuthContext.tsx").read_text(encoding="utf-8")
    start = auth.find("// (3) Safety timeout")
    end = auth.find("}, 3000);", start) + len("}, 3000);")
    lines += ["## src/contexts/AuthContext.tsx (excerpt)", ""] + fenced("tsx", auth[start:end])

    for rel in TEXT_FILES:
        p = ROOT / rel
        lines.append(f"## {rel}")
        lines.append("")
        if not p.exists():
            lines += ["(missing)", ""]
            continue
        lang = LANG.get(p.suffix, p.suffix.lstrip("."))
        lines += fenced(lang, p.read_text(encoding="utf-8"))

    lines += ["## Binary assets (not inlined)", ""]
    for rel in BINARY:
        p = ROOT / rel
        if p.exists():
            lines.append(f"- {rel} ({p.stat().st_size} bytes)")
        else:
            lines.append(f"- {rel} (missing)")

    lines += [
        "",
        "---",
        "",
        "# Home screen icon",
        "",
    ]

    manifest = (ROOT / "android/app/src/main/AndroidManifest.xml").read_text(encoding="utf-8")
    mex: list[str] = []
    for line in manifest.splitlines():
        if "android:icon=" in line or "android:roundIcon=" in line:
            mex.append(line.strip())
    lines += ["## android/app/src/main/AndroidManifest.xml (icon excerpt)", ""] + fenced("xml", "\n".join(mex))

    index = (ROOT / "index.html").read_text(encoding="utf-8")
    iex = [line for line in index.splitlines() if "icon" in line.lower() and ("link rel" in line or "apple-touch" in line)]
    lines += ["## index.html (icon links excerpt)", ""] + fenced("html", "\n".join(iex))

    welcome = (ROOT / "src/pages/onboarding/Welcome.tsx").read_text(encoding="utf-8")
    for line in welcome.splitlines():
        if "AppIcon" in line or "apple-ios-logo" in line:
            lines += ["## src/pages/onboarding/Welcome.tsx (AppIcon comment excerpt)", ""] + fenced("tsx", line)
            break

    for rel in HOME_SCREEN_TEXT:
        p = ROOT / rel
        lines.append(f"## {rel}")
        lines.append("")
        if not p.exists():
            lines += ["(missing)", ""]
            continue
        lang = LANG.get(p.suffix, p.suffix.lstrip("."))
        if p.suffix == ".mjs":
            lang = "javascript"
        lines += fenced(lang, p.read_text(encoding="utf-8"))

    lines += ["## Home screen binary assets (not inlined)", ""]
    for rel in HOME_SCREEN_BINARY:
        p = ROOT / rel
        if p.exists():
            lines.append(f"- {rel} ({p.stat().st_size} bytes)")
        else:
            lines.append(f"- {rel} (missing)")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
