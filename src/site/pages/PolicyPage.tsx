import { Link, Navigate, useParams } from "react-router-dom";
import { SiteLayout } from "@/site/components/layout/SiteLayout";
import { policyFromSlug } from "@/site/lib/sitePolicies";
import { SITE_NAME, pageTitle } from "@/site/lib/siteBrand";
import { usePageSeo } from "@/site/lib/usePageSeo";

export default function PolicyPage() {
  const { slug } = useParams<{ slug: string }>();
  const policy = policyFromSlug(slug);

  usePageSeo({
    title: policy ? pageTitle(policy.title) : SITE_NAME,
    description: policy?.metaDescription ?? `${SITE_NAME} policies.`,
    path: policy ? `/policies/${policy.slug}` : "/",
  });

  if (!policy) {
    return <Navigate to="/" replace />;
  }

  return (
    <SiteLayout>
      <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Back to shop
        </Link>
        <header className="mt-4 border-b border-neutral-200 pb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            {policy.title}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">Last updated: {policy.lastUpdated}</p>
        </header>
        <div className="mt-8 space-y-8">
          {policy.sections.map((section) => (
            <section key={section.heading ?? section.paragraphs[0]?.slice(0, 40)}>
              {section.heading ? (
                <h2 className="text-lg font-semibold text-neutral-900">{section.heading}</h2>
              ) : null}
              <div className={section.heading ? "mt-3 space-y-3" : "space-y-3"}>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)} className="text-sm leading-relaxed text-neutral-600">
                    {paragraph}
                  </p>
                ))}
                {section.list ? (
                  <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-neutral-600 marker:text-neutral-900">
                    {section.list.map((item) => (
                      <li key={item.slice(0, 48)}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      </article>
    </SiteLayout>
  );
}
