import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/** Auth-only gate. Subscription is enforced per tool route + server-side RLS. */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate("/login", {
        replace: true,
        state: { from: location.pathname + location.search },
      });
    }
  }, [isLoading, user, navigate, location.pathname, location.search]);

  if (isLoading) {
    return <div className="min-h-screen bg-[#faf8f5]" aria-busy="true" />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};
