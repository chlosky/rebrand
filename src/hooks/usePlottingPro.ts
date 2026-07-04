import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function usePlottingPro() {
  const { user, isLoading: authLoading } = useAuth();
  const [hasPro, setHasPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setHasPro(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc("has_active_plotting_subscription");
        if (cancelled) return;
        if (error) {
          setHasPro(false);
          return;
        }
        setHasPro(Boolean(data));
      } catch {
        if (!cancelled) setHasPro(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading]);

  return { hasPro, loading: authLoading || loading };
}
