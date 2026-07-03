import { Card, CardContent } from "@/components/ui/card";
import { Capacitor } from "@capacitor/core";

type TermsMode = "stripe-web" | "google-play-native";

interface SubscriptionLegalTermsCardProps {
  navigate: (path: string) => void;
}

/**
 * Payment / subscription legal copy: Stripe for web checkout vs Google Play for Android native app.
 */
export function SubscriptionLegalTermsCard({ navigate }: SubscriptionLegalTermsCardProps) {
  const mode: TermsMode =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android"
      ? "google-play-native"
      : "stripe-web";

  return (
    <div className="max-w-4xl mx-auto mt-8 mb-8">
      <Card className="border-border">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Payment terms</h3>

          {mode === "google-play-native" ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                When you subscribe in this Android app, the following applies:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground mb-4">
                <li>Subscriptions are purchased through <strong className="text-foreground">Google Play</strong> and appear on your Google Play purchase history.</li>
                <li>Google charges your Play payment method. Pricing, renewals, trials, and taxes follow Google Play’s rules and your Google account settings.</li>
                <li>Manage or cancel your subscription in the Google Play Store (Subscriptions) or on payments.google.com — not via Stripe card checkout in this app.</li>
                <li>Refund and cancellation policies may be handled by Google and Palette Plotting’s Terms; see our Terms and Privacy Policy for details.</li>
                <li>
                  By subscribing you also agree to our{" "}
                  <button type="button" onClick={() => navigate("/terms")} className="text-primary hover:underline font-medium">
                    Terms of Use
                  </button>
                  ,{" "}
                  <button type="button" onClick={() => navigate("/privacy")} className="text-primary hover:underline font-medium">
                    Privacy Policy
                  </button>
                  ,{" "}
                  <button type="button" onClick={() => navigate("/acceptable-use")} className="text-primary hover:underline font-medium">
                    Acceptable Use Policy
                  </button>
                  , and{" "}
                  <button type="button" onClick={() => navigate("/dmca")} className="text-primary hover:underline font-medium">
                    DMCA Notice & Takedown Policy
                  </button>
                  .
                </li>
              </ul>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">By completing your purchase, you agree to the following:</p>
              <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground mb-4">
                <li>
                  Your subscription will begin immediately and renew automatically at the end of each billing period (monthly, annual, or weekly where offered)
                  unless cancelled beforehand.
                </li>
                <li>Your payment method will be charged the subscription price shown, including any applicable taxes.</li>
                <li>All sales are final. You will not receive a refund or credit for partial periods, unused time, or accidental purchases.</li>
                <li>You may cancel at any time through your account settings. Your plan will remain active until the end of your current billing period.</li>
                <li>Payments are processed securely by Stripe.</li>
                <li>By subscribing, you authorize Palette Plotting LLC to charge your payment method on a recurring basis until you cancel.</li>
                <li>
                  By completing your purchase, you agree to our{" "}
                  <button type="button" onClick={() => navigate("/terms")} className="text-primary hover:underline font-medium">
                    Terms of Use
                  </button>
                  ,{" "}
                  <button type="button" onClick={() => navigate("/privacy")} className="text-primary hover:underline font-medium">
                    Privacy Policy
                  </button>
                  ,{" "}
                  <button type="button" onClick={() => navigate("/acceptable-use")} className="text-primary hover:underline font-medium">
                    Acceptable Use Policy
                  </button>
                  , and{" "}
                  <button type="button" onClick={() => navigate("/dmca")} className="text-primary hover:underline font-medium">
                    DMCA Notice & Takedown Policy
                  </button>
                  .
                </li>
              </ul>
            </>
          )}

          <p className="text-sm text-muted-foreground">If you do not agree to these terms, do not complete the purchase.</p>
        </CardContent>
      </Card>
    </div>
  );
}
