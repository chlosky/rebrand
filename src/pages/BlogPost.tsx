import { Link, useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { MarketingSiteLayout } from "@/components/marketing/MarketingSiteLayout";
import { BlogPostContent } from "@/components/marketing/BlogPostContent";
import { getPostBySlug } from "@/lib/blog/allPosts";
import { getCategoryAccent } from "@/lib/blog/categoryStyles";
import NotFound from "@/pages/NotFound";
import { useEffect } from "react";

function setMetaTag(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

const BlogPost = () => {
  const { slug } = useParams();
  const post = slug ? getPostBySlug(slug) : undefined;
  useEffect(() => {
    if (!post) return;
    const prevTitle = document.title;
    document.title = `${post.title} | Palette Plotting`;
    setMetaTag("description", post.metaDescription);
    setMetaTag("keywords", post.keywords.join(", "));
    return () => {
      document.title = prevTitle;
    };
  }, [post]);

  if (!post) {
    return <NotFound />;
  }

  const categoryAccent = getCategoryAccent(post.category);

  return (
    <MarketingSiteLayout>
      <div className="container mx-auto max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-8">
          <Link
            to="/blog"
            className="-ml-1 mb-5 inline-flex items-center gap-1 text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to other posts
          </Link>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-white/55">
            <time dateTime={post.publishedAt}>{format(parseISO(post.publishedAt), "MMMM d, yyyy")}</time>
            <span aria-hidden>·</span>
            <span
              className="rounded-full border px-2 py-0.5 text-xs font-medium text-white"
              style={{
                backgroundColor: `${categoryAccent}20`,
                borderColor: `${categoryAccent}55`,
              }}
            >
              {post.category}
            </span>
          </div>
          <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">{post.title}</h1>
        </div>

        <article className="border-t border-white/10 pt-8">
          <BlogPostContent content={post.content} />
        </article>
      </div>
    </MarketingSiteLayout>
  );
};

export default BlogPost;
