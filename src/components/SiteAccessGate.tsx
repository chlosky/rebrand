import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { hasSiteAccessGrant, isSiteAccessRequired } from "@/lib/toolSite";

type SiteAccessGateProps = {
  children: ReactNode;
};

const PUBLIC_PATHS = new Set(["/"]);

export function SiteAccessGate({ children }: SiteAccessGateProps) {
  const location = useLocation();
  const required = isSiteAccessRequired();
  const granted = hasSiteAccessGrant();

  if (!required || granted) {
    return <>{children}</>;
  }

  if (!PUBLIC_PATHS.has(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
