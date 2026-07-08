import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FreeLibraryGuide, LibraryBlock } from "@/pages/workspace/freeLibraryGuides";
import { cn } from "@/lib/utils";

function Block({ block, dark }: { block: LibraryBlock; dark: boolean }) {
  const body = dark ? "text-white" : "text-zinc-700";
  const border = dark ? "border-white" : "border-zinc-200";

  if (block.type === "paragraph") {
    return <p className={cn("text-[15px] leading-[1.7]", body)}>{block.text}</p>;
  }

  if (block.type === "subheading") {
    return (
      <h3 className={cn("font-welcome-serif pt-1 text-lg leading-snug", dark ? "text-white" : "text-zinc-900")}>
        {block.text}
      </h3>
    );
  }

  if (block.type === "callout") {
    return (
      <blockquote
        className={cn(
          "rounded-xl border px-4 py-3.5 text-[15px] leading-relaxed",
          dark ? "border-white bg-black text-white" : "border-zinc-300 bg-[#f3f0eb] text-zinc-800",
        )}
      >
        {block.text}
      </blockquote>
    );
  }

  if (block.type === "divider") {
    return <hr className={cn("my-1 border-0 border-t", border)} />;
  }

  if (block.type === "boardEntry") {
    return (
      <p className={cn("text-[15px] leading-[1.7]", body)}>
        <strong className={dark ? "text-white" : "text-zinc-900"}>{block.label}</strong>
        <span className={dark ? "text-white" : "text-zinc-500"}> — </span>
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
                dark ? "border-white text-white" : "border-zinc-400 text-zinc-400",
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

  if (block.type === "textLink") {
    return (
      <p className="pt-2">
        <Link
          to={block.href}
          className={cn(
            "text-[15px] font-semibold underline underline-offset-4",
            dark ? "text-white hover:text-zinc-300" : "text-zinc-900 hover:text-zinc-500",
          )}
        >
          {block.label}
        </Link>
      </p>
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
  const [activeSlug, setActiveSlug] = useState(guide.sections[0]?.slug ?? "");

  useEffect(() => {
    setActiveSlug(guide.sections[0]?.slug ?? "");
  }, [guide.slug, guide.sections]);

  const activeIndex = useMemo(() => {
    const i = guide.sections.findIndex((s) => s.slug === activeSlug);
    return i === -1 ? 0 : i;
  }, [guide.sections, activeSlug]);

  const activeSection = guide.sections[activeIndex];
  const prev = activeIndex > 0 ? guide.sections[activeIndex - 1] : null;
  const next = activeIndex < guide.sections.length - 1 ? guide.sections[activeIndex + 1] : null;

  const goTo = (slug: string) => {
    setActiveSlug(slug);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const tocLink = (isActive: boolean) =>
    cn(
      "block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
      isActive
        ? dark
          ? "bg-white font-semibold text-black"
          : "bg-zinc-900 font-semibold text-white"
        : dark
          ? "text-white hover:bg-white/10"
          : "text-zinc-600 hover:bg-zinc-100",
    );

  return (
    <article className="animate-fade-in">
      <button
        type="button"
        onClick={onBack}
        className={cn(
          "mb-5 inline-flex items-center gap-1.5 text-sm font-medium transition-colors",
          dark ? "text-white hover:underline" : "text-zinc-500 hover:text-zinc-900",
        )}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Library
      </button>

      <header className={cn("mb-6 border-b pb-5", dark ? "border-white" : "border-zinc-200")}>
        <h1 className={cn("font-welcome-serif text-2xl leading-tight sm:text-3xl", dark ? "text-white" : "text-zinc-900")}>
          {guide.title}
        </h1>
        <p className={cn("mt-2 text-sm", dark ? "text-white" : "text-zinc-500")}>{guide.subtitle}</p>
      </header>

      <div className="gap-8 md:grid md:grid-cols-[13rem_1fr]">
        <nav aria-label="Sections" className="mb-6 md:mb-0">
          <p className={cn("mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider", dark ? "text-white" : "text-zinc-400")}>
            Sections
          </p>
          <ol className="space-y-1 md:sticky md:top-4">
            {guide.sections.map((section, i) => (
              <li key={section.slug}>
                <button type="button" onClick={() => goTo(section.slug)} className={tocLink(section.slug === activeSlug)}>
                  <span className={cn("mr-2", section.slug === activeSlug ? "opacity-70" : "opacity-40")}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {section.title}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="min-w-0">
          <h2 className={cn("font-welcome-serif mb-4 text-xl leading-snug", dark ? "text-white" : "text-zinc-900")}>
            {activeSection?.title}
          </h2>

          <div className="space-y-5">
            {activeSection?.blocks.map((block, i) => (
              <Block key={i} block={block} dark={dark} />
            ))}
          </div>

          <div className={cn("mt-10 flex items-center justify-between gap-3 border-t pt-5", dark ? "border-white" : "border-zinc-200")}>
            {prev ? (
              <button
                type="button"
                onClick={() => goTo(prev.slug)}
                className={cn(
                  "inline-flex min-w-0 items-center gap-1.5 text-sm font-medium transition-colors",
                  dark ? "text-white hover:underline" : "text-zinc-600 hover:text-zinc-900",
                )}
              >
                <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{prev.title}</span>
              </button>
            ) : (
              <span />
            )}
            {next ? (
              <button
                type="button"
                onClick={() => goTo(next.slug)}
                className={cn(
                  "inline-flex min-w-0 items-center gap-1.5 text-right text-sm font-medium transition-colors",
                  dark ? "text-white hover:underline" : "text-zinc-600 hover:text-zinc-900",
                )}
              >
                <span className="truncate">{next.title}</span>
                <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
              </button>
            ) : (
              <span />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
