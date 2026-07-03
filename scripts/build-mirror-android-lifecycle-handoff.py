#!/usr/bin/env python3
"""Generate Android Mirror Work lifecycle/backgrounding investigation handoff (code only)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "chatgpt-mirror-android-lifecycle-handoff.md"
FENCE = "```"

FILES = [
    "src/pages/features/MirrorRehearsalRoute.tsx",
    "src/plugins/nativeMirror.ts",
    "src/lib/overlayBootstrap.ts",
    "src/pages/features/MirrorRehearsalAndroid.tsx",
    "android/app/src/main/java/com/paletteplotting/app/MainActivity.java",
    "android/app/src/main/java/com/paletteplotting/app/NativeMirrorPlugin.java",
    "android/app/src/main/java/com/paletteplotting/app/NativeMirrorView.java",
    "android/app/src/main/AndroidManifest.xml",
    "android/app/build.gradle",
]

LANG = {
    ".ts": "typescript",
    ".tsx": "tsx",
    ".java": "java",
    ".xml": "xml",
    ".gradle": "gradle",
}


def android_version_code() -> str:
    bg = ROOT / "android/app/build.gradle"
    if bg.exists():
        match = re.search(r"versionCode\s+(\d+)", bg.read_text(encoding="utf-8"))
        if match:
            return match.group(1)
    return "?"


def app_resume_pattern_excerpt() -> str:
    """YourDouble + DashboardSkyBackground: Capacitor App resume pattern Mirror Android lacks."""
    chunks: list[str] = []
    for rel, label in (
        ("src/components/dashboard/DashboardSkyBackground.tsx", "DashboardSkyBackground"),
        ("src/pages/features/YourDouble.tsx", "YourDouble"),
    ):
        p = ROOT / rel
        if not p.exists():
            continue
        text = p.read_text(encoding="utf-8")
        chunks.append(f"// --- {label}: visibilitychange + App.addListener('resume') ---")
        for i, line in enumerate(text.splitlines()):
            if "visibilitychange" in line or "App.addListener" in line or "appStateChange" in line:
                start = max(0, i - 8)
                end = min(len(text.splitlines()), i + 25)
                chunks.append("\n".join(text.splitlines()[start:end]))
                chunks.append("")
                break
    return "\n".join(chunks)


def fenced(lang: str, body: str) -> list[str]:
    return [FENCE + lang, body.rstrip(), FENCE, ""]


def main() -> None:
    version_code = android_version_code()
    lines = [
        "# Android Mirror Work — lifecycle / backgrounding code handoff",
        "",
        f"Branch: Mobile-app | versionCode: {version_code}",
        f"Files: {len(FILES) + 1}",
        "",
        "Issue: Mirror Work intermittently sends app to Android Home (Activity backgrounded).",
        "App stays in recents, resumes to same Mirror screen — not full crash, not JS route nav.",
        "",
        "Investigate: lifecycle logs, visibilitychange (MirrorRehearsalAndroid ~3901),",
        "native/web camera handoff (~3396–3498), no moveTaskToBack/finish in repo.",
        "",
        "Separate: Android scene WebAudio gain too low (rain 0.14, summit 0.06) — bump Android-only.",
        "",
        "Do NOT: rewrite scene visuals, change iOS/web, re-enable mic confidence meter.",
        "",
        "---",
        "",
        "## Reference: App resume pattern (other screens, not Mirror Android)",
        "",
    ]
    lines += fenced("tsx", app_resume_pattern_excerpt())

    for rel in FILES:
        p = ROOT / rel
        lines.append(f"## {rel}")
        lines.append("")
        if not p.exists():
            lines += ["(missing)", ""]
            continue
        lang = LANG.get(p.suffix, p.suffix.lstrip("."))
        lines += fenced(lang, p.read_text(encoding="utf-8"))

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes, {len(FILES) + 1} sections)")


if __name__ == "__main__":
    main()
