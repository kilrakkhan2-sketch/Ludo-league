import * as React from "react"

const MOBILE_BREAKPOINT = 640 // Changed from 768 to apply desktop styles sooner

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkIsMobile = () => {
      // This will only run on the client, after initial hydration
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Run on mount
    checkIsMobile();
    
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return isMobile;
}
