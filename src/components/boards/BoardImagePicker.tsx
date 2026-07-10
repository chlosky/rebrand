import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
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
  /** Workspace Your Images: user uploads only — not Our Collection / Affixments / Found Objects. */
  uploadsOnly?: boolean;
  /** Wider multi-column grid for full-width panels (e.g. Workspace uploads). Sidebar stays 2-up. */
  wideGrid?: boolean;
};

type Tab = "collection" | "uploads" | "affixments" | "foundObjects";

const TABS: { id: Tab; label: string }[] = [
  { id: "collection", label: "Collection" },
  { id: "affixments", label: "Affixments" },
  { id: "foundObjects", label: "Objects" },
  { id: "uploads", label: "Uploads" },
];

const COLLECTION_THEMES = BOARD_IMAGE_THEMES.filter(
  (theme) => theme !== "Found Objects" && theme !== "Affixments",
);

const GRID_BATCH = 24;

const uploadsCache = new Map<string, { path: string; signedUrl: string; thumbUrl: string }[]>();

function isCutoutTheme(theme: string) {
  return theme === "Found Objects" || theme === "Affixments";
}

function pickerThumbUrl(img: BoardImageAsset) {
  return img.thumbUrl ?? img.url;
}

function LazyPickerImage({
  src,
  alt,
  cutout,
  onClick,
  eager = false,
}: {
  src: string;
  alt: string;
  cutout?: boolean;
  onClick?: () => void;
  eager?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(eager);

  useEffect(() => {
    if (eager) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [eager]);

  return (
    <button
      ref={ref}
      type="button"
      className="group overflow-hidden rounded-md border border-neutral-200 hover:ring-2 hover:ring-neutral-900/20"
      onClick={onClick}
    >
      <div className={cn("aspect-square w-full", cutout && "bg-white")}>
        {visible ? (
          <img
            src={src}
            alt={alt}
            className={cn("h-full w-full", cutout ? "object-contain p-2" : "object-cover")}
            decoding="async"
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "low"}
          />
        ) : (
          <div className="h-full w-full animate-pulse bg-neutral-100" aria-hidden />
        )}
      </div>
    </button>
  );
}

export function BoardImagePicker({
  userId,
  onPickImage,
  embedded,
  uploadsOnly = false,
  wideGrid = false,
}: BoardImagePickerProps) {
  const [tab, setTab] = useState<Tab>(uploadsOnly ? "uploads" : "collection");
  const [theme, setTheme] = useState<BoardImageTheme | "all">("all");
  const [library, setLibrary] = useState<BoardImageAsset[]>(() =>
    uploadsOnly ? [] : (getCachedBoardImageLibrary() ?? []),
  );
  const [uploads, setUploads] = useState(() => uploadsCache.get(userId) ?? []);
  const [libraryLoading, setLibraryLoading] = useState(
    () => !uploadsOnly && getCachedBoardImageLibrary() === null,
  );
  const [uploadsLoading, setUploadsLoading] = useState(() => !uploadsCache.has(userId));
  const [uploading, setUploading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(GRID_BATCH);
  const scrollRef = useRef<HTMLDivElement>(null);

  const refreshUploads = useCallback(async () => {
    const list = await listUserUploads(userId);
    uploadsCache.set(userId, list);
    setUploads(list);
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    const hadUploads = uploadsCache.has(userId);
    const hadLibrary = !uploadsOnly && getCachedBoardImageLibrary() !== null;

    if (!uploadsOnly && !hadLibrary) {
      setLibraryLoading(true);
      void loadBoardImageLibrary()
        .then((imgs) => {
          if (!cancelled) setLibrary(imgs);
        })
        .catch(() => undefined)
        .finally(() => {
          if (!cancelled) setLibraryLoading(false);
        });
    } else if (!uploadsOnly) {
      setLibraryLoading(false);
    }

    if (!hadUploads) {
      setUploadsLoading(true);
      void refreshUploads()
        .catch(() => undefined)
        .finally(() => {
          if (!cancelled) setUploadsLoading(false);
        });
    } else {
      setUploadsLoading(false);
      void refreshUploads().catch(() => undefined);
    }

    return () => {
      cancelled = true;
    };
  }, [refreshUploads, userId]);

  const collectionLibrary = library.filter((img) => !isCutoutTheme(img.theme));
  const filtered =
    tab === "collection"
      ? theme === "all"
        ? collectionLibrary
        : filterLibraryByTheme(collectionLibrary, theme)
      : tab === "affixments"
        ? library.filter((img) => img.theme === "Affixments")
        : tab === "foundObjects"
          ? library.filter((img) => img.theme === "Found Objects")
          : [];

  useEffect(() => {
    setVisibleCount(GRID_BATCH);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [tab, theme]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const listLength = uploadsOnly || tab === "uploads" ? uploads.length : filtered.length;
    const onScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 96) {
        setVisibleCount((count) => Math.min(count + GRID_BATCH, listLength));
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [filtered.length, tab, theme, uploads.length, uploadsOnly]);

  const activeTabLoading =
    tab === "uploads"
      ? uploadsLoading && uploads.length === 0
      : libraryLoading && library.length === 0;

  const visibleLibrary = filtered.slice(0, visibleCount);
  const visibleUploads = uploads.slice(0, visibleCount);

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

  const gridClass = cn(
    "grid gap-2",
    wideGrid ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5" : "grid-cols-2",
  );

  return (
    <div className={cn("flex h-full flex-col bg-transparent", !embedded && "border-r border-neutral-200 bg-white")}>
      {!uploadsOnly ? (
        <div className="grid grid-cols-4 border-b border-neutral-200">
          {TABS.map(({ id, label }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                className="flex min-h-9 min-w-0 items-center justify-center px-0.5 py-1.5"
                onClick={() => setTab(id)}
              >
                <span
                  className={cn(
                    "inline-block max-w-full border-b-2 pb-1 text-center text-[7px] font-semibold uppercase leading-[1.15] tracking-wide sm:text-[8px]",
                    active
                      ? "border-neutral-500 text-neutral-900"
                      : "border-transparent text-neutral-500 hover:text-neutral-800",
                  )}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {!uploadsOnly && tab === "collection" && (
        <div className="border-b border-neutral-100 p-2">
          <select
            className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-xs"
            value={theme}
            onChange={(e) => setTheme(e.target.value as BoardImageTheme | "all")}
          >
            <option value="all">All themes</option>
            {COLLECTION_THEMES.map((th) => (
              <option key={th} value={th}>
                {th}
              </option>
            ))}
          </select>
        </div>
      )}

      {(uploadsOnly || tab === "uploads") && (
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

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2">
        {activeTabLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
          </div>
        ) : uploadsOnly || tab === "uploads" ? (
          uploads.length === 0 ? (
            <p className="px-1 py-4 text-center text-xs text-neutral-500">No uploads yet.</p>
          ) : (
            <div className={gridClass}>
              {visibleUploads.map((u, index) => (
                <LazyPickerImage
                  key={u.path}
                  src={u.thumbUrl}
                  alt=""
                  eager={index < 18}
                  onClick={() => onPickImage?.(u.signedUrl)}
                />
              ))}
            </div>
          )
        ) : filtered.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs text-neutral-500">No images in this category yet.</p>
        ) : (
          <div className={gridClass}>
            {visibleLibrary.map((img) => (
              <LazyPickerImage
                key={img.id}
                src={pickerThumbUrl(img)}
                alt={img.description}
                cutout={isCutoutTheme(img.theme)}
                onClick={() => onPickImage?.(img.url)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
