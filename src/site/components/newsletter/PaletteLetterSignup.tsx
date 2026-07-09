import { useState, type FormEvent } from "react";
import { Button } from "@/site/components/ui/button";
import {
  subscribeToPaletteLetter,
  type NewsletterSignupSource,
} from "@/site/lib/newsletter";
import { cn } from "@/site/lib/utils";

const SUCCESS_WAITING = "You're on the list. We'll email you when early access opens.";
const SUCCESS_DEFAULT = "You're on the list. Watch for The Palette Letter in your inbox.";

type PaletteLetterSignupProps = {
  source: NewsletterSignupSource;
  layout?: "card" | "footer" | "waiting";
  className?: string;
  pagePath?: string;
};

export function PaletteLetterSignup({
  source,
  layout = "card",
  className,
  pagePath,
}: PaletteLetterSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");
    setErrorMessage(null);

    const result = await subscribeToPaletteLetter({
      email,
      source,
      pagePath: pagePath ?? (typeof window !== "undefined" ? window.location.pathname : undefined),
    });

    if (result.ok) {
      setStatus("success");
      setEmail("");
      return;
    }

    setStatus("error");
    setErrorMessage(result.error);
  };

  if (status === "success") {
    return (
      <div
        className={cn(
          layout === "footer"
            ? "rounded-xl border border-neutral-200 bg-white p-4"
            : layout === "waiting"
              ? "rounded-2xl border border-neutral-200 bg-white p-6"
              : "rounded-2xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8",
          className,
        )}
        role="status"
      >
        <p className="text-sm font-medium text-neutral-900 sm:text-base">
          {layout === "waiting" ? SUCCESS_WAITING : SUCCESS_DEFAULT}
        </p>
      </div>
    );
  }

  const isFooter = layout === "footer";
  const isWaiting = layout === "waiting";

  return (
    <section
      className={cn(
        isFooter
          ? "rounded-xl border border-neutral-200 bg-white p-4"
          : isWaiting
            ? "rounded-2xl border border-neutral-200 bg-white p-6 text-center"
            : "rounded-2xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8",
        className,
      )}
      aria-labelledby={isFooter ? "footer-palette-letter-heading" : "palette-letter-heading"}
    >
      {!isWaiting ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-500">
          The Palette Letter
        </p>
      ) : null}
      <h2
        id={isFooter ? "footer-palette-letter-heading" : "palette-letter-heading"}
        className={cn(
          "font-semibold text-neutral-900",
          isFooter ? "mt-2 text-base" : isWaiting ? "text-lg" : "mt-2 text-xl sm:text-2xl",
        )}
      >
        {isWaiting ? "Join the waitlist" : "Join The Palette Letter"}
      </h2>
      <p
        className={cn(
          "text-sm leading-relaxed text-neutral-600",
          isFooter ? "mt-2" : isWaiting ? "mt-2" : "mt-3 sm:text-base",
        )}
      >
        {isWaiting
          ? "One email when palette plotting opens."
          : "Be the first to know about discounts. Board ideas, color inspo, and palette plotting drops."}
      </p>

      <form onSubmit={handleSubmit} className={cn("mt-5 space-y-3", isWaiting && "text-left")}>
        <label className="block">
          <span className="sr-only">Email address</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@email.com"
            className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
          />
        </label>
        <Button
          type="submit"
          size="lg"
          disabled={status === "submitting"}
          className="h-12 w-full rounded-xl text-base font-semibold"
        >
          {status === "submitting" ? "Joining…" : isWaiting ? "Join waitlist" : "Join the list"}
        </Button>
        <p className="text-xs leading-relaxed text-neutral-500">
          By joining, you agree to receive emails from palette plotting. You can unsubscribe anytime.
        </p>
        {errorMessage ? (
          <p className="text-sm text-red-600" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </form>
    </section>
  );
}
