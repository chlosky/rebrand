import { Link } from "react-router-dom";
import { useMarketingTranslation } from "@/hooks/useMarketingTranslation";
import { MarketingSiteLayout } from "@/components/marketing/MarketingSiteLayout";
import { MARKETING_FEATURE_KEYS } from "@/lib/marketingLocale";

const PRICING_PLAN_KEYS = ["weekly", "monthly", "annual"] as const;

export default function PricingPlans() {
  const { t } = useMarketingTranslation();

  return (
    <MarketingSiteLayout>
      <div className="container mx-auto max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{t("pricing.title")}</h1>
          <p className="mt-3 text-base leading-relaxed text-white/65">
            {t("pricing.subtitle")}
          </p>
        </header>

        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full table-fixed text-center text-sm sm:text-base">
            <colgroup>
              <col className="w-1/2" />
              <col className="w-1/2" />
            </colgroup>
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th scope="col" className="px-4 py-3 font-semibold text-white sm:px-5 sm:py-4">
                  {t("pricing.planHeader")}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-white sm:px-5 sm:py-4">
                  {t("pricing.priceHeader")}
                </th>
              </tr>
            </thead>
            <tbody>
              {PRICING_PLAN_KEYS.map((planKey) => (
                <tr key={planKey} className="border-b border-white/10 last:border-b-0">
                  <td className="px-4 py-3 text-white sm:px-5 sm:py-4">{t(`pricing.plans.${planKey}.label`)}</td>
                  <td className="px-4 py-3 text-white sm:px-5 sm:py-4">
                    <span className="font-semibold">{t(`pricing.prices.${planKey}`)}</span>{" "}
                    <span className="text-white/55">{t(`pricing.plans.${planKey}.cadence`)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-white/55">{t("pricing.pricesSubjectToChange")}</p>

        <p className="mt-3 text-sm leading-relaxed text-white/65">
          {t("pricing.legalPrefix")}{" "}
          <Link to="/billing" className="text-rose-400 underline-offset-2 hover:underline">
            {t("pricing.billingPolicy")}
          </Link>{" "}
          {t("pricing.legalAnd")}{" "}
          <Link to="/terms" className="text-rose-400 underline-offset-2 hover:underline">
            {t("pricing.termsOfService")}
          </Link>
          .
        </p>

        <section className="mt-12" aria-labelledby="pricing-features-heading">
          <h2 id="pricing-features-heading" className="text-xl font-semibold text-white sm:text-2xl">
            {t("pricing.whatsIncluded")}
          </h2>
          <ul className="mt-6 space-y-5">
            {MARKETING_FEATURE_KEYS.map((featureKey) => (
              <li key={featureKey} className="border-b border-white/10 pb-5 last:border-b-0 last:pb-0">
                <h3 className="font-medium text-white">{t(`pricing.features.${featureKey}.title`)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/60">{t(`pricing.features.${featureKey}.description`)}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </MarketingSiteLayout>
  );
}
