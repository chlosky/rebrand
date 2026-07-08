import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DIGITAL_SESSION_URL,
  DIGITAL_UNLOCK_URL,
  DIGITAL_FUNCTIONS_APIKEY,
  GUIDE_TOKEN_STORAGE_KEY,
  buildGuideReaderUrl,
} from "@/site/lib/digitalProducts";
import { cn } from "@/site/lib/utils";

type DigitalLibraryLoginProps = {
  heading?: string | null;
  subtext?: string | null;
};

export function DigitalLibraryLogin({
  heading = "Already purchased?",
  subtext = "Enter the email you used at checkout to open the guide.",
}: DigitalLibraryLoginProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(DIGITAL_UNLOCK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: DIGITAL_FUNCTIONS_APIKEY,
          Authorization: `Bearer ${DIGITAL_FUNCTIONS_APIKEY}`,
        },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        entitled?: boolean;
        token?: string;
        firstSection?: string;
        error?: string;
      };

      if (!response.ok || !data.entitled || !data.token) {
        setError(data.error ?? "Could not open the guide.");
        return;
      }

      localStorage.setItem(GUIDE_TOKEN_STORAGE_KEY, data.token);
      window.location.href = buildGuideReaderUrl(data.token, data.firstSection ?? "start-here");
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
  const locked = searchParams.get("locked");
  const purchase = searchParams.get("purchase");

  useEffect(() => {
    if (searchParams.get("signout") === "1") {
      localStorage.removeItem(GUIDE_TOKEN_STORAGE_KEY);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  if (purchase === "success") {
    return (
      <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
        Payment complete. Enter your checkout email below to open the guide.
      </p>
    );
  }

  if (locked === "1") {
    return (
      <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Enter your checkout email below to open the guide.
      </p>
    );
  }

  return null;
}

export function useDigitalProductAccess() {
  const [state, setState] = useState<{
    loading: boolean;
    authenticated: boolean;
    entitled: boolean;
    token: string | null;
    firstSection: string;
  }>({ loading: true, authenticated: false, entitled: false, token: null, firstSection: "start-here" });

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem(GUIDE_TOKEN_STORAGE_KEY);

    if (!token) {
      setState({ loading: false, authenticated: false, entitled: false, token: null, firstSection: "start-here" });
      return;
    }

    fetch(DIGITAL_SESSION_URL, {
      headers: {
        apikey: DIGITAL_FUNCTIONS_APIKEY,
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data: { authenticated?: boolean; entitled?: boolean; firstSection?: string }) => {
        if (cancelled) return;
        if (!data.authenticated) localStorage.removeItem(GUIDE_TOKEN_STORAGE_KEY);
        setState({
          loading: false,
          authenticated: Boolean(data.authenticated),
          entitled: Boolean(data.entitled),
          token: data.authenticated ? token : null,
          firstSection: data.firstSection ?? "start-here",
        });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ loading: false, authenticated: false, entitled: false, token: null, firstSection: "start-here" });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function signOutDigitalLibrary(): void {
  localStorage.removeItem(GUIDE_TOKEN_STORAGE_KEY);
}
