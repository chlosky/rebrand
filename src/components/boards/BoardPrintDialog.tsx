import { useEffect, useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BOARD_PRINT_PRESETS,
  downloadBoardsPrintPdf,
  type BoardPrintPreset,
} from "@/lib/boards/renderBoard";
import { downloadPhoneWallpaper } from "@/lib/boards/phoneWallpaper";
import type { Board } from "@/lib/boards/types";
import { toast } from "sonner";

type DownloadOptionId = BoardPrintPreset["id"] | "phone-wallpaper";

const DOWNLOAD_OPTIONS: { id: DownloadOptionId; label: string; description: string }[] = [
  ...BOARD_PRINT_PRESETS.map((p) => ({
    id: p.id,
    label: `${p.label} — ${p.dpi} DPI`,
    description: p.description,
  })),
  {
    id: "phone-wallpaper",
    label: "Phone wallpaper",
    description: "Portrait PNG for your phone — pick one board below",
  },
];

type BoardPrintDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boards: Board[];
  activeBoardId: string;
  getLayoutJson: (boardId: string) => Record<string, unknown>;
};

export function BoardPrintDialog({
  open,
  onOpenChange,
  boards,
  activeBoardId,
  getLayoutJson,
}: BoardPrintDialogProps) {
  const [optionId, setOptionId] = useState<DownloadOptionId>("letter");
  const [selectedBoardIds, setSelectedBoardIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const isPhoneWallpaper = optionId === "phone-wallpaper";
  const printPreset = BOARD_PRINT_PRESETS.find((p) => p.id === optionId);
  const option = DOWNLOAD_OPTIONS.find((o) => o.id === optionId) ?? DOWNLOAD_OPTIONS[1];

  useEffect(() => {
    if (!open) return;
    setSelectedBoardIds(boards.map((b) => b.id));
  }, [open, boards]);

  useEffect(() => {
    if (!isPhoneWallpaper) return;
    setSelectedBoardIds((prev) => {
      if (prev.length === 1) return prev;
      const pick = boards.some((b) => b.id === activeBoardId) ? activeBoardId : boards[0]?.id;
      return pick ? [pick] : [];
    });
  }, [isPhoneWallpaper, activeBoardId, boards]);

  const selectedBoards = useMemo(
    () => boards.filter((b) => selectedBoardIds.includes(b.id)),
    [boards, selectedBoardIds],
  );

  const canDownload = isPhoneWallpaper ? selectedBoards.length === 1 : selectedBoards.length > 0;

  const selectPhoneWallpaperBoard = (boardId: string) => {
    setSelectedBoardIds([boardId]);
  };

  const toggleBoard = (boardId: string, checked: boolean) => {
    setSelectedBoardIds((prev) => {
      if (checked) return prev.includes(boardId) ? prev : [...prev, boardId];
      return prev.filter((id) => id !== boardId);
    });
  };

  const handleDownload = async () => {
    if (!canDownload) return;
    setBusy(true);
    try {
      if (isPhoneWallpaper) {
        const board = selectedBoards[0];
        if (!board) return;
        await downloadPhoneWallpaper(
          getLayoutJson(board.id),
          board.color_key,
          board.title,
        );
        toast.success(`Downloaded ${board.title} as phone wallpaper`);
      } else if (printPreset) {
        const sources = selectedBoards.map((board) => ({
          layoutJson: getLayoutJson(board.id),
          colorKey: board.color_key,
          title: board.title,
        }));

        await downloadBoardsPrintPdf(sources, printPreset);
        toast.success(
          sources.length === 1
            ? `Downloaded ${sources[0].title} as PDF (${printPreset.label})`
            : `Downloaded ${sources.length} boards as PDF (${printPreset.label})`,
        );
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Board download failed:", err);
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Download</DialogTitle>
          <DialogDescription>
            {isPhoneWallpaper
              ? "Pick one board below. Downloads as a PNG phone wallpaper."
              : "Choose a print format and select boards. Downloads as PDF (one page per board)."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Format</Label>
            <select
              className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
              value={optionId}
              onChange={(e) => {
                const next = e.target.value as DownloadOptionId;
                setOptionId(next);
                if (next === "phone-wallpaper") {
                  const pick = boards.some((b) => b.id === activeBoardId) ? activeBoardId : boards[0]?.id;
                  if (pick) setSelectedBoardIds([pick]);
                } else if (selectedBoardIds.length <= 1) {
                  setSelectedBoardIds(boards.map((b) => b.id));
                }
              }}
            >
              {DOWNLOAD_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] leading-snug text-neutral-500">{option.description}</p>
            {printPreset && printPreset.dpi === 300 && printPreset.pageWidthIn >= 18 && (
              <p className="text-[11px] leading-snug text-amber-800">
                Large exports can take a moment and produce a big file.
              </p>
            )}
          </div>

          {boards.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Boards</Label>
                {!isPhoneWallpaper && boards.length > 1 ? (
                  <button
                    type="button"
                    className="text-[11px] text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline"
                    onClick={() =>
                      setSelectedBoardIds(
                        selectedBoardIds.length === boards.length ? [] : boards.map((b) => b.id),
                      )
                    }
                  >
                    {selectedBoardIds.length === boards.length ? "Deselect all" : "Select all"}
                  </button>
                ) : null}
              </div>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-neutral-200 p-2">
                {boards.map((board) => {
                  const checked = selectedBoardIds.includes(board.id);
                  return (
                    <label
                      key={board.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-neutral-50"
                    >
                      {isPhoneWallpaper ? (
                        <input
                          type="radio"
                          name="download-board"
                          checked={checked}
                          onChange={() => selectPhoneWallpaperBoard(board.id)}
                          className="h-4 w-4 shrink-0 accent-neutral-900"
                        />
                      ) : (
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => toggleBoard(board.id, value === true)}
                        />
                      )}
                      <span className="min-w-0 truncate">
                        {board.title}
                        {board.id === activeBoardId ? (
                          <span className="ml-1 text-[11px] text-neutral-400">(current)</span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="text-[11px] leading-snug text-neutral-500">
                {isPhoneWallpaper
                  ? selectedBoards.length === 1
                    ? "One board — downloads as PNG."
                    : "Pick one board."
                  : selectedBoards.length === 0
                    ? "Select at least one board."
                    : selectedBoards.length === 1
                      ? "One board — downloads as PDF."
                      : `${selectedBoards.length} boards — one page each in a PDF.`}
              </p>
            </div>
          )}
        </div>

        <Button className="gap-2" disabled={busy || !canDownload} onClick={() => void handleDownload()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {isPhoneWallpaper ? "Download PNG" : "Download PDF"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
