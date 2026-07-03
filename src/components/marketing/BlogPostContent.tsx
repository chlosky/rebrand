import ReactMarkdown from "react-markdown";

type BlogPostContentProps = {
  content: string;
};

/** Renders blog body copy with consistent paragraph spacing on black marketing pages. */
export function BlogPostContent({ content }: BlogPostContentProps) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => (
          <p className="mb-6 text-base leading-[1.75] text-white/90 last:mb-0">{children}</p>
        ),
        h2: ({ children }) => (
          <h2 className="mb-4 mt-10 text-2xl font-semibold leading-snug text-white first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-3 mt-8 text-xl font-semibold leading-snug text-white first:mt-0">{children}</h3>
        ),
        ul: ({ children }) => (
          <ul className="mb-6 list-disc space-y-2 pl-6 text-white/90">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-6 list-decimal space-y-2 pl-6 text-white/90">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-rose-400 underline underline-offset-2 hover:text-rose-300"
            rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            target={href?.startsWith("http") ? "_blank" : undefined}
          >
            {children}
          </a>
        ),
      }}
    >
      {content.trim()}
    </ReactMarkdown>
  );
}
