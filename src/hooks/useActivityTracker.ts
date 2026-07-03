import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TrackActivityParams {
  action: string;
  details?: Record<string, any>;
}

// Cache IP address to avoid repeated lookups
let cachedIpAddress: string | null = null;

export const useActivityTracker = () => {
  const trackActivity = async ({ action, details }: TrackActivityParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Use cached IP or skip lookup for performance
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action,
        details: details || null,
        ip_address: cachedIpAddress,
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Failed to track activity:', error);
    }
  };

  return { trackActivity };
};

// Hook to track page visits automatically
export const usePageVisitTracker = (pageName: string) => {
  const { trackActivity } = useActivityTracker();

  useEffect(() => {
    trackActivity({
      action: 'page_visit',
      details: { page: pageName }
    });
  }, [pageName]);
};
