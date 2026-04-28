/**
 * SidebarContext — Gestion de la sidebar
 * - Desktop (>1024px) : collapse/expand classique
 * - Mobile/Tablet (<1024px) : drawer avec overlay
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const SidebarContext = createContext(null);

export const SIDEBAR_W_OPEN     = 220;
export const SIDEBAR_W_CLOSED   = 58;
export const BREAKPOINT_MOBILE  = 768;
export const BREAKPOINT_TABLET  = 1024;

export function SidebarProvider({ children }) {
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  useEffect(() => {
    let rafId;
    function handleResize() {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setScreenWidth(window.innerWidth));
    }
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); cancelAnimationFrame(rafId); };
  }, []);

  // Auto-collapse on tablet
  useEffect(() => {
    if (screenWidth >= BREAKPOINT_MOBILE && screenWidth < BREAKPOINT_TABLET) {
      setCollapsed(true);
    }
    if (screenWidth >= BREAKPOINT_TABLET) {
      setMobileOpen(false);
    }
  }, [screenWidth]);

  const isMobile  = screenWidth < BREAKPOINT_MOBILE;
  const isTablet  = screenWidth >= BREAKPOINT_MOBILE && screenWidth < BREAKPOINT_TABLET;
  const isDesktop = screenWidth >= BREAKPOINT_TABLET;

  const toggle = useCallback(() => {
    if (isMobile) {
      setMobileOpen(o => !o);
    } else {
      setCollapsed(c => !c);
    }
  }, [isMobile]);

  const closeMobileDrawer = useCallback(() => setMobileOpen(false), []);

  const width = isMobile ? 0 : (collapsed ? SIDEBAR_W_CLOSED : SIDEBAR_W_OPEN);

  return (
    <SidebarContext.Provider value={{
      collapsed, mobileOpen, toggle, closeMobileDrawer,
      width, isMobile, isTablet, isDesktop, screenWidth,
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be inside SidebarProvider');
  return ctx;
}
