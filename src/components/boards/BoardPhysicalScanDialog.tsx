import { useRef, useState } from "react";
import { Camera, Loader2, ScanText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ARTBOARD_HEIGHT, ARTBOARD_WIDTH } from "@/components/boards/BoardCanvasEditor";
import type { BoardCanvasHandle } from "@/components/boards/BoardCanvasEditor";
import {
  computeCoverPlacement,
  mapOcrBlockToCanvas,
  recognizeTextFromImage,
} from "@/lib/boards/ocrImport";
import { uploadBoardImage } from "@/lib/boards/api";
import { toast } from "sonner";

type BoardPhysicalScanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  editorRef: React.RefObject<BoardCanvasHandle | null>;
};

export function BoardPhysicalScanDialog({
  open,
  onOpenChange,
  userId,
  editorRef,
}: BoardPhysicalScanDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [addPhoto, setAddPhoto] = useState(true);
  const [runOcr, setRunOcr] = useState(true);
  const [saveUpload, setSaveUpload] = useState(true);
  const [working, setWorking] = useState(false);
  const [ocrPreview, setOcrPreview] = useState<string[]>([]);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    setOcrPreview([]);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const onPickFile = (f: File | null) => {
    if (!f) return;
    reset();
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const previewOcr = async () => {
    if (!file) return;
    setWorking(true);
    try {
      const result = await recognizeTextFromImage(file);
      setOcrPreview(result.blocks.map((b) => b.text).slice(0, 12));
      if (!result.blocks.length) {
        toast.message("No clear text found — try a straighter photo with good lighting");
      }
    } catch {
      toast.error("Couldn't read text — you can still import the photo");
    } finally {
      setWorking(false);
    }
  };

  const handleImport = async () => {
    if (!file || !editorRef.current) return;
    setWorking(true);
    try {
      let imageWidth = 0;
      let imageHeight = 0;

      if (addPhoto) {
        const dims = await editorRef.current.addImageFromFile(file, { fit: "cover", sendToBack: true });
        imageWidth = dims.width;
        imageHeight = dims.height;
      } else {
        const bitmap = await createImageBitmap(file);
        imageWidth = bitmap.width;
        imageHeight = bitmap.height;
        bitmap.close();
      }

      if (runOcr) {
        const result = await recognizeTextFromImage(file);
        const placement = computeCoverPlacement(imageWidth, imageHeight, ARTBOARD_WIDTH, ARTBOARD_HEIGHT);
        let added = 0;
        for (const block of result.blocks.slice(0, 25)) {
          const pos = mapOcrBlockToCanvas(block, placement);
          editorRef.current.addTextAt(block.text, pos.left, pos.top, pos.fontSize);
          added++;
        }
        if (added > 0) {
          toast.success(`Added ${added} text blocks from your physical board`);
        }
      }

      if (saveUpload) {
        await uploadBoardImage(userId, file);
      }

      toast.success("Physical board imported");
      handleClose(false);
    } catch {
      toast.error("Import failed");
    } finally {
      setWorking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan physical board
          </DialogTitle>
          <DialogDescription>
            Photograph your board. We can add the photo and pull out text you can edit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {preview ? (
            <img src={preview} alt="Board preview" className="max-h-48 w-full rounded-lg border object-contain" />
          ) : (
            <button
              type="button"
              className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 py-10 text-sm text-neutral-600 hover:bg-neutral-50"
              onClick={() => inputRef.current?.click()}
            >
              <Camera className="h-8 w-8 text-neutral-400" />
              Take or upload a photo
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />

          <div className="space-y-2 rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-xs">
            <label className="flex items-center gap-2">
              <Checkbox checked={addPhoto} onCheckedChange={(v) => setAddPhoto(Boolean(v))} />
              Add photo to board
            </label>
            <label className="flex items-center gap-2">
              <Checkbox checked={runOcr} onCheckedChange={(v) => setRunOcr(Boolean(v))} />
              Pull out text to edit
            </label>
            <label className="flex items-center gap-2">
              <Checkbox checked={saveUpload} onCheckedChange={(v) => setSaveUpload(Boolean(v))} />
              Save to My photos
            </label>
          </div>

          {ocrPreview.length > 0 && (
            <div className="rounded-lg border border-neutral-100 p-2">
              <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase text-neutral-500">
                <ScanText className="h-3 w-3" />
                Detected text preview
              </p>
              <ul className="max-h-24 space-y-0.5 overflow-y-auto text-[11px] text-neutral-700">
                {ocrPreview.map((line) => (
                  <li key={line} className="truncate">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {!preview && (
              <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                Choose photo
              </Button>
            )}
            {preview && runOcr && (
              <Button type="button" variant="outline" size="sm" disabled={working} onClick={() => void previewOcr()}>
                {working ? <Loader2 className="h-4 w-4 animate-spin" /> : "Preview text"}
              </Button>
            )}
            <Button type="button" size="sm" className="ml-auto" disabled={!file || working} onClick={() => void handleImport()}>
              {working ? <Loader2 className="h-4 w-4 animate-spin" /> : "Import to board"}
            </Button>
          </div>

          <p className="text-[10px] leading-snug text-neutral-500">
            Tip: shoot straight-on in good light. Printed lettering works best; handwriting may need cleanup.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
