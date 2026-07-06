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
  downloadBoardPrint,
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
    description: "Portrait PNG for your phone — current board only",
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

  const selectedBoards = useMemo(
    () => boards.filter((b) => selectedBoardIds.includes(b.id)),
    [boards, selectedBoardIds],
  );

  const activeBoard = boards.find((b) => b.id === activeBoardId) ?? boards[0];
  const downloadAsPdf = !isPhoneWallpaper && selectedBoards.length > 1;
  const canDownload = isPhoneWallpaper ? Boolean(activeBoard) : selectedBoards.length > 0;

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
      if (isPhoneWallpaper && activeBoard) {
        await downloadPhoneWallpaper(
          getLayoutJson(activeBoard.id),
          activeBoard.color_key,
          activeBoard.title,
        );
        toast.success("Phone wallpaper downloaded");
      } else if (printPreset) {
        const sources = selectedBoards.map((board) => ({
          layoutJson: getLayoutJson(board.id),
          colorKey: board.color_key,
          title: board.title,
        }));

        if (sources.length === 1) {
          await downloadBoardPrint(
            sources[0].layoutJson,
            sources[0].colorKey,
            printPreset,
            sources[0].title,
          );
          toast.success(`Downloaded ${sources[0].title} (${printPreset.label})`);
        } else {
          await downloadBoardsPrintPdf(sources, printPreset);
          toast.success(`Downloaded ${sources.length} boards as PDF (${printPreset.label})`);
        }
      }
      onOpenChange(false);
    } catch {
      toast.error("Download failed");
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
              ? "Choose a format and download the current board as a PNG."
              : "Choose a print format and select boards. One board downloads as PNG; multiple boards download as a multi-page PDF."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Format</Label>
            <select
              className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
              value={optionId}
              onChange={(e) => setOptionId(e.target.value as DownloadOptionId)}
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
                Large exports can take a moment and produce a big file — ideal for professional printing.
              </p>
            )}
          </div>

          {!isPhoneWallpaper && boards.length > 1 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Vision</Label>
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
              </div>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-neutral-200 p-2">
                {boards.map((board) => {
                  const checked = selectedBoardIds.includes(board.id);
                  return (
                    <label
                      key={board.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-neutral-50"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => toggleBoard(board.id, value === true)}
                      />
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
                {selectedBoards.length === 0
                  ? "Select at least one board."
                  : selectedBoards.length === 1
                    ? "One board — downloads as PNG."
                    : `${selectedBoards.length} boards — one page each in a PDF.`}
              </p>
            </div>
          )}

          {isPhoneWallpaper && activeBoard && (
            <p className="text-[11px] leading-snug text-neutral-500">
              Downloading <span className="font-medium text-neutral-700">{activeBoard.title}</span> only.
            </p>
          )}
        </div>

        <Button className="gap-2" disabled={busy || !canDownload} onClick={() => void handleDownload()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {isPhoneWallpaper ? "Download PNG" : downloadAsPdf ? "Download PDF" : "Download PNG"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
