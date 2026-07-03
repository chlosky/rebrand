import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BOARD_COLORS, type BoardColorKey } from "@/lib/boards/colors";

const SCENE_SWATCHES: {
  key: BoardColorKey;
  left: string;
  bottom: string;
  width: number;
  height: number;
  rotate: number;
  z: number;
}[] = [
  { key: "rose_gold", left: "6%", bottom: "22%", width: 52, height: 64, rotate: -14, z: 2 },
  { key: "sky_blue", left: "20%", bottom: "10%", width: 44, height: 56, rotate: 9, z: 1 },
  { key: "yellow", left: "34%", bottom: "28%", width: 40, height: 50, rotate: -6, z: 3 },
  { key: "neon_pink", left: "48%", bottom: "14%", width: 48, height: 58, rotate: 11, z: 4 },
  { key: "light_green", left: "58%", bottom: "32%", width: 42, height: 52, rotate: -10, z: 2 },
  { key: "blue", left: "70%", bottom: "16%", width: 46, height: 54, rotate: 7, z: 3 },
  { key: "orange", left: "78%", bottom: "26%", width: 38, height: 48, rotate: -8, z: 1 },
  { key: "white_opaque", left: "42%", bottom: "6%", width: 36, height: 44, rotate: 4, z: 0 },
];

function whisperIndex(pathname: string, count: number): number {
  let h = 0;
  for (let i = 0; i < pathname.length; i++) h = (h * 31 + pathname.charCodeAt(i)) >>> 0;
  return count > 0 ? h % count : 0;
}

/** Cozy studio floor — acrylic swatches, knit blanket wash, secret-club whisper. */
export function PalettePlottingBottomScene() {
  const { pathname } = useLocation();
  const { t } = useTranslation("onboarding");

  const whispers = t("plottingScene.whispers", { returnObjects: true }) as Record<string, string> | string;
  const whisperList = useMemo(() => {
    if (typeof whispers === "string") return [whispers];
    return Object.values(whispers).filter((w) => typeof w === "string" && w.length > 0);
  }, [whispers]);

  const whisper = whisperList[whisperIndex(pathname, whisperList.length)] ?? "";

  return (
    <div className="palette-plot-bottom-scene" aria-hidden>
      <div className="palette-plot-bottom-scene__wash" />
      <div className="palette-plot-bottom-scene__blanket" />
      <div className="palette-plot-bottom-scene__knit" />
      <div className="palette-plot-bottom-scene__swatches">
        {SCENE_SWATCHES.map((s) => {
          const color = BOARD_COLORS[s.key];
          return (
            <span
              key={s.key}
              className="palette-plot-swatch"
              style={{
                left: s.left,
                bottom: s.bottom,
                width: s.width,
                height: s.height,
                zIndex: s.z,
                transform: `rotate(${s.rotate}deg)`,
                background: `linear-gradient(145deg, ${color.fill} 0%, ${color.swatch}88 100%)`,
              }}
            />
          );
        })}
      </div>
      <svg
        className="palette-plot-bottom-scene__headphones"
        viewBox="0 0 200 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M40 52c0-33 26-48 60-48s60 15 60 48v8c0 8-6 14-14 14h-6c-8 0-14-6-14-14v-6c0-22-18-36-40-36S46 30 46 52v6c0 8-6 14-14 14h-6c-8 0-14-6-14-14v-8z"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {whisper ? <p className="palette-plot-bottom-scene__whisper">{whisper}</p> : null}
    </div>
  );
}
