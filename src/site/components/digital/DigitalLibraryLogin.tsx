import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  PALETTE_PLOTTING_GUIDE_PATH,
  PALETTE_PLOTTING_GUIDE_SLUG,
  type LibraryProductSummary,
} from "@/site/lib/digitalProducts";
import { GUIDE_READER_PATH } from "@/site/lib/guidePublicManifest";
import { cn } from "@/site/lib/utils";

type DigitalLibraryLoginProps = {
  productSlug?: string;
  heading?: string | null;
  subtext?: string | null;
  redirectPath?: string;
};

export function DigitalLibraryLogin({
  productSlug,
  heading = "Already purchased?",
  subtext = "Enter the email you used at checkout to open the guide.",
  redirectPath = GUIDE_READER_PATH,
}: DigitalLibraryLoginProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/digital/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email,
          ...(productSlug ? { product: productSlug } : {}),
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        redirect?: string;
      };

      if (!response.ok || !data.ok) {
        setError(data.error ?? "Could not open the guide.");
        return;
      }

      window.location.href = data.redirect ?? redirectPath;
    } catch {
      setError("Could not open the guide. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5">
      {heading ? <h2 className="text-base font-semibold text-neutral-900">{heading}</h2> : null}
      {subtext ? <p className="mt-2 text-sm text-neutral-600">{subtext}</p> : null}
      <form className={cn(heading || subtext ? "mt-4" : "", "space-y-3")} onSubmit={handleSubmit}>
        <label className="block">
          <span className="sr-only">Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="min-h-[44px] w-full rounded-lg border border-neutral-200 px-3 text-sm"
            required
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {loading ? "Opening…" : "Open guide"}
        </button>
      </form>
    </section>
  );
}

export function DigitalAccessNotice() {
  const [searchParams, setSearchParams] = useSearchParams();
  const access = searchParams.get("access");
  const login = searchParams.get("login");
  const loginMessage = searchParams.get("message");

  useEffect(() => {
    if (searchParams.get("signout") === "1") {
      fetch("/api/digital/session", { method: "DELETE", credentials: "same-origin" }).finally(() => {
        setSearchParams({}, { replace: true });
      });
    }
  }, [searchParams, setSearchParams]);

  if (access === "required") {
    return (
      <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Enter your checkout email below to open the guide.
      </p>
    );
  }

  if (login === "failed") {
    return (
      <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
        {loginMessage ? decodeURIComponent(loginMessage) : "Could not sign in. Try your checkout email."}
      </p>
    );
  }

  return null;
}

export function useDigitalLibrary() {
  const [state, setState] = useState<{
    loading: boolean;
    authenticated: boolean;
    email: string | null;
    library: LibraryProductSummary[];
  }>({ loading: true, authenticated: false, email: null, library: [] });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/digital/session", { credentials: "same-origin" })
      .then((response) => response.json())
      .then((data: {
        authenticated?: boolean;
        email?: string;
        library?: LibraryProductSummary[];
      }) => {
        if (cancelled) return;
        setState({
          loading: false,
          authenticated: Boolean(data.authenticated),
          email: data.email ?? null,
          library: data.library ?? [],
        });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ loading: false, authenticated: false, email: null, library: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function useDigitalProductAccess(productSlug: string = PALETTE_PLOTTING_GUIDE_SLUG) {
  const [state, setState] = useState<{
    loading: boolean;
    authenticated: boolean;
    entitled: boolean;
  }>({ loading: true, authenticated: false, entitled: false });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/digital/session?product=${encodeURIComponent(productSlug)}`, {
      credentials: "same-origin",
    })
      .then((response) => response.json())
      .then((data: { authenticated?: boolean; entitled?: boolean }) => {
        if (cancelled) return;
        setState({
          loading: false,
          authenticated: Boolean(data.authenticated),
          entitled: Boolean(data.entitled),
        });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ loading: false, authenticated: false, entitled: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [productSlug]);

  return state;
}

export async function signOutDigitalLibrary(): Promise<void> {
  await fetch("/api/digital/session", { method: "DELETE", credentials: "same-origin" });
}

export { PALETTE_PLOTTING_GUIDE_PATH, PALETTE_PLOTTING_GUIDE_SLUG };
