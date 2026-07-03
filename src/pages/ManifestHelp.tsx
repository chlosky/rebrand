import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MarketingSiteHeader } from "@/components/MarketingSiteHeader";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Copy, MessageCircle } from "lucide-react";
import {
  MARKETING_SMS_DISPLAY,
  MARKETING_SMS_E164,
  manifestSmsHref,
} from "@/lib/marketingContact";

function setMetaTag(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

const ManifestHelp = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Text us for affirmation help | Palette Plotting";
    setMetaTag(
      "description",
      "Text Palette Plotting for quick help structuring a plan to reach what you're manifesting, plus affirmations and subliminal wording—structured replies you can use in the app.",
    );
    return () => {
      document.title = prevTitle;
    };
  }, []);

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(MARKETING_SMS_E164);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col" style={{ colorScheme: "light" }}>
      <MarketingSiteHeader />

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-xl flex-1">
        <div className="mb-8 text-center sm:text-left space-y-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Simple text line</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            Need help turning your desire into affirmations?
          </h1>
          <p className="text-lg text-foreground/90 font-medium">Text us your situation.</p>
          <p className="text-muted-foreground leading-relaxed">
            This free texting line is narrow on purpose:{" "}
            <span className="text-foreground/90">
              help with structuring a plan to reach your manifestation goals in the app, help writing affirmations and
              subliminal-style wording
            </span>
            {", not open-ended "}
            &ldquo;ask anything.&rdquo;
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-muted/20 shadow-sm overflow-hidden mb-8">
          <div className="border-b border-border/60 bg-muted/50 px-4 py-3 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary shrink-0" aria-hidden />
            <span className="text-sm font-medium text-foreground/90">Text Palette Plotting</span>
          </div>
          <div className="p-5 sm:p-6 space-y-5">
            <blockquote className="border-l-4 border-primary/40 pl-4 py-1 text-sm sm:text-base leading-relaxed text-foreground/95 italic">
              Send what you&apos;re manifesting, what thought keeps making you waver, and whether you want help with
              building <span className="not-italic font-medium">natural</span> or{" "}
              <span className="not-italic font-medium">intense</span> affirmations. We&apos;ll send back a quick
              structure you can use in Palette Plotting.
            </blockquote>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="rounded-xl gap-2 w-full sm:flex-1">
                <a href={manifestSmsHref}>
                  <MessageCircle className="h-4 w-4" />
                  Open Messages
                </a>
              </Button>
              <Button type="button" variant="outline" size="lg" className="rounded-xl gap-2 w-full sm:w-auto" onClick={copyNumber}>
                <Copy className="h-4 w-4" />
                {copied ? "Copied" : "Copy number"}
              </Button>
            </div>

            <p className="text-center sm:text-left font-mono text-sm text-muted-foreground">{MARKETING_SMS_DISPLAY}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-background px-4 py-4 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p className="font-medium text-foreground/90 text-xs uppercase tracking-wide">Boundaries</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>For affirmation / subliminal wording help—not therapy, medical, or crisis support.</li>
            <li>Replies are sent by a human when we can; not instant or 24/7.</li>
            <li>Carrier message and data rates may apply.</li>
          </ul>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10 leading-relaxed px-2">
          Prefer email or the full contact page?{" "}
          <button type="button" className="text-primary hover:underline font-medium" onClick={() => navigate("/contact")}>
            Contact us
          </button>
          .
        </p>
      </div>

      <Footer />
    </main>
  );
};

export default ManifestHelp;
