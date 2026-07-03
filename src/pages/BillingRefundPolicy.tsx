import type { ComponentType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingSiteLayout } from "@/components/marketing/MarketingSiteLayout";
import type { LegalRouteLocale } from "@/lib/locale";
import { BillingRefundPolicyContentAR } from "./legal/BillingRefundPolicyContentAR";
import { BillingRefundPolicyContentES } from "./legal/BillingRefundPolicyContentES";
import { BillingRefundPolicyContentFR } from "./legal/BillingRefundPolicyContentFR";
import { BillingRefundPolicyContentIT } from "./legal/BillingRefundPolicyContentIT";
import { BillingRefundPolicyContentPT } from "./legal/BillingRefundPolicyContentPT";

type BillingRefundPolicyProps = {
  legalLocale?: LegalRouteLocale;
};

const BILLING_BY_LOCALE: Partial<Record<LegalRouteLocale, ComponentType>> = {
  AR: BillingRefundPolicyContentAR,
  ES: BillingRefundPolicyContentES,
  PT: BillingRefundPolicyContentPT,
  FR: BillingRefundPolicyContentFR,
  IT: BillingRefundPolicyContentIT,
};

const BillingRefundPolicy = ({ legalLocale }: BillingRefundPolicyProps) => {
  const LocalizedPolicy = legalLocale ? BILLING_BY_LOCALE[legalLocale] : undefined;

  return (
    <MarketingSiteLayout>
      <div className="container mx-auto max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <Card className="mb-8">
          <CardContent className="pt-6">
            {LocalizedPolicy ? (
              <LocalizedPolicy />
            ) : (
              <>
            <h1 className="text-4xl font-bold mb-6">Billing & Refund Policy</h1>
            <p className="text-sm text-muted-foreground mb-8">
              Effective Date: Jan 13, 2025<br />
              Company: Palette Plotting LLC ("Palette Plotting," "we," "our," "us")
            </p>

            <div className="space-y-6 prose prose-sm max-w-none">
              <section>
                <p className="text-muted-foreground mb-4">
                  This Billing & Refund Policy ("Policy") explains how subscriptions, payments, renewals, cancellations, and refunds operate for Palette Plotting.
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>How you pay depends on where you subscribe:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li><strong>Website (desktop/web):</strong> Subscriptions are processed by Stripe. This Policy applies in full to those purchases.</li>
                  <li><strong>iOS app:</strong> Subscriptions are purchased through the Apple App Store (in-app purchase). Apple processes payment and Apple’s terms apply to the transaction. Refund requests for iOS purchases must be submitted to Apple, not to Palette Plotting.</li>
                  <li><strong>Android app:</strong> Subscriptions are purchased through Google Play’s in-app billing. Google processes payment and Google’s terms apply. To request a refund for a Google Play purchase, use Google’s purchase help or your order history in the Play Store (for example, <a href="https://play.google.com/store/account/orderhistory" className="text-primary underline" target="_blank" rel="noopener noreferrer">play.google.com/store/account/orderhistory</a>). Palette Plotting does not process refunds for those purchases.</li>
                </ul>
                <p className="text-muted-foreground mb-4">
                  This Policy works together with our Terms of Use and Privacy Policy.
                </p>
                <p className="text-muted-foreground mb-4">
                  By subscribing to Palette Plotting, you agree to this Policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Subscription Plans</h2>
                <p className="text-muted-foreground mb-4">
                  Palette Plotting offers paid subscription plans such as monthly and annual options.
                </p>
                <p className="text-muted-foreground mb-4">
                  Plan names, pricing, and included features may change at any time.
                </p>
                <p className="text-muted-foreground mb-4">
                  Prices are shown in your local currency when available.
                </p>
                <p className="text-muted-foreground mb-4">
                  Your subscription gives you access to premium features for the duration of the paid period.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Payment Processing</h2>
                <p className="text-muted-foreground mb-4">
                  Payments are processed as follows: <strong>Website (desktop/web):</strong> Stripe. <strong>iOS app:</strong> Apple (App Store in-app purchase). Your payment information is held by the processor (Stripe or Apple), not on Palette Plotting servers.
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>Android app:</strong> Google Play (in-app purchase). Google holds your payment information for those purchases; Palette Plotting does not store it on our servers.
                </p>
                <p className="text-muted-foreground mb-4">
                  For website subscriptions, by subscribing you authorize Palette Plotting LLC and Stripe to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>store your payment method</li>
                  <li>automatically charge the applicable subscription fee</li>
                  <li>charge any applicable taxes required by your location</li>
                </ul>
                <p className="text-muted-foreground mt-4 mb-4">
                  For iOS subscriptions, Apple’s payment terms and billing apply; you can manage the subscription in your Apple ID settings.
                </p>
                <p className="text-muted-foreground mb-4">
                  Your payment information is not stored on Palette Plotting servers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Automatic Renewal</h2>
                <p className="text-muted-foreground mb-4">
                  Subscriptions automatically renew at the end of each billing period (monthly or yearly) unless you cancel beforehand.
                </p>
                <p className="text-muted-foreground mb-4">
                  Upon renewal:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>your payment method will be charged</li>
                  <li>the subscription period will extend for the same duration</li>
                  <li>the most current pricing at renewal time will apply</li>
                </ul>
                <p className="text-muted-foreground mt-4 mb-4">
                  We will notify you of pricing changes in accordance with applicable law.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Cancellation Policy</h2>
                <p className="text-muted-foreground mb-4">
                  You may cancel your subscription at any time. <strong>Website:</strong> cancel from your account settings. <strong>iOS app:</strong> cancel via your Apple ID subscription settings (or in the App Store).
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>Android app:</strong> cancel or manage your subscription in the Google Play Store (Subscriptions) or your Google account.
                </p>
                <p className="text-muted-foreground mb-4">
                  When you cancel:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>your subscription will remain active for the remainder of the current billing period</li>
                  <li>you will not receive a refund for the current billing period</li>
                  <li>access to paid features will end when the period expires</li>
                </ul>
                <p className="text-muted-foreground mt-4 mb-4">
                  You can continue using all paid features until your access period ends.
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>Data Retention After Cancellation:</strong> Following a subscription cancellation or lapse, your user content, including belief structure analyses, journal entries, affirmation sets, audio created in the Service, and other media or data created through the Service, may be permanently deleted. While we may retain certain data for a limited period following cancellation, we do not guarantee data retention, and content may be lost due to system errors, technical issues, or changes to our retention policies.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Refund Policy</h2>
                <p className="text-muted-foreground mb-4">
                  Your satisfaction matters to us. While we do not guarantee refunds, we consider refund requests on a case-by-case basis and aim to treat our customers fairly.
                </p>
                <p className="text-muted-foreground mb-4 font-semibold">Subscriptions purchased on the website (Stripe)</p>
                <p className="text-muted-foreground mb-4">
                  For subscriptions paid through our website (processed by Stripe): we do not promise refunds, but you may contact us to request one. We will review your situation (e.g. accidental purchase, technical issue, or the service not working as described) and respond at our discretion. Customer happiness is a priority; when we can reasonably accommodate a request, we will.
                </p>
                <p className="text-muted-foreground mb-4">
                  We do not commit to refunds for partial periods, unused time, forgetting to cancel before renewal, or simply not using the Service—but you are welcome to reach out and we will consider your case.
                </p>
                <p className="text-muted-foreground mb-4 font-semibold mt-6">Subscriptions purchased in the iOS app (Apple)</p>
                <p className="text-muted-foreground mb-4">
                  If you subscribed through the Palette Plotting app on an Apple device, your payment was processed by Apple. We do not process refunds for those purchases. To request a refund, you must contact Apple (e.g. via Report a Problem in the App Store or your Apple ID account). Apple decides whether to grant a refund in accordance with their own policies.
                </p>
                <p className="text-muted-foreground mb-4 font-semibold mt-6">Subscriptions purchased in the Android app (Google Play)</p>
                <p className="text-muted-foreground mb-4">
                  If you subscribed through the Palette Plotting app on Android, your payment was processed by Google Play. We do not process refunds for those purchases. To request a refund, submit your request through Google Play’s purchase help or your order history (for example, <a href="https://play.google.com/store/account/orderhistory" className="text-primary underline" target="_blank" rel="noopener noreferrer">play.google.com/store/account/orderhistory</a>). Google decides whether to grant a refund in accordance with Google’s policies and applicable law.
                </p>
                <p className="text-muted-foreground mb-2 font-semibold mt-6">Legal exceptions (Stripe / website purchases)</p>
                <p className="text-muted-foreground mb-4">
                  If your local law provides mandatory refund or cancellation rights for online purchases, we will comply with those requirements.
                </p>
                <p className="text-muted-foreground mb-4">
                  Users in certain regions (such as the EU/UK) may have limited withdrawal rights for digital services.
                </p>
                <p className="text-muted-foreground mb-4">
                  These rights apply only where legally required.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Failed Payments</h2>
                <p className="text-muted-foreground mb-4">
                  If a payment attempt fails:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Stripe may retry the charge automatically</li>
                  <li>access to premium features may be paused</li>
                  <li>your subscription may be cancelled if payment is not completed</li>
                </ul>
                <p className="text-muted-foreground mt-4 mb-4">
                  <strong>Android app (Google Play):</strong> failed renewals and payment issues are handled in the Google Play Store and your Google account settings.
                </p>
                <p className="text-muted-foreground mt-4 mb-4">
                  You are responsible for keeping your payment information current.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Promotional Offers</h2>
                <p className="text-muted-foreground mb-4">
                  From time to time, Palette Plotting may offer introductory pricing or promo codes.
                </p>
                <p className="text-muted-foreground mb-4">
                  Promotions:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>apply only for the stated period</li>
                  <li>may require renewal at standard pricing</li>
                  <li>cannot be retroactively applied</li>
                  <li>may be modified or discontinued at any time</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Taxes</h2>
                <p className="text-muted-foreground mb-4">
                  Purchases may be subject to taxes (such as sales tax, VAT, or GST), depending on your location.
                </p>
                <p className="text-muted-foreground mb-4">
                  Stripe calculates and collects taxes where required.
                </p>
                <p className="text-muted-foreground mb-4">
                  For Google Play purchases, Google may calculate, collect, and remit applicable taxes according to Google’s policies and your region.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Chargebacks & Disputes</h2>
                <p className="text-muted-foreground mb-4">
                  If you dispute a charge with your bank instead of contacting us first:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>your account may be suspended pending resolution</li>
                  <li>you remain responsible for legitimate charges</li>
                  <li>we may provide Stripe and your bank with documentation supporting the transaction</li>
                </ul>
                <p className="text-muted-foreground mt-4 mb-4">
                  We encourage you to contact us directly before initiating a dispute.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Changes to Billing Terms</h2>
                <p className="text-muted-foreground mb-4">
                  We may modify this Policy occasionally.
                </p>
                <p className="text-muted-foreground mb-4">
                  Your continued use of the Service after changes indicates acceptance of the updated Policy.
                </p>
                <p className="text-muted-foreground mb-4">
                  We will comply with notice requirements for price changes when applicable.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">11. Contact</h2>
                <p className="text-muted-foreground">
                  For billing questions or assistance, contact us at:
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

export default BillingRefundPolicy;

