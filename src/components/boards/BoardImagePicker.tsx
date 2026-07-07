import { useCallback, useEffect, useState } from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BOARD_IMAGE_THEMES,
  filterLibraryByTheme,
  getCachedBoardImageLibrary,
  loadBoardImageLibrary,
  type BoardImageTheme,
} from "@/lib/boards/imageLibrary";
import { listUserUploads, uploadBoardImage } from "@/lib/boards/api";
import type { BoardImageAsset } from "@/lib/boards/types";

type BoardImagePickerProps = {
  userId: string;
  onPickImage?: (url: string) => void;
  embedded?: boolean;
  /** Workspace Image Library: user uploads only (no stock collection). */
  uploadsOnly?: boolean;
};

type Tab = "library" | "uploads";

const uploadsCache = new Map<string, { path: string; signedUrl: string }[]>();

export function BoardImagePicker({
  userId,
  onPickImage,
  embedded,
  uploadsOnly = false,
}: BoardImagePickerProps) {
  const [tab, setTab] = useState<Tab>(uploadsOnly ? "uploads" : "library");
  const [theme, setTheme] = useState<BoardImageTheme | "all">("all");
  const [library, setLibrary] = useState<BoardImageAsset[]>(() =>
    uploadsOnly ? [] : (getCachedBoardImageLibrary() ?? []),
  );
  const [uploads, setUploads] = useState(() => uploadsCache.get(userId) ?? []);
  const [loading, setLoading] = useState(() => {
    const hasUploads = uploadsCache.has(userId);
    if (uploadsOnly) return !hasUploads;
    const hasLibrary = getCachedBoardImageLibrary() !== null;
    return !hasUploads && !hasLibrary;
  });
  const [uploading, setUploading] = useState(false);

  const refreshUploads = useCallback(async () => {
    const list = await listUserUploads(userId);
    uploadsCache.set(userId, list);
    setUploads(list);
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    const hadUploads = uploadsCache.has(userId);
    const hadLibrary = !uploadsOnly && getCachedBoardImageLibrary() !== null;
    const tasks: Promise<void>[] = [];

    if (!uploadsOnly && !hadLibrary) {
      tasks.push(
        loadBoardImageLibrary().then((imgs) => {
          if (!cancelled) setLibrary(imgs);
        }),
      );
    }

    if (!hadUploads) {
      tasks.push(refreshUploads().then(() => undefined));
    } else {
      void refreshUploads();
    }

    if (tasks.length > 0) setLoading(true);
    Promise.all(tasks).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [refreshUploads, uploadsOnly, userId]);

  const filtered = theme === "all" ? library : filterLibraryByTheme(library, theme);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadBoardImage(userId, file);
      await refreshUploads();
      onPickImage?.(url);
      setTab("uploads");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className={cn("flex h-full flex-col bg-transparent", !embedded && "border-r border-neutral-200 bg-white")}>
      {!uploadsOnly && (
        <div className="flex items-center justify-center gap-4 border-b border-neutral-200 px-3 py-2">
          {(["library", "uploads"] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={cn(
                "px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wide",
                "border-b border-transparent",
                tab === t ? "border-neutral-500 text-neutral-900" : "text-neutral-500 hover:text-neutral-800",
              )}
              onClick={() => setTab(t)}
            >
              {t === "library" ? "Our Collection" : "Your Library"}
            </button>
          ))}
        </div>
      )}

      {tab === "library" && !uploadsOnly && (
        <div className="border-b border-neutral-100 p-2">
          <select
            className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-xs"
            value={theme}
            onChange={(e) => setTheme(e.target.value as BoardImageTheme | "all")}
          >
            <option value="all">All themes</option>
            {BOARD_IMAGE_THEMES.map((th) => (
              <option key={th} value={th}>
                {th}
              </option>
            ))}
          </select>
        </div>
      )}

      {(tab === "uploads" || uploadsOnly) && (
        <div className="flex gap-2 border-b border-neutral-100 p-2">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 flex-1 gap-1.5 px-2 text-[11px] font-medium"
            asChild
            disabled={uploading}
          >
            <label className={cn("cursor-pointer", uploading && "pointer-events-none opacity-60")}>
              {uploading ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" /> : <Upload className="h-3.5 w-3.5 shrink-0" />}
              Upload Photo
              <input type="file" accept="image/*" className="sr-only" onChange={onFileChange} disabled={uploading} />
            </label>
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
          </div>
        ) : tab === "library" && !uploadsOnly ? (
          <div className="grid grid-cols-2 gap-2">
            {filtered.map((img) => (
              <button
                key={img.id}
                type="button"
                className="group overflow-hidden rounded-md border border-neutral-200 hover:ring-2 hover:ring-neutral-900/20"
                onClick={() => onPickImage?.(img.url)}
              >
                <img src={img.url} alt={img.description} className="aspect-square w-full object-cover" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        ) : uploads.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs text-neutral-500">Nothing in Your Library yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {uploads.map((u) => (
              <button
                key={u.path}
                type="button"
                className="overflow-hidden rounded-md border border-neutral-200 hover:ring-2 hover:ring-neutral-900/20"
                onClick={() => onPickImage?.(u.signedUrl)}
              >
                <img src={u.signedUrl} alt="" className="aspect-square w-full object-cover" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
