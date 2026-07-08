import { readArtboardSizeFromLayoutJson } from "@/lib/boards/artboard";
import { boardFillForKey } from "@/lib/boards/colors";
import { fitArtboardInBox } from "@/lib/boards/layoutScale";
import { renderBoardToBlob } from "@/lib/boards/renderBoard";
import { saveBoardImageBlob } from "@/lib/boards/saveBoardImage";

const PHONE_WIDTH = 1080;
const PHONE_HEIGHT = 2340;

export async function downloadPhoneWallpaper(
  layoutJson: Record<string, unknown>,
  colorKey: string,
  boardTitle: string,
): Promise<"download" | "share"> {
  const source = readArtboardSizeFromLayoutJson(layoutJson);
  const blob = await renderBoardToBlob({
    layoutJson,
    colorKey,
    pageWidthPx: PHONE_WIDTH,
    pageHeightPx: PHONE_HEIGHT,
    artboardWidth: source.width,
    artboardHeight: source.height,
    backgroundPageColor: boardFillForKey(colorKey),
    contentBox: fitArtboardInBox(PHONE_WIDTH, PHONE_HEIGHT, source.width, source.height),
  });
  const slug = boardTitle.replace(/[/\\?%*:|"<>]/g, "-").slice(0, 40) || "board";
  return saveBoardImageBlob(blob, `palette-plot-${slug}-phone.png`);
}
