import { useState } from "react";
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
import { BOARD_PRINT_PRESETS, downloadBoardPrint, type BoardPrintPreset } from "@/lib/boards/renderBoard";
import { downloadPhoneWallpaper } from "@/lib/boards/phoneWallpaper";
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
    description: "Portrait image for your phone",
  },
];

type BoardPrintDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layoutJson: Record<string, unknown>;
  colorKey: string;
  boardTitle: string;
};

export function BoardPrintDialog({
  open,
  onOpenChange,
  layoutJson,
  colorKey,
  boardTitle,
}: BoardPrintDialogProps) {
  const [optionId, setOptionId] = useState<DownloadOptionId>("letter");
  const [busy, setBusy] = useState(false);

  const option = DOWNLOAD_OPTIONS.find((o) => o.id === optionId) ?? DOWNLOAD_OPTIONS[1];
  const printPreset = BOARD_PRINT_PRESETS.find((p) => p.id === optionId);

  const handleDownload = async () => {
    setBusy(true);
    try {
      if (optionId === "phone-wallpaper") {
        await downloadPhoneWallpaper(layoutJson, colorKey, boardTitle);
        toast.success("Phone wallpaper downloaded");
      } else if (printPreset) {
        await downloadBoardPrint(layoutJson, colorKey, printPreset);
        toast.success(`Downloaded ${boardTitle} (${printPreset.label})`);
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
          <DialogDescription>Choose a format and download a PNG.</DialogDescription>
        </DialogHeader>

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

        <Button className="gap-2" disabled={busy} onClick={() => void handleDownload()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download PNG
        </Button>
      </DialogContent>
    </Dialog>
  );
}
