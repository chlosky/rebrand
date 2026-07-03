import { useState } from "react";
import { Copy, ImageIcon, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Board } from "@/lib/boards/types";
import type { BoardCanvasHandle } from "@/components/boards/BoardCanvasEditor";
import { renderBoardArtboardDataUrl } from "@/lib/boards/renderBoard";
import { toast } from "sonner";

type BoardImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boards: Board[];
  activeBoardId: string;
  editorRef: React.RefObject<BoardCanvasHandle | null>;
};

export function BoardImportDialog({
  open,
  onOpenChange,
  boards,
  activeBoardId,
  editorRef,
}: BoardImportDialogProps) {
  const [sourceId, setSourceId] = useState("");
  const [busy, setBusy] = useState<"image" | "copy" | null>(null);

  const sources = boards.filter((b) => b.id !== activeBoardId);

  const source = sources.find((b) => b.id === sourceId) ?? sources[0];

  const importAsImage = async () => {
    if (!source || !editorRef.current) return;
    setBusy("image");
    try {
      const dataUrl = await renderBoardArtboardDataUrl(source.layout_json, source.color_key);
      await editorRef.current.addImageFromUrl(dataUrl, { fit: "default" });
      toast.success(`Imported snapshot from ${source.title}`);
      onOpenChange(false);
    } catch {
      toast.error("Could not import board image");
    } finally {
      setBusy(null);
    }
  };

  const copyElements = async () => {
    if (!source || !editorRef.current) return;
    setBusy("copy");
    try {
      await editorRef.current.mergeLayoutObjects(source.layout_json, { x: 48, y: 48 });
      toast.success(`Copied elements from ${source.title}`);
      onOpenChange(false);
    } catch {
      toast.error("Could not copy board elements");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import from another board</DialogTitle>
          <DialogDescription>
            Pull content from a focus board or The Plan into this artboard — useful when digitizing a physical
            setup or remixing between boards.
          </DialogDescription>
        </DialogHeader>

        {sources.length === 0 ? (
          <p className="text-sm text-neutral-500">Add another board to your workspace first.</p>
        ) : (
          <>
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700">Source board</label>
              <select
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
                value={source?.id ?? ""}
                onChange={(e) => setSourceId(e.target.value)}
              >
                {sources.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({b.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <Button variant="outline" className="justify-start gap-2" disabled={!!busy} onClick={() => void importAsImage()}>
                {busy === "image" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                Import as image layer
              </Button>
              <Button variant="outline" className="justify-start gap-2" disabled={!!busy} onClick={() => void copyElements()}>
                {busy === "copy" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                Copy editable elements
              </Button>
            </div>
            <p className="text-[10px] text-neutral-500">
              Image import is a flat snapshot. Copy elements keeps text and stickers editable.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
