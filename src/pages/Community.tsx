import { ExternalLink } from "lucide-react";
import { useMarketingTranslation } from "@/hooks/useMarketingTranslation";
import { MarketingSiteLayout } from "@/components/marketing/MarketingSiteLayout";
import {
  PALETTE_PLOTTING_DISCORD_URL,
  PALETTE_PLOTTING_TIKTOK_HANDLE,
  PALETTE_PLOTTING_TIKTOK_URL,
} from "@/lib/communityLinks";

const linkCardClass =
  "group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.06] sm:p-6";

const Community = () => {
  const { t } = useMarketingTranslation();

  return (
    <MarketingSiteLayout>
      <div className="container mx-auto max-w-4xl flex-1 px-4 py-12 sm:px-6">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-400">{t("community.eyebrow")}</p>
          <h1 className="mb-4 mt-3 text-4xl font-bold tracking-tight md:text-5xl">{t("community.title")}</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            {t("community.body")}
          </p>
        </div>

        <ul className="max-w-2xl space-y-4">
          <li>
            <a
              href={PALETTE_PLOTTING_DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={linkCardClass}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#5865F2]/20 text-lg font-bold text-[#aeb4ff] ring-1 ring-[#5865F2]/30">
                D
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="flex items-center gap-2 font-medium text-white">
                  {t("community.discordTitle")}
                  <ExternalLink
                    className="h-4 w-4 shrink-0 text-white/40 transition-colors group-hover:text-white/70"
                    aria-hidden
                  />
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">{PALETTE_PLOTTING_DISCORD_URL}</span>
              </span>
            </a>
          </li>
          <li>
            <a
              href={PALETTE_PLOTTING_TIKTOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={linkCardClass}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg font-bold text-white ring-1 ring-white/15">
                TT
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="flex items-center gap-2 font-medium text-white">
                  {t("community.tiktokTitle")}
                  <ExternalLink
                    className="h-4 w-4 shrink-0 text-white/40 transition-colors group-hover:text-white/70"
                    aria-hidden
                  />
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">{PALETTE_PLOTTING_TIKTOK_HANDLE}</span>
              </span>
            </a>
          </li>
        </ul>
      </div>
    </MarketingSiteLayout>
  );
};

export default Community;
