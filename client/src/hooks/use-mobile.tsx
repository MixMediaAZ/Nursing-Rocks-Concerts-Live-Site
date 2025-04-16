import { useState, useEffect } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if we're on the client-side
    if (typeof window === "undefined") return;

    // Set initial state
    setIsMobile(window.innerWidth < 768);

    // Handle resize events
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}