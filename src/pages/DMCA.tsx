import type { ComponentType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingSiteLayout } from "@/components/marketing/MarketingSiteLayout";
import type { LegalRouteLocale } from "@/lib/locale";
import { DMCAContentAR } from "./legal/DMCAContentAR";
import { DMCAContentES } from "./legal/DMCAContentES";
import { DMCAContentFR } from "./legal/DMCAContentFR";
import { DMCAContentIT } from "./legal/DMCAContentIT";
import { DMCAContentPT } from "./legal/DMCAContentPT";

type DMCAProps = {
  legalLocale?: LegalRouteLocale;
};

const DMCA_BY_LOCALE: Partial<Record<LegalRouteLocale, ComponentType>> = {
  AR: DMCAContentAR,
  ES: DMCAContentES,
  PT: DMCAContentPT,
  FR: DMCAContentFR,
  IT: DMCAContentIT,
};

const DMCA = ({ legalLocale }: DMCAProps) => {
  const LocalizedPolicy = legalLocale ? DMCA_BY_LOCALE[legalLocale] : undefined;

  return (
    <MarketingSiteLayout>
      <div className="container mx-auto max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <Card className="mb-8">
          <CardContent className="pt-6">
            {LocalizedPolicy ? (
              <LocalizedPolicy />
            ) : (
              <>
            <h1 className="text-4xl font-bold mb-6">DMCA Notice & Takedown Policy</h1>
            <p className="text-sm text-muted-foreground mb-8">
              Effective Date: Jan 13, 2025<br />
              Company: Palette Plotting LLC ("Palette Plotting," "we," "our," "us")
            </p>

            <div className="space-y-6 prose prose-sm max-w-none">
              <section>
                <p className="text-muted-foreground mb-4">
                  Palette Plotting respects the intellectual property rights of others and expects users of the Service to do the same.
                </p>
                <p className="text-muted-foreground mb-4">
                  This DMCA Notice & Takedown Policy explains how copyright owners may notify us of alleged infringement and how we will respond in accordance with the Digital Millennium Copyright Act ("DMCA").
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Reporting Copyright Infringement (DMCA Notice)</h2>
                <p className="text-muted-foreground mb-4">
                  If you believe that content available on or through the Service infringes your copyright, you may submit a DMCA Notice requesting removal of that content.
                </p>
                <p className="text-muted-foreground mb-4">
                  Your Notice must include all of the following:
                </p>
                <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                  <li>A physical or electronic signature of the copyright owner or person authorized to act on their behalf.</li>
                  <li>Identification of the copyrighted work you claim has been infringed.</li>
                  <li>Identification of the allegedly infringing material, including specific URLs or locations within the Service where the material is found.</li>
                  <li>Your contact information, including your name, mailing address, telephone number, and email address.</li>
                  <li>A statement that you have a good-faith belief that the use of the material is not authorized by the copyright owner, its agent, or the law.</li>
                  <li>A statement that the information in your notice is accurate, and under penalty of perjury, that you are the copyright owner or authorized to act on their behalf.</li>
                </ol>
                <p className="text-muted-foreground mt-4 mb-2">
                  Submit DMCA Notices to:
                </p>
                <p className="text-muted-foreground mb-2">
                  Email: support@paletteplot.com
                </p>
                <p className="text-muted-foreground mb-4">
                  Subject Line: "DMCA Notice"
                </p>
                <p className="text-muted-foreground mb-4">
                  Upon receipt of a valid DMCA Notice, we will review the material and take appropriate action, which may include removing or disabling access to the content.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Counter-Notification (Restoring Removed Content)</h2>
                <p className="text-muted-foreground mb-4">
                  If your content was removed as a result of a DMCA Notice and you believe this was done in error or that you are authorized to use the material, you may submit a Counter-Notification.
                </p>
                <p className="text-muted-foreground mb-4">
                  Your Counter-Notification must include:
                </p>
                <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                  <li>Your physical or electronic signature.</li>
                  <li>Identification of the removed material and the location where it previously appeared.</li>
                  <li>A statement under penalty of perjury that you have a good-faith belief the material was removed or disabled as a result of mistake or misidentification.</li>
                  <li>Your name, address, telephone number, and email address.</li>
                  <li>A statement that you consent to the jurisdiction of the federal court in your district (or the Northern District of Illinois if outside the U.S.) and that you will accept service of process from the person who filed the original DMCA Notice.</li>
                </ol>
                <p className="text-muted-foreground mt-4 mb-2">
                  Submit Counter-Notifications to:
                </p>
                <p className="text-muted-foreground mb-2">
                  Email: support@paletteplot.com
                </p>
                <p className="text-muted-foreground mb-4">
                  Subject Line: "DMCA Counter-Notification"
                </p>
                <p className="text-muted-foreground mb-4">
                  If we receive a valid Counter-Notification, we may restore the removed content unless the original complainant files a legal action seeking a court order to block the content.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Repeat Infringers</h2>
                <p className="text-muted-foreground mb-4">
                  Palette Plotting may terminate the accounts of users who receive multiple valid DMCA Notices or who repeatedly violate intellectual property laws or this policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. No Legal Advice</h2>
                <p className="text-muted-foreground mb-4">
                  Nothing in this policy constitutes legal advice. If you are unsure whether material infringes your copyright or whether your notice or counter-notice is valid, consult legal counsel.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Contact</h2>
                <p className="text-muted-foreground">
                  For any questions regarding this policy, email us at:
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

export default DMCA;

