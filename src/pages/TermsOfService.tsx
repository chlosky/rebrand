import type { ComponentType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingSiteLayout } from "@/components/marketing/MarketingSiteLayout";
import type { LegalRouteLocale } from "@/lib/locale";
import { TermsOfServiceContentAR } from "./legal/TermsOfServiceContentAR";
import { TermsOfServiceContentDE } from "./legal/TermsOfServiceContentDE";
import { TermsOfServiceContentES } from "./legal/TermsOfServiceContentES";
import { TermsOfServiceContentFR } from "./legal/TermsOfServiceContentFR";
import { TermsOfServiceContentIT } from "./legal/TermsOfServiceContentIT";
import { TermsOfServiceContentNL } from "./legal/TermsOfServiceContentNL";
import { TermsOfServiceContentPT } from "./legal/TermsOfServiceContentPT";
import { TermsOfServiceContentZH } from "./legal/TermsOfServiceContentZH";

type TermsOfServiceProps = {
  legalLocale?: LegalRouteLocale;
};

const TERMS_BY_LOCALE: Record<LegalRouteLocale, ComponentType> = {
  ES: TermsOfServiceContentES,
  PT: TermsOfServiceContentPT,
  DE: TermsOfServiceContentDE,
  FR: TermsOfServiceContentFR,
  IT: TermsOfServiceContentIT,
  NL: TermsOfServiceContentNL,
  ZH: TermsOfServiceContentZH,
  AR: TermsOfServiceContentAR,
};

