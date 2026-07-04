import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function VerifyEmail() {
  const { t } = useTranslation(["auth", "common"]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (!token) {
        setStatus("error");
        setErrorMsg(t("verifyEmail.missingToken"));
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("verify-email", {
          body: { token },
        });
        if (error) throw error;
        if (!data?.success) throw new Error(t("verifyEmail.verificationFailed"));
        if (!isMounted) return;
        setStatus("success");
      } catch (e: any) {
        if (!isMounted) return;
        setStatus("error");
        setErrorMsg(e?.message || t("verifyEmail.verificationFailed"));
      }
    };

    run();
    return () => {
      isMounted = false;
    };
  }, [token, t]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center space-y-6">
        {status === "loading" && (
          <div className="space-y-3">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <h1 className="text-2xl font-bold">{t("verifyEmail.verifying")}</h1>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-3">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
            <h1 className="text-2xl font-bold">{t("verifyEmail.successTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("verifyEmail.successBody")}</p>
            <Button className="w-full h-12 rounded-full" onClick={() => navigate("/dashboard/boards")}>
              {t("continue", { ns: "common" })}
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-3">
            <h1 className="text-2xl font-bold">{t("verifyEmail.errorTitle")}</h1>
            <p className="text-sm text-muted-foreground">{errorMsg || t("verifyEmail.requestNewEmail")}</p>
            <Button className="w-full h-12 rounded-full" variant="outline" onClick={() => navigate("/dashboard/boards")}>
              {t("verifyEmail.goToDashboard")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
