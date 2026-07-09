import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PaletteLetterSignup } from "@/site/components/newsletter/PaletteLetterSignup";
import { usePageSeo } from "@/lib/usePageSeo";
import { supabase } from "@/integrations/supabase/client";
import { storeSiteAccessGrant } from "@/lib/toolSite";

export default function ToolWaitingList() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  usePageSeo({
    title: "Palette Plotting — Join the waitlist",
    description: "Palette Plotting is opening soon. Join the waitlist for early access.",
    path: "/",
  });

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const password = new FormData(form).get("password");
    if (typeof password !== "string" || !password.trim()) return;

    setPasswordError(null);
    setSubmitting(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("verify-site-access", {
        body: { password },
      });
      if (invokeError || !data?.ok) {
        setPasswordError("Incorrect password.");
        return;
      }
      storeSiteAccessGrant();
      navigate("/login", { replace: true });
    } catch {
      setPasswordError("Could not verify password. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#faf8f5] px-4 py-12">
      <div className="w-full max-w-md text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
          Palette Plotting
        </p>
        <h1 className="mt-3 font-welcome-serif text-3xl text-neutral-900 sm:text-4xl">
          Opening soon
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-base">
          Vision boards, action plans, and reminders — in one workspace. Join the waitlist and
          we&apos;ll email you when early access opens.
        </p>
        <div id="newsletter" className="mt-10 scroll-mt-8">
          <PaletteLetterSignup source="homepage" layout="waiting" />
        </div>

        <div className="mt-10 border-t border-neutral-200 pt-8">
          <p className="text-sm text-neutral-500">Already have access?</p>
          <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3 text-left">
            <label className="block">
              <span className="sr-only">Password</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                placeholder="Enter preview password"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="h-11 w-full rounded-xl border border-neutral-300 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              {submitting ? "Checking…" : "Continue to sign in"}
            </button>
            {passwordError ? (
              <p className="text-center text-sm text-red-600" role="alert">
                {passwordError}
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
}
