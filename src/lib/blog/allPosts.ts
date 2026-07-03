import type { BlogPost } from "./types";
import { posts0105 } from "./chunks/posts-01-05";
import { posts0610 } from "./chunks/posts-06-10";
import { posts1115 } from "./chunks/posts-11-15";
import { posts1620 } from "./chunks/posts-16-20";
import { posts2125 } from "./chunks/posts-21-25";
import { posts2630 } from "./chunks/posts-26-30";
import { posts3135 } from "./chunks/posts-31-35";
import { posts3640 } from "./chunks/posts-36-40";

const merged: BlogPost[] = [
  ...posts0105,
  ...posts0610,
  ...posts1115,
  ...posts1620,
  ...posts2125,
  ...posts2630,
  ...posts3135,
  ...posts3640,
];

export const allBlogPosts: BlogPost[] = [...merged].sort((a, b) =>
  b.publishedAt.localeCompare(a.publishedAt),
);

export function getPostBySlug(slug: string): BlogPost | undefined {
  return allBlogPosts.find((p) => p.slug === slug);
}
