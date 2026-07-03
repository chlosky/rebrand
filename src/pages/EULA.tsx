import { Card, CardContent } from "@/components/ui/card";
import { MarketingSiteLayout } from "@/components/marketing/MarketingSiteLayout";

const EULA = () => {
  return (
    <MarketingSiteLayout>
      <div className="container mx-auto max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h1 className="text-4xl font-bold mb-6">End User License Agreement</h1>
            <p className="text-sm text-muted-foreground mb-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <div className="space-y-6 prose prose-sm max-w-none">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
                <p className="text-muted-foreground mb-4">
                  This End User License Agreement ("EULA") is a legal agreement between you and Palette Plotting for the use of our software and services. By accessing or using Palette Plotting, you agree to be bound by the terms of this EULA.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. License Grant</h2>
                <p className="text-muted-foreground mb-4">
                  Subject to your compliance with this EULA, Palette Plotting grants you a limited, non-exclusive, non-transferable, revocable license to access and use our service for your personal, non-commercial use.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. License Restrictions</h2>
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
                <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property</h2>
                <p className="text-muted-foreground mb-4">
                  The service, including all content, features, and functionality, is owned by Palette Plotting and is protected by copyright, trademark, and other intellectual property laws. This EULA does not grant you any rights to use our trademarks, logos, or other brand features.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. User Content</h2>
                <p className="text-muted-foreground mb-4">
                  You allow Palette Plotting and the infrastructure providers that support the Service to host, store, transmit, and technically process your content only as needed to provide the Service to your account, deliver it back to you, sync it across your devices, and run features you choose to use. This permission is limited, non-exclusive, and royalty-free, and applies only for as long as the content is stored for your account.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Termination</h2>
                <p className="text-muted-foreground mb-4">
                  This license is effective until terminated. We may terminate or suspend your access immediately, without prior notice, for any breach of this EULA. Upon termination, your right to use the service will cease immediately.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Disclaimer of Warranties</h2>
                <p className="text-muted-foreground mb-4">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
                <p className="text-muted-foreground mb-4">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, PALETTE PLOTTING SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Updates and Modifications</h2>
                <p className="text-muted-foreground mb-4">
                  We reserve the right to modify, update, or discontinue the service at any time. We may also update this EULA from time to time. Your continued use of the service after such changes constitutes acceptance of the updated EULA.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Governing Law</h2>
                <p className="text-muted-foreground mb-4">
                  This EULA shall be governed by and construed in accordance with applicable laws, without regard to its conflict of law provisions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
                <p className="text-muted-foreground">
                  If you have questions about this EULA, please contact us at support@paletteplot.com
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </MarketingSiteLayout>
  );
};

export default EULA;
