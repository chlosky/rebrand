import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
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
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[#faf8f5]"
        aria-busy="true"
        aria-label="Redirecting to sign in"
      >
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return <>{children}</>;
};
