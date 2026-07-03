import { ChevronLeft } from "lucide-react";
import type { FreeLibraryGuide, LibraryBlock } from "@/pages/workspace/freeLibraryGuides";
import { cn } from "@/lib/utils";

function swatchBackground(swatch: string, fill?: string) {
  if (swatch.startsWith("linear-gradient")) return { background: swatch };
  if (fill) return { background: `linear-gradient(145deg, ${fill} 0%, ${swatch}99 100%)` };
  return { backgroundColor: swatch };
}

function Block({ block, dark }: { block: LibraryBlock; dark: boolean }) {
  const muted = dark ? "text-white/70" : "text-zinc-600";
  const body = dark ? "text-white/88" : "text-zinc-700";
  const card = dark ? "border-white/10 bg-white/[0.04]" : "border-zinc-200 bg-white";
  const border = dark ? "border-white/10" : "border-zinc-200";

  if (block.type === "paragraph") {
    return <p className={cn("text-[15px] leading-[1.7]", body)}>{block.text}</p>;
  }

  if (block.type === "subheading") {
    return (
      <h2 className={cn("font-welcome-serif pt-2 text-xl leading-snug", dark ? "text-white" : "text-zinc-900")}>
        {block.text}
      </h2>
    );
  }

  if (block.type === "callout") {
    return (
      <blockquote
        className={cn(
          "rounded-xl border px-4 py-3.5 text-[15px] leading-relaxed",
          dark
            ? "border-white/15 bg-white/[0.06] text-white/92"
            : "border-zinc-300 bg-[#f3f0eb] text-zinc-800",
        )}
      >
        {block.text}
      </blockquote>
    );
  }

  if (block.type === "divider") {
    return <hr className={cn("my-2 border-0 border-t", border)} />;
  }

  if (block.type === "boardEntry") {
    return (
      <p className={cn("text-[15px] leading-[1.7]", body)}>
        <strong className={dark ? "text-white" : "text-zinc-900"}>{block.label}</strong>
        <span className={muted}> — </span>
        {block.text}
      </p>
    );
  }

  if (block.type === "bullets") {
    return (
      <ul className={cn("list-disc space-y-2 pl-5 text-[15px] leading-[1.65]", body)}>
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  if (block.type === "checklist") {
    return (
      <ul className={cn("space-y-2.5 text-[15px] leading-[1.6]", body)}>
        {block.items.map((item) => (
          <li key={item} className="relative pl-7">
            <span
              className={cn(
                "absolute left-0 top-0.5 flex h-4 w-4 items-center justify-center rounded border text-[10px]",
                dark ? "border-white/25 text-white/50" : "border-zinc-400 text-zinc-400",
              )}
              aria-hidden
            >
              □
            </span>
            {item}
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === "image") {
    const aspect =
      block.aspect === "wide"
        ? "aspect-[16/10]"
        : block.aspect === "tall"
          ? "aspect-[3/4]"
          : "aspect-square";
    return (
      <figure className="overflow-hidden">
        <div className={cn("overflow-hidden rounded-xl border", border, aspect)}>
          <img src={block.src} alt={block.alt} className="h-full w-full object-cover" loading="lazy" decoding="async" />
        </div>
        {block.caption ? (
          <figcaption className={cn("mt-2 text-xs leading-relaxed", muted)}>{block.caption}</figcaption>
        ) : null}
      </figure>
    );
  }

  if (block.type === "imageGrid") {
    const cols = block.columns === 3 ? "grid-cols-3" : "grid-cols-2";
    return (
      <div className={cn("grid gap-2", cols)}>
        {block.images.map((img) => (
          <figure key={img.src} className="overflow-hidden">
            <div className={cn("relative aspect-square overflow-hidden rounded-lg border", border)}>
              <img src={img.src} alt={img.alt} className="h-full w-full object-cover" loading="lazy" decoding="async" />
              {img.label ? (
                <span
                  className={cn(
                    "absolute inset-x-0 bottom-0 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm",
                    dark ? "bg-black/55 text-white/90" : "bg-white/85 text-zinc-800",
                  )}
                >
                  {img.label}
                </span>
              ) : null}
            </div>
          </figure>
        ))}
      </div>
    );
  }

  if (block.type === "colorCards") {
    return (
      <div className="grid gap-3">
        {block.colors.map((color) => (
          <article key={color.name} className={cn("rounded-xl border p-4", card)}>
            <div className="flex gap-3">
              <span
                className={cn("mt-0.5 h-9 w-9 shrink-0 rounded-full border shadow-sm", border)}
                style={swatchBackground(color.swatch, color.fill)}
                aria-hidden
              />
              <div className="min-w-0">
                <h3 className={cn("text-base font-semibold", dark ? "text-white" : "text-zinc-900")}>{color.name}</h3>
                <p className={cn("mt-1 text-sm leading-snug", muted)}>
                  <span className={cn("font-semibold", dark ? "text-white/85" : "text-zinc-800")}>Best for: </span>
                  {color.bestFor}
                </p>
              </div>
            </div>
            <p className={cn("mt-3 text-sm leading-relaxed", muted)}>{color.description}</p>
          </article>
        ))}
      </div>
    );
  }

  if (block.type === "swatchStrip") {
    return (
      <figure>
        <div
          className={cn(
            "flex items-end justify-center gap-2 rounded-xl border px-4 py-5",
            dark ? "border-white/10 bg-white/[0.03]" : "border-zinc-200 bg-[#f8f6f2]",
          )}
        >
          {block.colors.map((c, i) => (
            <div
              key={c.label}
              className="flex flex-col items-center gap-1.5"
              style={{ transform: `rotate(${(i - (block.colors.length - 1) / 2) * 6}deg)` }}
            >
              <span
                className={cn(
                  "block rounded-md border shadow-md",
                  border,
                  i === Math.floor(block.colors.length / 2) ? "h-16 w-12" : "h-12 w-9",
                )}
                style={swatchBackground(c.swatch, c.fill)}
                aria-hidden
              />
              <span className={cn("text-[9px] font-medium uppercase tracking-wide", muted)}>{c.label}</span>
            </div>
          ))}
        </div>
        {block.caption ? (
          <figcaption className={cn("mt-2 text-center text-xs leading-relaxed", muted)}>{block.caption}</figcaption>
        ) : null}
      </figure>
    );
  }

  if (block.type === "zoneMap") {
    return (
      <div className={cn("rounded-xl border p-4", card)}>
        <p className={cn("mb-3 text-xs font-semibold uppercase tracking-wider", muted)}>Zone sketch</p>
        <div className="grid grid-cols-2 gap-2">
          {block.zones.map((zone) => (
            <div
              key={zone.id}
              className={cn(
                "flex min-h-[4.5rem] flex-col justify-end rounded-lg border px-3 py-2",
                border,
              )}
              style={{ backgroundColor: dark ? `${zone.color}22` : `${zone.color}18` }}
            >
              <span className={cn("text-xs font-semibold uppercase tracking-wide", dark ? "text-white/80" : "text-zinc-800")}>
                {zone.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (block.type === "kanbanPreview") {
    return (
      <div className="grid grid-cols-3 gap-2">
        {block.columns.map((col) => (
          <div key={col.title} className={cn("rounded-lg border p-2.5", card)}>
            <p className={cn("mb-2 text-[10px] font-bold uppercase tracking-wider", muted)}>{col.title}</p>
            <ul className="space-y-1.5">
              {col.items.map((item) => (
                <li
                  key={item}
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-[11px] leading-snug",
                    dark ? "border-white/10 bg-black/40 text-white/80" : "border-zinc-200 bg-zinc-50 text-zinc-700",
                  )}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

export function LibraryReader({
  guide,
  dark,
  onBack,
}: {
  guide: FreeLibraryGuide;
  dark: boolean;
  onBack: () => void;
}) {
  return (
    <article className="animate-fade-in">
      <button
        type="button"
        onClick={onBack}
        className={cn(
          "mb-5 inline-flex items-center gap-1.5 text-sm font-medium transition-colors",
          dark ? "text-white/60 hover:text-white" : "text-zinc-500 hover:text-zinc-900",
        )}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Library
      </button>

      {guide.heroImage ? (
        <div
          className={cn(
            "mb-6 overflow-hidden rounded-2xl border",
            dark ? "border-white/10" : "border-zinc-200",
          )}
        >
          <img
            src={guide.heroImage.src}
            alt={guide.heroImage.alt}
            className="aspect-[16/10] w-full object-cover"
            loading="eager"
            decoding="async"
          />
        </div>
      ) : null}

      <header
        className="mb-8 border-b pb-6"
        style={{ borderColor: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }}
      >
        <p className={cn("text-[11px] font-semibold uppercase tracking-[0.14em]", dark ? "text-white/45" : "text-zinc-400")}>
          Free reader · {guide.readMinutes} min
        </p>
        <h1 className={cn("font-welcome-serif mt-2 text-3xl leading-tight", dark ? "text-white" : "text-zinc-900")}>
          {guide.title}
        </h1>
        <p className={cn("mt-2 text-sm font-medium", dark ? "text-white/55" : "text-zinc-500")}>{guide.tagline}</p>
      </header>

      <div className="space-y-5">
        {guide.blocks.map((block, i) => (
          <Block key={i} block={block} dark={dark} />
        ))}
      </div>

      <footer
        className={cn(
          "mt-10 rounded-xl border px-4 py-4 text-center text-xs leading-relaxed",
          dark ? "border-white/10 bg-white/[0.04] text-white/50" : "border-zinc-200 bg-white text-zinc-500",
        )}
      >
        Teaser reader — full color guide, board system, and plotting desk unlock with Pro.
      </footer>
    </article>
  );
}
