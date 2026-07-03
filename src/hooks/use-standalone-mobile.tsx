import * as React from "react";
import { Capacitor } from "@capacitor/core";

/**
 * Hook to detect if the app is running in standalone mode on mobile
 * (PWA from home screen OR Capacitor native app)
 */
export function useIsStandaloneMobile() {
  const [isStandaloneMobile, setIsStandaloneMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    const checkStandalone = () => {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      
      setIsStandaloneMobile((isMobile && isStandalone) || Capacitor.isNativePlatform());
    };

    checkStandalone();
    
    // Listen for changes (though unlikely to change during session)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => checkStandalone();
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return isStandaloneMobile;
}
