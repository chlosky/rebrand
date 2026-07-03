import { Link, useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MarketingSiteLayout } from "@/components/marketing/MarketingSiteLayout";
import { allBlogPosts } from "@/lib/blog/allPosts";
import { searchBlogPosts } from "@/lib/blog/search";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { getCategoriesPresentInPosts, getCategoryAccent } from "@/lib/blog/categoryStyles";

const BLOG_LIST_DESCRIPTION =
  "Articles on subliminals, mirror work, self-concept, and practical manifestation ideas from Palette Plotting.";

/** Matches onboarding MeetYourDouble selection glow */
function chipGlowStyle(accentHex: string): CSSProperties {
  return {
    boxShadow: `0 0 16px ${accentHex}99, 0 0 32px ${accentHex}55, 0 0 48px ${accentHex}33`,
    borderColor: accentHex,
  };
}

function setMetaTag(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

const Blog = () => {
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categoryFromUrl,
  );
  const [query, setQuery] = useState("");

  const categoriesPresent = useMemo(() => getCategoriesPresentInPosts(allBlogPosts), []);

  useEffect(() => {
    if (categoryFromUrl) setSelectedCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  const searchResults = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    return searchBlogPosts(allBlogPosts, trimmed);
  }, [query]);

  const isSearching = query.trim().length > 0;

  const filteredPosts = useMemo(() => {
    let posts = isSearching ? searchResults : allBlogPosts;
    if (selectedCategory && !isSearching) {
      posts = posts.filter((p) => p.category === selectedCategory);
    }
    return posts;
  }, [isSearching, searchResults, selectedCategory]);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Blog | Palette Plotting";
    setMetaTag("description", BLOG_LIST_DESCRIPTION);
    setMetaTag(
      "keywords",
      "subliminals, mirror work, affirmations, paletteplotting, self-concept, manifestation, law of assumption",
    );
    return () => {
      document.title = prevTitle;
    };
  }, []);

  const allAccent = "#4AC7FF";

  return (
    <MarketingSiteLayout>
      <div className="container mx-auto max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="mb-3 text-4xl font-bold text-white">Blog</h1>
          <p className="mb-6 text-lg leading-relaxed text-white/70">
            Guides on subliminals, mirror work, self-concept, and practical repetition—with an eye toward how you
            actually use tools like Palette Plotting on the web.
          </p>

          <div className="relative mb-6 max-w-xl">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Search articles, SP, 3D, subliminals, self-concept…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 border-white/10 bg-white/[0.05] pl-10 text-white placeholder:text-white/35 focus-visible:ring-[#c9a8bc]/40"
              aria-label="Search blog articles"
            />
          </div>

          {!isSearching && (
            <div
              className="flex flex-wrap gap-2 sm:gap-2.5"
              role="group"
              aria-label="Filter posts by topic"
            >
              <button
                type="button"
                aria-pressed={selectedCategory === null}
                onClick={() => setSelectedCategory(null)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium text-white border-2 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-white/30 ${
                  selectedCategory === null ? "scale-[1.02]" : "border-white/25 bg-black hover:border-white/40"
                }`}
                style={
                  selectedCategory === null
                    ? {
                        ...chipGlowStyle(allAccent),
                        backgroundColor: `${allAccent}14`,
                        color: "#ffffff",
                      }
                    : { color: "#ffffff" }
                }
              >
                All
              </button>
              {categoriesPresent.map((category) => {
                const accent = getCategoryAccent(category);
                const isSelected = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedCategory(isSelected ? null : category)}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-medium text-white border-2 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-white/30 ${
                      isSelected ? "scale-[1.02]" : "hover:brightness-110"
                    }`}
                    style={
                      isSelected
                        ? {
                            ...chipGlowStyle(accent),
                            backgroundColor: `${accent}24`,
                            color: "#ffffff",
                          }
                        : {
                            backgroundColor: `${accent}18`,
                            borderColor: `${accent}66`,
                            color: "#ffffff",
                          }
                    }
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <p className="mb-6 text-sm text-white/55" aria-live="polite">
          {isSearching
            ? `${filteredPosts.length} result${filteredPosts.length === 1 ? "" : "s"} for "${query.trim()}".`
            : selectedCategory
              ? `Showing ${filteredPosts.length} post${filteredPosts.length === 1 ? "" : "s"} in ${selectedCategory}.`
              : `Showing all ${filteredPosts.length} posts.`}
        </p>

        <ul className="space-y-5">
          {filteredPosts.map((post) => {
            const accent = getCategoryAccent(post.category);
            return (
              <li key={post.slug}>
                <article className="rounded-xl border border-white/10 bg-black p-5 transition-colors hover:border-white/20 sm:p-6">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-white/55">
                    <time dateTime={post.publishedAt}>
                      {format(parseISO(post.publishedAt), "MMMM d, yyyy")}
                    </time>
                    <span aria-hidden>·</span>
                    <span
                      className="rounded-full border px-2 py-0.5 font-medium text-white"
                      style={{
                        backgroundColor: `${accent}20`,
                        borderColor: `${accent}55`,
                      }}
                    >
                      {post.category}
                    </span>
                  </div>
                  <h2 className="mb-2 text-xl font-semibold leading-snug text-white">
                    <Link
                      to={`/blog/${post.slug}`}
                      className="transition-colors hover:text-rose-300"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mb-4 text-sm leading-relaxed text-white/70">{post.metaDescription}</p>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-rose-400 transition-colors hover:text-rose-300"
                  >
                    Read article
                  </Link>
                </article>
              </li>
            );
          })}
        </ul>

        {filteredPosts.length === 0 && (
          <p className="py-12 text-center text-white/55">
            {isSearching
              ? "No articles matched your search. Try SP, 3D, subliminals, or self-concept."
              : "No posts in this category yet."}
          </p>
        )}
      </div>
    </MarketingSiteLayout>
  );
};

export default Blog;
