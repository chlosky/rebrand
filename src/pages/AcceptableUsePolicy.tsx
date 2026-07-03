import type { ComponentType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingSiteLayout } from "@/components/marketing/MarketingSiteLayout";
import type { LegalRouteLocale } from "@/lib/locale";
import { AcceptableUsePolicyContentAR } from "./legal/AcceptableUsePolicyContentAR";
import { AcceptableUsePolicyContentES } from "./legal/AcceptableUsePolicyContentES";
import { AcceptableUsePolicyContentFR } from "./legal/AcceptableUsePolicyContentFR";
import { AcceptableUsePolicyContentIT } from "./legal/AcceptableUsePolicyContentIT";
import { AcceptableUsePolicyContentPT } from "./legal/AcceptableUsePolicyContentPT";

type AcceptableUsePolicyProps = {
  legalLocale?: LegalRouteLocale;
};

const ACCEPTABLE_USE_BY_LOCALE: Partial<Record<LegalRouteLocale, ComponentType>> = {
  AR: AcceptableUsePolicyContentAR,
  ES: AcceptableUsePolicyContentES,
  PT: AcceptableUsePolicyContentPT,
  FR: AcceptableUsePolicyContentFR,
  IT: AcceptableUsePolicyContentIT,
};

const AcceptableUsePolicy = ({ legalLocale }: AcceptableUsePolicyProps) => {
  const LocalizedPolicy = legalLocale ? ACCEPTABLE_USE_BY_LOCALE[legalLocale] : undefined;

  return (
    <MarketingSiteLayout>
      <div className="container mx-auto max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <Card className="mb-8">
          <CardContent className="pt-6">
            {LocalizedPolicy ? (
              <LocalizedPolicy />
            ) : (
              <>
            <h1 className="text-4xl font-bold mb-6">Acceptable Use Policy</h1>
            <p className="text-sm text-muted-foreground mb-8">
              Effective Date: Jan 13, 2025<br />
              Company: Palette Plotting LLC ("Palette Plotting," "we," "our," "us")
            </p>

            <div className="space-y-6 prose prose-sm max-w-none">
              <section>
                <p className="text-muted-foreground mb-4">
                  This Acceptable Use Policy ("Policy") explains what is and is not permitted when using the Palette Plotting website, app, journaling tools, audio creation tools, and all related services ("Service").
                </p>
                <p className="text-muted-foreground mb-4">
                  By using the Service, you agree to follow this Policy. We may suspend or terminate accounts for violations.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Respectful & Appropriate Use</h2>
                <p className="text-muted-foreground mb-4">
                  You may not use the Service to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>harass, threaten, abuse, or intimidate anyone</li>
                  <li>engage in hateful, discriminatory, or violent behavior</li>
                  <li>send or store content that is inappropriate, offensive, or unlawful</li>
                  <li>attempt to provoke or manipulate system-generated content into harmful or unsafe directions</li>
                  <li>use hostile or abusive language toward automated system features or support staff</li>
                </ul>
                <p className="text-muted-foreground mt-4 mb-4">
                  The platform is designed for personal growth and positive engagement.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Safety & Illegal Activity</h2>
                <p className="text-muted-foreground mb-4">
                  The following activities are prohibited:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>violating any applicable law or regulation</li>
                  <li>promoting illegal or dangerous behavior</li>
                  <li>encouraging self-harm or harm to others</li>
                  <li>attempting to evade system safety features</li>
                  <li>attempting to gain unauthorized access to the Service or related systems</li>
                  <li>using the Service to assist, plan, or coordinate unlawful acts</li>
                </ul>
                <p className="text-muted-foreground mt-4 mb-4">
                  Palette Plotting is not a crisis or emergency resource.
                </p>
                <p className="text-muted-foreground mb-4">
                  If you are in immediate danger, contact local emergency services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Child Safety</h2>
                <p className="text-muted-foreground mb-4">
                  Palette Plotting has a zero-tolerance policy for content involving minors in unsafe or inappropriate contexts.
                </p>
                <p className="text-muted-foreground mb-4">
                  You may not:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>upload or create content depicting minors in inappropriate or exploitative situations</li>
                  <li>attempt to use the Service to contact or engage with minors</li>
                  <li>use the Service if you are under 18</li>
                </ul>
                <p className="text-muted-foreground mt-4 mb-4">
                  Violations will result in immediate account termination and may be reported to authorities.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property & Content Ownership</h2>
                <p className="text-muted-foreground mb-4">
                  You may not upload or create content that:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>infringes on copyrights, trademarks, or publicity rights</li>
                  <li>includes celebrities or recognizable public figures</li>
                  <li>uses images, likenesses, or voices of people without their consent</li>
                  <li>imitates or misrepresents another person or entity</li>
                  <li><strong>recreates, copies, or imitates copyrighted music, melodies, or songs (including but not limited to recognizable melodies, chord progressions, or musical phrases from existing copyrighted works)</strong></li>
                </ul>
                <p className="text-muted-foreground mt-4 mb-4">
                  Only upload content you own or are authorized to use. For music compositions specifically, you must ensure your work is original and does not infringe on any existing musical copyrights, even if created with AI assistance.
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>Music-Specific Prohibitions:</strong> You may not use the Music Composer to recreate copyrighted melodies, even in part. This includes but is not limited to: famous melodies, recognizable song hooks, copyrighted chord progressions, or any musical phrase that is substantially similar to a copyrighted work. Short melodies (even 3-4 notes) can be copyrighted if distinctive.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Fraud, Misrepresentation & Deception</h2>
                <p className="text-muted-foreground mb-4">
                  Prohibited behavior includes:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>impersonating any person or organization</li>
                  <li>creating misleading or fraudulent content</li>
                  <li>providing inaccurate account information</li>
                  <li>using the Service to deceive, defraud, or manipulate others</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Malware, Security & System Integrity</h2>
                <p className="text-muted-foreground mb-4">
                  You may not:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>upload or distribute viruses, malware, or harmful code</li>
                  <li>attempt to probe, scan, or test system vulnerabilities</li>
                  <li>interfere with, disrupt, or overload the Service</li>
                  <li>automate interactions in ways that degrade performance</li>
                  <li>bypass or attempt to bypass any security or authentication measures</li>
                </ul>
                <p className="text-muted-foreground mt-4 mb-4">
                  Accounts linked to attempts to compromise system integrity may be suspended immediately.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Prohibited Content Categories</h2>
                <p className="text-muted-foreground mb-4">
                  The following content is strictly prohibited:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>sexually explicit or suggestive content</li>
                  <li>violent or graphic imagery</li>
                  <li>depictions of exploitation, abuse, or cruelty</li>
                  <li>extremist or hateful content</li>
                  <li>promotions of dangerous acts</li>
                  <li>any content violating laws or regulations</li>
                </ul>
                <p className="text-muted-foreground mt-4 mb-4">
                  We reserve the right to remove content at our discretion.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Platform Misuse</h2>
                <p className="text-muted-foreground mb-4">
                  You may not use the Service to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>gather data through scraping or unauthorized means</li>
                  <li>create multiple accounts to exploit features</li>
                  <li>reverse-engineer or copy the platform</li>
                  <li>interfere with user experience or system functionality</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Enforcement</h2>
                <p className="text-muted-foreground mb-4">
                  We may take action for violations of this Policy, including:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>removal of content</li>
                  <li>feature limitations</li>
                  <li>temporary account suspension</li>
                  <li>permanent account termination</li>
                  <li>reporting unlawful content to authorities</li>
                </ul>
                <p className="text-muted-foreground mt-4 mb-4">
                  We determine actions on a case-by-case basis to maintain a safe and respectful environment.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
                <p className="text-muted-foreground mb-4">
                  We may update this Policy periodically. Continued use of the Service indicates acceptance of the updated terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">11. Contact</h2>
                <p className="text-muted-foreground">
                  For questions regarding this Policy, contact:
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

export default AcceptableUsePolicy;

