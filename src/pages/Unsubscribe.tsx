import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { SEO } from "@/components/SEO";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "not-found">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribeEmail = async () => {
      if (!email) {
        setStatus("error");
        setMessage("No email address provided.");
        return;
      }

      try {
        // Update email_captures table to set marketing_consent to false
        const { data, error } = await supabase
          .from("email_captures")
          .update({ marketing_consent: false })
          .eq("email", email.toLowerCase().trim())
          .select();

        if (error) {
          console.error("Error unsubscribing:", error);
          setStatus("error");
          setMessage("An error occurred while processing your unsubscribe request.");
          return;
        }

        if (data && data.length > 0) {
          setStatus("success");
          setMessage("You have been successfully unsubscribed from email marketing communications.");
        } else {
          // Email not found in email_captures
          setStatus("not-found");
          setMessage("We couldn't find your email address in our marketing list. You may already be unsubscribed. If you're a registered user, you can manage your email preferences in your account settings.");
        }
      } catch (err) {
        console.error("Error unsubscribing:", err);
        setStatus("error");
        setMessage("An error occurred while processing your unsubscribe request.");
      }
    };

    unsubscribeEmail();
  }, [email]);

  return (
    <>
      <SEO 
        title="Unsubscribe"
        description="Unsubscribe from palette plotting email marketing communications"
        noindex={true}
      />
      <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8 text-center">
          {email && (
            <div className="mb-6 pb-4 border-b">
              <p className="text-sm text-muted-foreground mb-1">Unsubscribing email:</p>
              <p className="text-base font-medium text-foreground break-all">{email}</p>
            </div>
          )}
          
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Processing your unsubscribe request...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <h1 className="text-2xl font-bold">Unsubscribed</h1>
              <p className="text-muted-foreground">{message}</p>
              <p className="text-sm text-muted-foreground mt-2">
                You will no longer receive marketing emails from palette plotting. Transactional emails (like account updates) will still be sent.
              </p>
              <Button onClick={() => navigate("/")} className="mt-4">
                Return to Homepage
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="h-12 w-12 text-red-600" />
              <h1 className="text-2xl font-bold">Error</h1>
              <p className="text-muted-foreground">{message}</p>
              <Button onClick={() => navigate("/contact")} variant="outline" className="mt-4">
                Contact Support
              </Button>
            </div>
          )}

          {status === "not-found" && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground" />
              <h1 className="text-2xl font-bold">Already Unsubscribed</h1>
              <p className="text-muted-foreground">{message}</p>
              <Button onClick={() => navigate("/")} className="mt-4">
                Return to Homepage
              </Button>
            </div>
          )}
        </Card>
      </main>
    </>
  );
};

export default Unsubscribe;
