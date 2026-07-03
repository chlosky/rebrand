import type { BlogPost } from "./types";

const SYNONYMS: Record<string, string[]> = {
  sp: ["specific person", "manifesting an sp", "manifesting an SP"],
  "3d": ["current circumstances", "the 3d", "circumstances"],
  subs: ["subliminals", "subliminal"],
  sub: ["subliminals", "subliminal"],
  sc: ["self-concept", "self concept"],
  affirming: ["affirmations", "robotic affirming", "affirmation"],
  affirmations: ["robotic affirming", "affirming"],
};

function expandQueryTerms(query: string): string[] {
  const raw = query.toLowerCase().trim();
  if (!raw) return [];

  const tokens = raw.split(/\s+/).filter(Boolean);
  const expanded = new Set<string>(tokens);

  for (const token of tokens) {
    if (SYNONYMS[token]) {
      expanded.add(token);
      for (const alias of SYNONYMS[token]) expanded.add(alias);
    }
    for (const [key, aliases] of Object.entries(SYNONYMS)) {
      if (aliases.some((a) => a.includes(token) || token.includes(a))) {
        expanded.add(key);
        for (const alias of aliases) expanded.add(alias);
      }
    }
  }

  return [...expanded];
}

function postSearchBlob(post: BlogPost): string {
  return [post.title, post.metaDescription, post.category, ...post.keywords, post.content]
    .join(" ")
    .toLowerCase();
}

function scorePost(post: BlogPost, terms: string[]): number {
  const blob = postSearchBlob(post);
  const title = post.title.toLowerCase();
  const summary = post.metaDescription.toLowerCase();
  let score = 0;

  for (const term of terms) {
    if (!term) continue;
    if (title.includes(term)) score += 12;
    if (summary.includes(term)) score += 6;
    if (post.keywords.some((k) => k.toLowerCase().includes(term))) score += 5;
    if (post.category.toLowerCase().includes(term)) score += 4;
    if (blob.includes(term)) score += 2;
  }

  return score;
}

export function searchBlogPosts(posts: BlogPost[], query: string): BlogPost[] {
  const terms = expandQueryTerms(query);
  if (terms.length === 0) return [];

  return posts
    .map((post) => ({ post, score: scorePost(post, terms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.post.publishedAt.localeCompare(a.post.publishedAt))
    .map(({ post }) => post);
}