const TermsOfService = ({ legalLocale }: TermsOfServiceProps) => {
  const LocalizedTerms = legalLocale ? TERMS_BY_LOCALE[legalLocale] : null;

  return (
    <MarketingSiteLayout>
      <div className="container mx-auto max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <Card className="mb-8">
          <CardContent className="pt-6">
            {LocalizedTerms ? (
              <LocalizedTerms />
            ) : (
              <>
            <h1 className="text-4xl font-bold mb-6">Terms of Use and EULA</h1>
            <p className="text-sm text-muted-foreground mb-8">
              Effective Date: Jan 13, 2025<br />
              Company: Palette Plotting LLC ("Palette Plotting," "we," "our," "us")
            </p>

            <h2 className="text-2xl font-semibold mb-4">Terms of Use</h2>
            <div className="space-y-6 prose prose-sm max-w-none">
              <section>
                <p className="text-muted-foreground mb-4">
                  These Terms of Use ("Terms") govern your access to and use of Palette Plotting, including all digital tools, features, content, and services offered through our website, app, or PWA (collectively, the "Service").
                </p>
                <p className="text-muted-foreground mb-4">
                  By using the Service, you agree to these Terms.
                </p>
                <p className="text-muted-foreground mb-4">
                  If you do not agree, do not use the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Eligibility</h2>
                <p className="text-muted-foreground mb-4">
                  The Service is intended for individuals 18 years of age or older.
                </p>
                <p className="text-muted-foreground mb-4">
                  You may not use the Service if you are under 18.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Overview of the Service</h2>
                <p className="text-muted-foreground mb-4">
                  Palette Plotting provides digital tools intended to support personal reflection, goal-setting, journaling, audio creation, and mindset development. Certain parts of the Service may include automated features, system-generated suggestions, or technology-assisted content.
                </p>
                <p className="text-muted-foreground mb-4">
                  The Service is not medical, psychological, therapeutic, financial, or legal advice, and is not a substitute for professional support.
                </p>
                <p className="text-muted-foreground mb-4">
                  We may update or modify features of the Service at any time.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
                <p className="text-muted-foreground mb-4">
                  To use certain features, you may need to create an account. You agree to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>provide accurate information</li>
                  <li>maintain confidentiality of your login credentials</li>
                  <li>notify us of any unauthorized use</li>
                </ul>
                <p className="text-muted-foreground mt-4 mb-4">
                  You are responsible for activity that occurs under your account.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
                <p className="text-muted-foreground mb-4">
                  You must comply with our Acceptable Use Policy, which is incorporated by reference and available separately.
                </p>
                <p className="text-muted-foreground mb-4">
                  Prohibited behavior includes, but is not limited to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>harassment, abuse, or hateful conduct</li>
                  <li>uploading or sharing unlawful or inappropriate content</li>
                  <li>engaging in fraud, impersonation, or misrepresentation</li>
                  <li>attempting to interfere with or disrupt the Service</li>
                  <li>using the Service for any illegal or unsafe purpose</li>
                  <li>attempting to bypass system safeguards</li>
                  <li>exploiting minors or posting content involving minors in any inappropriate context</li>
                  <li>uploading copyrighted content without permission</li>
                </ul>
                <p className="text-muted-foreground mt-4 mb-4">
                  We may suspend or terminate your account for violations.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. User Content</h2>
                <p className="text-muted-foreground mb-4">
                  "User Content" includes text, audio, notes, journal entries, affirmations, music compositions, or other material you input or generate through the Service.
                </p>
                <p className="text-muted-foreground mb-4">
                  You allow Palette Plotting and the infrastructure providers that support the Service to host, store, transmit, and technically process your User Content only as needed to save it to your account, deliver it back to you, sync it across your devices, and run features you choose to use (such as audio generation or formatting). This permission is limited, non-exclusive, and royalty-free, and applies only for as long as the content is stored for your account.
                </p>
                <p className="text-muted-foreground mb-4">
                  We do not use your private User Content for advertising, public display, or general product development unless you separately opt in (for example, optional data training in Settings). Palette Plotting does not routinely review private journals, affirmations, or audio for editorial or commercial purposes.
                </p>
                <p className="text-muted-foreground mb-4">
                  We may remove content that violates these Terms or the Acceptable Use Policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5a. Music Composition & Copyright</h2>
                <p className="text-muted-foreground mb-4">
                  When using the Music Composer feature, you acknowledge and agree that:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>You will only create original music compositions</li>
                  <li>You will not recreate, copy, or imitate copyrighted melodies, songs, or musical works</li>
                  <li>You are solely responsible for ensuring your compositions do not infringe on any existing copyrights, trademarks, or intellectual property rights</li>
                  <li>You will indemnify and hold Palette Plotting harmless from any claims arising from copyright infringement in your compositions</li>
                </ul>
                <p className="text-muted-foreground mt-4 mb-4">
                  Violation of these terms may result in immediate removal of content and account termination.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Technology-Assisted and System-Generated Content</h2>
                <p className="text-muted-foreground mb-4">
                  Some features may offer automated responses, suggestions, or AI-generated content to support your reflection or creative goals. You acknowledge that:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>such content may be imperfect or incomplete</li>
                  <li>it is not a substitute for professional advice</li>
                  <li>you are responsible for how you use it</li>
                </ul>
                <p className="text-muted-foreground mt-4 mb-4">
                  We may adjust or limit these features at any time.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Goal Notifications</h2>
                <p className="text-muted-foreground mb-4">
                  Goal notifications may be set up using external tools or services chosen by the user, such as calendar integrations, device automations, or operating system–level shortcuts. These tools may be used to remind users to review goals, open weekly check-ins, or access specific areas of the Service at selected times.
                </p>
                <p className="text-muted-foreground mb-4">
                  Palette Plotting does not currently send goal notifications via SMS/email and does not control, operate, or guarantee the performance of third-party calendars, device automations, or operating system features. Palette Plotting is not responsible for missed alerts, delivery failures, scheduling errors, device settings, or changes made by third-party providers.
                </p>
                <p className="text-muted-foreground mb-4">
                  Use of external notification tools is optional and managed entirely by the user.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Subscriptions & Billing</h2>
                <p className="text-muted-foreground mb-4">
                  Palette Plotting offers subscription plans (including options such as monthly or annual plans). Plan names and pricing may change.
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>Features, Access Levels, and Rate Limits:</strong> Features included in each subscription tier, access levels to specific functionality, rate limits (such as daily message limits, weekly creation limits, and storage quotas), and other subscription benefits are subject to change at any time without prior notice. We reserve the right to modify, add, or remove features, adjust rate limits, change access levels, or alter any aspect of the subscription tiers as needed to maintain service quality, prevent abuse, or adapt to operational requirements. Continued use of the Service after such changes constitutes your acceptance of the modifications.
                </p>
                <p className="text-muted-foreground mb-4">
                  All sales are final, except where required by applicable law.
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>Google Play (Android):</strong> In-app subscriptions purchased through the Android app use Google Play’s billing system. Payment, renewals, cancellations, and refund requests are handled under Google’s policies; submit refund requests through Google Play, not Palette Plotting.
                </p>
                <p className="text-muted-foreground mb-4">
                  By subscribing, you authorize recurring billing until you cancel. Cancellations take effect at the end of the current billing period.
                </p>
                <p className="text-muted-foreground mb-4">
                  We do not offer refunds for partial periods or unused time.
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>Data Retention:</strong> In the event of a subscription lapse or cancellation, your user content, including but not limited to belief structure analyses, journal entries, affirmation sets, audio created in the Service, and other media or data created through the Service, may be permanently deleted. While we may retain certain data for a limited period following cancellation, we do not guarantee data retention, and content may be lost due to system errors, technical issues, or policy changes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Intellectual Property</h2>
                <p className="text-muted-foreground mb-4">
                  Palette Plotting and all associated content, branding, design, and materials are owned by Palette Plotting LLC or its licensors.
                </p>
                <p className="text-muted-foreground mb-4">
                  You may not:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>copy or distribute the Service</li>
                  <li>reverse engineer the software</li>
                  <li>misuse trademarks or branding</li>
                  <li>create derivative works from the platform</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Service Changes</h2>
                <p className="text-muted-foreground mb-4">
                  We may modify, discontinue, or update any part of the Service at any time.
                </p>
                <p className="text-muted-foreground mb-4">
                  We are not liable for changes, suspensions, or service interruptions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">11. Disclaimers</h2>
                <p className="text-muted-foreground mb-4">
                  The Service is provided "as is" and "as available."
                </p>
                <p className="text-muted-foreground mb-4">
                  We do not guarantee:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>specific results</li>
                  <li>uninterrupted availability</li>
                  <li>accuracy of system-generated content</li>
                </ul>
                <p className="text-muted-foreground mt-4 mb-4">
                  We disclaim all warranties to the fullest extent permitted by law.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">12. Limitation of Liability</h2>
                <p className="text-muted-foreground mb-4">
                  To the maximum extent permitted by law, Palette Plotting LLC is not liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the Service.
                </p>
                <p className="text-muted-foreground mb-4">
                  Our total liability for any claim will not exceed the amount you paid in subscription fees during the 12 months preceding the claim.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">13. Indemnification</h2>
                <p className="text-muted-foreground mb-4">
                  You agree to indemnify and hold Palette Plotting LLC harmless from claims arising out of:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>your misuse of the Service</li>
                  <li>your violation of these Terms</li>
                  <li>your User Content</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">14. Governing Law</h2>
                <p className="text-muted-foreground mb-4">
                  These Terms are governed by the laws of the State of Illinois, without regard to conflict-of-law rules.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">15. Changes to the Terms</h2>
                <p className="text-muted-foreground mb-4">
                  We may update these Terms. Continued use of the Service indicates acceptance of the updated version.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">16. Contact</h2>
                <p className="text-muted-foreground">
                  Questions may be directed to:
                </p>
                <p className="text-muted-foreground">
                  support@paletteplot.com
                </p>
              </section>
            </div>

            <h2 className="text-2xl font-semibold mb-4 mt-12">EULA</h2>
            <p className="text-sm text-muted-foreground mb-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            <div className="space-y-6 prose prose-sm max-w-none">
              <section>
                <h3 className="text-xl font-semibold mb-4">1. Agreement to Terms</h3>
                <p className="text-muted-foreground mb-4">
                  This End User License Agreement ("EULA") is a legal agreement between you and Palette Plotting LLC ("Palette Plotting," "we," "our") only, and not with Apple, Inc. ("Apple"). Palette Plotting is solely responsible for the Licensed Application and the content thereof. This EULA may not provide for usage rules that conflict with the Apple Media Services Terms and Conditions as of the Effective Date (which you acknowledge you have had the opportunity to review). By accessing or using Palette Plotting, you agree to be bound by the terms of this EULA.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">2. Scope of License</h3>
                <p className="text-muted-foreground mb-4">
                  Subject to your compliance with this EULA, Palette Plotting grants you a limited, non-exclusive, non-transferable, revocable license to use the Licensed Application on any Apple-branded products that you own or control, as permitted by the Usage Rules set forth in the Apple Media Services Terms and Conditions. This license allows the Licensed Application to be accessed and used by other accounts associated with you via Family Sharing or volume purchasing.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">3. Maintenance and Support</h3>
                <p className="text-muted-foreground mb-4">
                  Palette Plotting is solely responsible for providing any maintenance and support services with respect to the Licensed Application, as specified in this EULA or as required under applicable law. You acknowledge that Apple has no obligation whatsoever to furnish any maintenance or support services with respect to the Licensed Application.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">4. Warranty</h3>
                <p className="text-muted-foreground mb-4">
                  Palette Plotting is solely responsible for any product warranties, whether express or implied by law, to the extent not effectively disclaimed. For purchases made through the App Store (including in-app subscriptions), in the event of any failure of the Licensed Application to conform to any applicable warranty, you may notify Apple, and Apple will refund the purchase price for that App Store purchase to you. This does not apply to subscriptions or purchases made through our website or other payment methods (e.g., Stripe); those are governed by our general Terms of Use and billing policy. To the maximum extent permitted by applicable law, Apple will have no other warranty obligation whatsoever with respect to the Licensed Application, and any other claims, losses, liabilities, damages, costs or expenses attributable to any failure to conform to any warranty will be Palette Plotting's sole responsibility.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">5. Product Claims</h3>
                <p className="text-muted-foreground mb-4">
                  You and Palette Plotting acknowledge that Palette Plotting, not Apple, is responsible for addressing any claims of yours or any third party relating to the Licensed Application or your possession and/or use of the Licensed Application, including but not limited to: (i) product liability claims; (ii) any claim that the Licensed Application fails to conform to any applicable legal or regulatory requirement; and (iii) claims arising under consumer protection, privacy, or similar legislation. This EULA may not limit Palette Plotting's liability to you beyond what is permitted by applicable law.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">6. Intellectual Property Claims</h3>
                <p className="text-muted-foreground mb-4">
                  You and Palette Plotting acknowledge that, in the event of any third party claim that the Licensed Application or your possession and use of the Licensed Application infringes that third party's intellectual property rights, Palette Plotting, not Apple, will be solely responsible for the investigation, defense, settlement and discharge of any such intellectual property infringement claim.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">7. Legal Compliance</h3>
                <p className="text-muted-foreground mb-4">
                  You represent and warrant that (i) you are not located in a country that is subject to a U.S. Government embargo, or that has been designated by the U.S. Government as a "terrorist supporting" country; and (ii) you are not listed on any U.S. Government list of prohibited or restricted parties.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">8. Developer Name and Contact</h3>
                <p className="text-muted-foreground mb-4">
                  The Licensed Application is licensed by Palette Plotting LLC. Questions, complaints or claims with respect to the Licensed Application should be directed to: support@paletteplot.com. (For mailing address, contact us at the email above.)
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">9. Third Party Terms</h3>
                <p className="text-muted-foreground mb-4">
                  You must comply with applicable third party terms of agreement when using the Licensed Application (e.g., you must not be in violation of your wireless data service agreement when using the Licensed Application).
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">10. Third Party Beneficiary</h3>
                <p className="text-muted-foreground mb-4">
                  You and Palette Plotting acknowledge and agree that Apple, and Apple's subsidiaries, are third party beneficiaries of this EULA, and that, upon your acceptance of the terms and conditions of this EULA, Apple will have the right (and will be deemed to have accepted the right) to enforce this EULA against you as a third party beneficiary thereof.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">11. License Restrictions</h3>
                <p className="text-muted-foreground mb-4">
                  You may not:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Copy, modify, or create derivative works of the service</li>
                  <li>Reverse engineer, decompile, or disassemble the service</li>
                  <li>Remove any proprietary notices or labels</li>
                  <li>Rent, lease, loan, or sell access to the service</li>
                  <li>Use the service for any illegal purpose</li>
                  <li>Interfere with or disrupt the service or servers</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">12. Intellectual Property</h3>
                <p className="text-muted-foreground mb-4">
                  The service, including all content, features, and functionality, is owned by Palette Plotting and is protected by copyright, trademark, and other intellectual property laws. This EULA does not grant you any rights to use our trademarks, logos, or other brand features.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">13. User Content</h3>
                <p className="text-muted-foreground mb-4">
                  You allow Palette Plotting to host, store, transmit, and technically process your content only as needed to provide the Licensed Application to your account, as described in the User Content section above.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">14. Termination</h3>
                <p className="text-muted-foreground mb-4">
                  This license is effective until terminated. We may terminate or suspend your access immediately, without prior notice, for any breach of this EULA. Upon termination, your right to use the service will cease immediately.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">15. Disclaimer of Warranties</h3>
                <p className="text-muted-foreground mb-4">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">16. Limitation of Liability</h3>
                <p className="text-muted-foreground mb-4">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, PALETTE PLOTTING SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">17. Updates and Modifications</h3>
                <p className="text-muted-foreground mb-4">
                  We reserve the right to modify, update, or discontinue the service at any time. We may also update this EULA from time to time. Your continued use of the service after such changes constitutes acceptance of the updated EULA.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">18. Governing Law</h3>
                <p className="text-muted-foreground mb-4">
                  This EULA shall be governed by and construed in accordance with applicable laws, without regard to its conflict of law provisions.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">19. Contact Information</h3>
                <p className="text-muted-foreground">
                  If you have questions about this EULA, please contact us at support@paletteplot.com
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

export default TermsOfService;