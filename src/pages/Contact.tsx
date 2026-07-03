import { Mail, Phone, MapPin } from "lucide-react";
import { useMarketingTranslation } from "@/hooks/useMarketingTranslation";
import { MarketingSiteLayout } from "@/components/marketing/MarketingSiteLayout";
import {
  MARKETING_SUPPORT_EMAIL,
  MARKETING_SMS_DISPLAY,
  MARKETING_SMS_E164,
} from "@/lib/marketingContact";

const Contact = () => {
  const { t } = useMarketingTranslation();

  return (
    <MarketingSiteLayout>
      <div className="container mx-auto max-w-4xl flex-1 px-4 py-12 sm:px-6">
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">{t("contact.title")}</h1>
          <p className="text-lg text-muted-foreground">
            {t("contact.subtitle")}
          </p>
        </div>

        <div className="max-w-2xl space-y-6">
          <h2 className="mb-6 text-2xl font-semibold">{t("contact.getInTouch")}</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-white/10 p-3 ring-1 ring-white/10">
                <Mail className="h-5 w-5 text-rose-300" />
              </div>
              <div>
                <p className="mb-1 font-medium">{t("contact.email")}</p>
                <a
                  href={`mailto:${MARKETING_SUPPORT_EMAIL}`}
                  className="text-muted-foreground transition-colors hover:text-white"
                >
                  {MARKETING_SUPPORT_EMAIL}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-white/10 p-3 ring-1 ring-white/10">
                <Phone className="h-5 w-5 text-rose-300" />
              </div>
              <div>
                <p className="mb-1 font-medium">{t("contact.phone")}</p>
                <a
                  href={`tel:${MARKETING_SMS_E164}`}
                  className="text-muted-foreground transition-colors hover:text-white"
                >
                  {MARKETING_SMS_DISPLAY}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-white/10 p-3 ring-1 ring-white/10">
                <MapPin className="h-5 w-5 text-rose-300" />
              </div>
              <div>
                <p className="mb-1 font-medium">{t("contact.address")}</p>
                <p className="text-muted-foreground">
                  {t("contact.addressLine1")}
                  <br />
                  {t("contact.addressLine2")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketingSiteLayout>
  );
};

export default Contact;
