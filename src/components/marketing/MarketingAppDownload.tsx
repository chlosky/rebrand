import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useMarketingTranslation } from "@/hooks/useMarketingTranslation";
import {
  PALETTE_PLOTTING_APP_STORE_URL,
  PALETTE_PLOTTING_GOOGLE_PLAY_URL,
} from "@/lib/appStore";
import { MarketingStoreBadges } from "@/components/marketing/MarketingStoreBadges";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMarketingStoreCta } from "@/hooks/useMarketingStoreCta";
import { MARKETING_DISPLAY_CLASS } from "@/components/marketing/marketingVisualTheme";
import { marketingHeroSectionClass } from "@/components/marketing/marketingLayout";
import { cn } from "@/lib/utils";

type QRStatus = "loading" | "ready" | "error";

type StoreQR = {
  label: string;
  href: string;
  alt: string;
};

const QR_SIZE_PX = 140;
const QR_DISPLAY_CLASS = "h-28 w-28 sm:h-32 sm:w-32";

function StoreQrCard({
  store,
  dataUrl,
  status,
  unavailableLabel,
}: {
  store: StoreQR;
  dataUrl: string;
  status: QRStatus;
  unavailableLabel: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs font-semibold tracking-wide text-white/70">{store.label}</p>
      {status === "ready" && dataUrl ? (
        <a
          href={store.href}
          className="inline-block rounded-xl border border-white/15 bg-white p-2.5 shadow-md transition-shadow hover:shadow-lg hover:shadow-pink-500/10"
          rel="noopener noreferrer"
          target="_blank"
        >
          <img
            src={dataUrl}
            alt={store.alt}
            className={QR_DISPLAY_CLASS}
            width={128}
            height={128}
          />
        </a>
      ) : status === "loading" ? (
        <div
          className={`flex items-center justify-center rounded-xl border border-dashed border-white/20 text-xs text-white/50 ${QR_DISPLAY_CLASS}`}
          aria-busy
        >
          …
        </div>
      ) : (
        <p className="text-xs text-white/50">{unavailableLabel}</p>
      )}
    </div>
  );
}

function DesktopQrSection() {
  const { t } = useMarketingTranslation();
  const [qrByHref, setQrByHref] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<QRStatus>("loading");

  const storeQrs: StoreQR[] = [
    {
      label: t("home.download.appleStore"),
      href: PALETTE_PLOTTING_APP_STORE_URL,
      alt: t("home.download.qrAltAppStore"),
    },
    {
      label: t("home.download.googlePlay"),
      href: PALETTE_PLOTTING_GOOGLE_PLAY_URL,
      alt: t("home.download.qrAltGooglePlay"),
    },
  ];

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      storeQrs.map(async (store) => {
        const dataUrl = await QRCode.toDataURL(store.href, {
          width: QR_SIZE_PX,
          margin: 2,
          errorCorrectionLevel: "H",
          color: { dark: "#000000", light: "#ffffff" },
        });
        return [store.href, dataUrl] as const;
      }),
    )
      .then((entries) => {
        if (cancelled) return;
        setQrByHref(Object.fromEntries(entries));
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <>
      <p className="mt-3 text-sm text-white sm:text-base">{t("home.download.scanPhone")}</p>
      <div className="mt-8 flex w-full flex-col items-center gap-6">
        <div className="flex flex-wrap items-start justify-center gap-8 sm:gap-10">
          {storeQrs.map((store) => (
            <StoreQrCard
              key={store.href}
              store={store}
              dataUrl={qrByHref[store.href] ?? ""}
              status={status}
              unavailableLabel={t("home.download.qrUnavailable")}
            />
          ))}
        </div>
        {status === "error" ? (
          <p className="text-sm text-white/60">{t("home.download.qrError")}</p>
        ) : null}
        <MarketingStoreBadges subline={t("home.hero.freeTrialUnderBadges")} />
      </div>
    </>
  );
}

function MobileBadgesSection() {
  const { t } = useMarketingTranslation();
  const cta = useMarketingStoreCta();

  return (
    <>
      <p className="mt-3 text-sm text-white sm:text-base">{t("home.download.tapInstall")}</p>
      <div className="mt-7 flex w-full flex-col items-center gap-5">
        <MarketingStoreBadges
          layout="inline"
          size="lg"
          subline={t("home.hero.freeTrialUnderBadges")}
          getStoreHref={cta.getStoreHref}
          onStoreClick={(store) => cta.onStoreClick("homepage_download_section_store_badge", store)}
        />
      </div>
    </>
  );
}

export function MarketingAppDownload() {
  const { t } = useMarketingTranslation();
  const isMobile = useIsMobile();

  return (
    <section
      id="download-app"
      className={cn(marketingHeroSectionClass, "scroll-mt-24")}
      aria-labelledby="download-app-heading"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="mx-auto flex w-full flex-col items-center text-center lg:max-w-3xl">
          <h2 id="download-app-heading" className={cn(MARKETING_DISPLAY_CLASS, "w-full text-2xl sm:text-3xl")}>
            {isMobile ? t("home.download.headingMobile") : t("home.download.headingDesktop")}
          </h2>
          {isMobile ? <MobileBadgesSection /> : <DesktopQrSection />}
        </div>
      </div>
    </section>
  );
}
