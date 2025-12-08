import * as React from "react"

const MOBILE_BREAKPOINT = 768; // md breakpoint

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    // This effect runs only on the client
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Initial check
    checkIsMobile();

    // Add resize listener
    window.addEventListener("resize", checkIsMobile);

    // Cleanup listener
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return isMobile;
}
