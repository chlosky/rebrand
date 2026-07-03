import { useState } from "react";
import { Download, Loader2, Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  BOARD_PRINT_PRESETS,
  downloadBoardPrint,
  openBoardPrintWindow,
  type BoardPrintPreset,
} from "@/lib/boards/renderBoard";
import { toast } from "sonner";

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
  const [presetId, setPresetId] = useState<BoardPrintPreset["id"]>("letter");
  const [busy, setBusy] = useState<"download" | "print" | null>(null);

  const preset = BOARD_PRINT_PRESETS.find((p) => p.id === presetId) ?? BOARD_PRINT_PRESETS[1];

  const run = async (mode: "download" | "print") => {
    setBusy(mode);
    try {
      if (mode === "download") {
        await downloadBoardPrint(layoutJson, colorKey, preset);
        toast.success(`Downloaded ${boardTitle} (${preset.label})`);
      } else {
        await openBoardPrintWindow(layoutJson, colorKey, preset);
      }
    } catch {
      toast.error(mode === "download" ? "Export failed" : "Could not open print window — allow popups");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Print or export</DialogTitle>
          <DialogDescription>
            Download a high-resolution PNG for home printing or take to a print shop (FedEx Office, Kinko&apos;s, etc.).
            The 24×36&quot; preset matches paletteplot.com acrylic boards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label className="text-xs">Size</Label>
          <select
            className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
            value={presetId}
            onChange={(e) => setPresetId(e.target.value as BoardPrintPreset["id"])}
          >
            {BOARD_PRINT_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} — {p.dpi} DPI
              </option>
            ))}
          </select>
          <p className="text-[11px] leading-snug text-neutral-500">{preset.description}</p>
          {preset.dpi === 300 && preset.pageWidthIn >= 18 && (
            <p className="text-[11px] leading-snug text-amber-800">
              Large exports can take a moment and produce a big file — ideal for professional printing.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1 gap-2" disabled={!!busy} onClick={() => void run("download")}>
            {busy === "download" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download PNG
          </Button>
          <Button variant="outline" className="flex-1 gap-2" disabled={!!busy} onClick={() => void run("print")}>
            {busy === "print" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
