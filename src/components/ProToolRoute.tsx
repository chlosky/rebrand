import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePlottingPro } from "@/hooks/usePlottingPro";

interface ProToolRouteProps {
  children: ReactNode;
}

/** Client redirect only — board mutations are enforced in Postgres RLS + edge functions. */
export function ProToolRoute({ children }: ProToolRouteProps) {
  const { hasPro, loading } = usePlottingPro();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen bg-[#faf8f5]" aria-busy="true" />;
  }

  if (!hasPro) {
    const tab = location.pathname.includes("/boards") ? "projects" : "create";
    return <Navigate to={`/workspace?tab=${tab}`} replace />;
  }

  return <>{children}</>;
}
