import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const { t } = useTranslation("auth");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    
    // Automatically redirect to home page after 2 seconds
    const timeout = setTimeout(() => {
      navigate("/", { replace: true });
    }, 2000);

    return () => clearTimeout(timeout);
  }, [location.pathname, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">{t("notFound.title")}</h1>
        <p className="text-xl text-muted-foreground">{t("notFound.message")}</p>
        <p className="text-sm text-muted-foreground">{t("notFound.redirecting")}</p>
      </div>
    </div>
  );
};

export default NotFound;
