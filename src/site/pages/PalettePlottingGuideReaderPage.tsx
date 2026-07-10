import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  DIGITAL_FUNCTIONS_APIKEY,
  GUIDE_READER_API_URL,
  GUIDE_TOKEN_STORAGE_KEY,
  PALETTE_PLOTTING_GUIDE_PATH,
} from "@/site/lib/digitalProducts";

/** Vite dev fallback — production uses Cloudflare Pages function at the same path. */
export default function PalettePlottingGuideReaderPage() {
  const { sectionSlug = "start-here" } = useParams<{ sectionSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const tokenFromQuery = searchParams.get("token");
    const token = tokenFromQuery || localStorage.getItem(GUIDE_TOKEN_STORAGE_KEY);
    if (!token) {
      navigate(`${PALETTE_PLOTTING_GUIDE_PATH}?locked=1`, { replace: true });
      return;
    }

    if (tokenFromQuery) {
      localStorage.setItem(GUIDE_TOKEN_STORAGE_KEY, token);
      const secure = window.location.protocol === "https:";
      document.cookie = `pp_guide_token=${encodeURIComponent(token)}; path=/; max-age=31536000; SameSite=Lax${secure ? "; Secure" : ""}`;
      const clean = new URL(window.location.href);
      clean.searchParams.delete("token");
      window.history.replaceState(null, "", clean.toString());
    }

    const readerBase = `${window.location.origin}/palette-plotting-guide/read`;
    const params = new URLSearchParams({
      section: sectionSlug,
      token,
      reader_base: readerBase,
    });

    fetch(`${GUIDE_READER_API_URL}?${params.toString()}`, {
      headers: {
        apikey: DIGITAL_FUNCTIONS_APIKEY,
        Authorization: `Bearer ${DIGITAL_FUNCTIONS_APIKEY}`,
      },
      redirect: "manual",
    })
      .then(async (response) => {
        if (cancelled) return;

        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get("Location");
          window.location.href = location || `${PALETTE_PLOTTING_GUIDE_PATH}?locked=1`;
          return;
        }

        if (!response.ok) {
          throw new Error("Could not load the guide.");
        }

        const pageHtml = await response.text();
        if (!pageHtml.includes("guide-body")) {
          throw new Error("Could not load the guide.");
        }

        setHtml(pageHtml);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not open the guide. Try entering your email again on the guide page.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams, sectionSlug]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-4">
        <div className="max-w-md text-center">
          <p className="text-sm text-red-600">{error}</p>
          <a
            href={PALETTE_PLOTTING_GUIDE_PATH}
            className="mt-4 inline-block text-sm font-medium text-neutral-900 underline underline-offset-2"
          >
            Back to guide page
          </a>
        </div>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-4">
        <p className="text-sm text-neutral-600">Opening guide…</p>
      </div>
    );
  }

  return (
    <iframe
      title="palette plotting Guide"
      srcDoc={html}
      className="fixed inset-0 h-full w-full border-0 bg-[#fafafa]"
      sandbox="allow-scripts allow-same-origin allow-top-navigation-by-user-activation"
    />
  );
}
