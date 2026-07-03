import type { ComponentType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingSiteLayout } from "@/components/marketing/MarketingSiteLayout";
import type { LegalRouteLocale } from "@/lib/locale";
import { PrivacyPolicyContentAR } from "./legal/PrivacyPolicyContentAR";
import { PrivacyPolicyContentDE } from "./legal/PrivacyPolicyContentDE";
import { PrivacyPolicyContentES } from "./legal/PrivacyPolicyContentES";
import { PrivacyPolicyContentFR } from "./legal/PrivacyPolicyContentFR";
import { PrivacyPolicyContentIT } from "./legal/PrivacyPolicyContentIT";
import { PrivacyPolicyContentNL } from "./legal/PrivacyPolicyContentNL";
import { PrivacyPolicyContentPT } from "./legal/PrivacyPolicyContentPT";
import { PrivacyPolicyContentZH } from "./legal/PrivacyPolicyContentZH";

type PrivacyPolicyProps = {
  legalLocale?: LegalRouteLocale;
};

const PRIVACY_BY_LOCALE: Record<LegalRouteLocale, ComponentType> = {
  ES: PrivacyPolicyContentES,
  PT: PrivacyPolicyContentPT,
  DE: PrivacyPolicyContentDE,
  FR: PrivacyPolicyContentFR,
  IT: PrivacyPolicyContentIT,
  NL: PrivacyPolicyContentNL,
  ZH: PrivacyPolicyContentZH,
  AR: PrivacyPolicyContentAR,
};

const PrivacyPolicy = ({ legalLocale }: PrivacyPolicyProps) => {
  const LocalizedPrivacy = legalLocale ? PRIVACY_BY_LOCALE[legalLocale] : null;

  return (
    <MarketingSiteLayout>
      <div className="container mx-auto max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <Card className="mb-8">
          <CardContent className="pt-6">
            {LocalizedPrivacy ? (
              <LocalizedPrivacy />
            ) : (
              <>
            <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground mb-8">
              Effective Date: Jan 13, 2025<br />
              Company: Palette Plotting LLC
            </p>

            <div className="space-y-6 prose prose-sm max-w-none">
              <section>
                <p className="text-muted-foreground mb-4">
                  This Privacy Policy explains how Palette Plotting collects, uses, and protects your information.
                </p>
                <p className="text-muted-foreground mb-4">
                  By using the Service, you agree to this Policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
                <p className="text-muted-foreground mb-2 font-semibold">Information you provide voluntarily</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>email and basic account details</li>
                  <li>journal entries, affirmations, notes</li>
                  <li>audio created or uploaded</li>
                  <li>selections, preferences, and settings</li>
                  <li>optional marketing communication opt-in information</li>
                </ul>
                <p className="text-muted-foreground mb-2 font-semibold">Information collected automatically</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>device and browser type</li>
                  <li>usage patterns and interaction data</li>
                  <li>general location (approximate IP-based)</li>
                  <li>performance and diagnostics</li>
                </ul>
                <p className="text-muted-foreground mb-4">
                  Palette Plotting does not require sensitive identifiers such as government IDs or financial account numbers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
                <p className="text-muted-foreground mb-4">
                  We use information to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>operate and improve the Service</li>
                  <li>personalize your experience</li>
                  <li>generate system responses or suggestions</li>
                  <li>maintain platform integrity and security</li>
                  <li>comply with legal obligations</li>
                  <li>communicate with you about your account, marketing (if opted in), or updates</li>
                </ul>
                <p className="text-muted-foreground mt-4 mb-4">
                  We do not sell your personal information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. How Content Is Processed</h2>
                <p className="text-muted-foreground mb-4">
                  System-generated features may require processing your input (such as text or audio) to provide suggestions, outputs, or formatted content. Processing is limited to supporting Service functionality.
                </p>
                <p className="text-muted-foreground mb-4">
                  Your private entries (journals, affirmations, notes) are not visible to other users unless you choose to share them.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. How Information Is Shared</h2>
                <p className="text-muted-foreground mb-4">
                  We may share information with:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>infrastructure providers (cloud hosting, analytics)</li>
                  <li>communication providers</li>
                  <li>vendors that support Service functionality</li>
                  <li>legal authorities when required by law</li>
                </ul>
                <p className="text-muted-foreground mt-4 mb-4">
                  We do not sell or rent personal content or personal information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
                <p className="text-muted-foreground mb-4">
                  We implement reasonable administrative, technical, and physical safeguards to protect your information.
                </p>
                <p className="text-muted-foreground mb-4">
                  No method of electronic storage or transmission is completely secure.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Your Controls & Choices</h2>
                <p className="text-muted-foreground mb-4">
                  You may:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>update account details</li>
                  <li>delete journals or entries</li>
                  <li>request deletion of your account</li>
                  <li>adjust privacy or notification settings</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
                <p className="text-muted-foreground mb-4">
                  We retain information only as long as reasonably necessary to operate the Service or comply with legal requirements.
                </p>
                <p className="text-muted-foreground mb-4">
                  When you delete your account, we delete or anonymize associated data subject to necessary retention periods.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
                <p className="text-muted-foreground mb-4">
                  The Service is intended for adults 18 and older.
                </p>
                <p className="text-muted-foreground mb-4">
                  We do not knowingly collect information from minors.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. International Users</h2>
                <p className="text-muted-foreground mb-4">
                  Data may be processed in the United States regardless of user location.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Policy Updates</h2>
                <p className="text-muted-foreground mb-4">
                  We may update this Privacy Policy from time to time.
                </p>
                <p className="text-muted-foreground mb-4">
                  Continued use of the Service indicates acceptance of the updated Policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">11. Contact</h2>
                <p className="text-muted-foreground">
                  For questions about this Policy:
                </p>
                <p className="text-muted-foreground">
                  support@paletteplot.com
                </p>
              </section>
            </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MarketingSiteLayout>
  );
};

export default PrivacyPolicy;
