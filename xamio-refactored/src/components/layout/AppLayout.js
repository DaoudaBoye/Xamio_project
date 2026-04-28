/**
 * AppLayout — Mise en page principale responsive
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppLayout() {
  const { width, isMobile, isTablet } = useSidebar();
  const contentPadding = isMobile ? '16px 14px' : isTablet ? '20px 20px' : '28px 32px';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-background)' }}>
      <Sidebar />
      <main style={{
        marginLeft: width,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        transition: 'margin-left 260ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <TopBar />
        <div style={{ flex: 1, overflowY: 'auto', padding: contentPadding }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
