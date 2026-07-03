import { useEffect, useState } from "react";
import { ImageIcon, Loader2, Lock, Smartphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Capacitor } from "@capacitor/core";
import {
  PHONE_WALLPAPER_PRESETS,
  renderPhoneWallpaperBlob,
  resolvePhonePreset,
  savePhoneWallpaper,
  type PhoneWallpaperMode,
  type PhoneWallpaperStyle,
} from "@/lib/boards/phoneWallpaper";
import { toast } from "sonner";

type BoardWallpaperDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layoutJson: Record<string, unknown>;
  colorKey: string;
  boardTitle: string;
};

export function BoardWallpaperDialog({
  open,
  onOpenChange,
  layoutJson,
  colorKey,
  boardTitle,
}: BoardWallpaperDialogProps) {
  const [presetId, setPresetId] = useState("auto");
  const [style, setStyle] = useState<PhoneWallpaperStyle>("fit");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<PhoneWallpaperMode>("wallpaper");
  const [busy, setBusy] = useState<PhoneWallpaperMode | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const resolved = resolvePhonePreset(presetId);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!open) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);
    void (async () => {
      try {
        const blob = await renderPhoneWallpaperBlob(layoutJson, colorKey, {
          mode: previewMode,
          style,
          width: Math.round(resolved.width / 3),
          height: Math.round(resolved.height / 3),
        });
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch {
        if (!cancelled) setPreviewUrl(null);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, layoutJson, colorKey, previewMode, style, presetId, resolved.width, resolved.height]);

  const handleSave = async (mode: PhoneWallpaperMode) => {
    setBusy(mode);
    try {
      const result = await savePhoneWallpaper(layoutJson, colorKey, boardTitle, {
        mode,
        style,
        presetId,
      });
      if (result === "share") {
        toast.success(
          mode === "lockscreen"
            ? "Choose Save Image — then set as Lock Screen in Settings → Wallpaper"
            : "Choose Save Image — then set as Wallpaper in Settings",
        );
      } else {
        toast.success(
          mode === "lockscreen"
            ? "Lock screen image downloaded — open it on your phone and set as lock screen"
            : "Wallpaper downloaded — open on your phone and set as wallpaper",
        );
      }
      onOpenChange(false);
    } catch {
      toast.error("Could not create phone image");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Phone wallpaper
          </DialogTitle>
          <DialogDescription>
            Turn this board into a portrait image sized for your phone. Lock screen layout nudges your
            board below the clock area.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center">
          <div className="relative aspect-[9/19.5] w-[min(100%,11rem)] overflow-hidden rounded-2xl border-4 border-neutral-800 bg-neutral-900 shadow-lg">
            {previewLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white/60" />
              </div>
            ) : previewUrl ? (
              <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-white/50">Preview</div>
            )}
            {previewMode === "lockscreen" && (
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-[22%] bg-gradient-to-b from-black/35 to-transparent"
                aria-hidden
              />
            )}
            <div className="pointer-events-none absolute inset-x-0 top-3 text-center text-[10px] font-medium text-white/80">
              {previewMode === "lockscreen" ? "9:41" : ""}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
              previewMode === "wallpaper"
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 hover:bg-neutral-50"
            }`}
            onClick={() => setPreviewMode("wallpaper")}
          >
            <ImageIcon className="mb-1 h-4 w-4" />
            Wallpaper
          </button>
          <button
            type="button"
            className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
              previewMode === "lockscreen"
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 hover:bg-neutral-50"
            }`}
            onClick={() => setPreviewMode("lockscreen")}
          >
            <Lock className="mb-1 h-4 w-4" />
            Lock screen
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Phone size</Label>
            <select
              className="w-full rounded-md border border-neutral-200 px-2 py-2 text-sm"
              value={presetId}
              onChange={(e) => setPresetId(e.target.value)}
            >
              {PHONE_WALLPAPER_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id === "auto"
                    ? `This device (${resolved.width}×${resolved.height})`
                    : `${p.label} — ${p.width}×${p.height}`}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Layout</Label>
            <select
              className="w-full rounded-md border border-neutral-200 px-2 py-2 text-sm"
              value={style}
              onChange={(e) => setStyle(e.target.value as PhoneWallpaperStyle)}
            >
              <option value="fit">Fit — whole board visible</option>
              <option value="fill">Fill — edge-to-edge crop</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            className="gap-2"
            disabled={!!busy}
            onClick={() => void handleSave("wallpaper")}
          >
            {busy === "wallpaper" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
            Save as wallpaper
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            disabled={!!busy}
            onClick={() => void handleSave("lockscreen")}
          >
            {busy === "lockscreen" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            Save as lock screen
          </Button>
        </div>

        <p className="text-[10px] leading-snug text-neutral-500">
          {isNative
            ? "Opens the share sheet — tap Save Image, then set it in Settings → Wallpaper."
            : "On mobile browsers, use Share → Save Image. On desktop, download and AirDrop or transfer to your phone."}
        </p>
      </DialogContent>
    </Dialog>
  );
}
