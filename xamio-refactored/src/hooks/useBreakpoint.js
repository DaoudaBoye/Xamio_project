/**
 * useBreakpoint — Hook responsive pour détecter la taille d'écran
 * Breakpoints : mobile < 768px, tablet 768-1024px, desktop > 1024px
 */
import { useState, useEffect } from 'react';

export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
};

export function useBreakpoint() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  useEffect(() => {
    let rafId;
    function handleResize() {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setWidth(window.innerWidth));
    }
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return {
    isMobile:  width < BREAKPOINTS.MOBILE,
    isTablet:  width >= BREAKPOINTS.MOBILE && width < BREAKPOINTS.TABLET,
    isDesktop: width >= BREAKPOINTS.TABLET,
    width,
  };
}
