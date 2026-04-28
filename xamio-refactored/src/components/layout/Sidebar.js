import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { usePermissions } from '../../hooks/usePermissions';
import { buildNavGroups } from './navGroups';
import XamioLogo from '../ui/XamioLogo';

/* ─────────────────────────────────────────────────────────
   STYLES INJECTÉS
   ───────────────────────────────────────────────────────── */
const SIDEBAR_CSS = `
  @keyframes sb-open {
    from { opacity: 0; transform: translateY(-6px) scale(.97); }
    to   { opacity: 1; transform: translateY(0)   scale(1);    }
  }
  @keyframes sb-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .sb-item {
    display: flex; align-items: center; gap: 8px;
    height: 34px; padding: 0 9px;
    border-radius: 8px; cursor: pointer; position: relative;
    transition: background 120ms ease, color 120ms ease;
    user-select: none;
  }
  .sb-item:hover { background: var(--color-background-tertiary); }
  .sb-item.active {
    background: var(--color-background-elevated);
    color: var(--color-text-primary) !important;
  }

  .sb-sub {
    display: flex; align-items: center; gap: 7px;
    height: 30px; padding-left: 30px; padding-right: 9px;
    border-radius: 8px; cursor: pointer; position: relative;
    transition: background 120ms ease, color 120ms ease;
    user-select: none;
  }
  .sb-sub:hover { background: var(--color-background-tertiary); }
  .sb-sub.active {
    background: var(--color-background-elevated);
    color: var(--color-text-primary) !important;
  }

  .sb-logout {
    width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
    border-radius: 7px; border: none; background: transparent; cursor: pointer;
    color: var(--color-text-disabled); transition: all 120ms ease; flex-shrink: 0;
  }
  .sb-logout:hover { background: rgba(239,68,68,.1); color: #ef4444; }

  .sb-toggle {
    width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;
    border-radius: 6px; border: none; background: transparent; cursor: pointer;
    color: var(--color-text-disabled); transition: all 120ms ease; flex-shrink: 0;
  }
  .sb-toggle:hover { background: var(--color-background-elevated); color: var(--color-text-secondary); }

  .sb-tooltip {
    position: absolute; left: calc(100% + 10px); top: 50%; transform: translateY(-50%);
    background: var(--color-text-primary); color: var(--color-background);
    font-size: 11px; font-weight: 500; padding: 5px 9px; border-radius: 6px;
    white-space: nowrap; pointer-events: none; z-index: 400;
    animation: sb-fade .12s ease both;
    box-shadow: 0 4px 12px rgba(0,0,0,.18);
  }
  .sb-tooltip::before {
    content: ''; position: absolute; right: 100%; top: 50%; transform: translateY(-50%);
    border: 5px solid transparent; border-right-color: var(--color-text-primary);
  }

  .sb-popup {
    position: absolute; left: calc(100% + 8px); top: 0;
    background: var(--color-background-secondary);
    border: 1px solid var(--color-border);
    border-radius: 10px; padding: 6px;
    min-width: 168px;
    box-shadow: 0 8px 24px rgba(0,0,0,.14);
    z-index: 400;
    animation: sb-open .15s cubic-bezier(.4,0,.2,1) both;
  }

  .sb-avatar-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 7px; border-radius: 9px; cursor: pointer;
    transition: background 120ms ease; width: 100%;
    border: none; background: transparent; font-family: var(--font-sans); text-align: left;
  }
  .sb-avatar-btn:hover { background: var(--color-background-elevated); }

  .sb-user-menu {
    position: absolute; bottom: calc(100% + 6px); left: 6px; right: 6px;
    background: var(--color-background-secondary);
    border: 1px solid var(--color-border);
    border-radius: 10px; overflow: hidden;
    box-shadow: 0 -8px 24px rgba(0,0,0,.12);
    z-index: 400;
    animation: sb-open .15s cubic-bezier(.4,0,.2,1) both;
  }
  .sb-user-menu-item {
    display: flex; align-items: center; gap: 9px;
    padding: 9px 13px; font-size: 12.5px;
    color: var(--color-text-secondary); cursor: pointer;
    transition: background 100ms ease;
    border: none; background: transparent;
    font-family: var(--font-sans); width: 100%; text-align: left;
  }
  .sb-user-menu-item:hover { background: var(--color-background-tertiary); color: var(--color-text-primary); }
  .sb-user-menu-item.danger:hover { background: rgba(239,68,68,.07); color: #ef4444; }

  .sb-role-badge {
    display: inline-flex; align-items: center;
    font-size: 9px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
    padding: 2px 6px; border-radius: 4px;
  }

  .sb-accent-bar {
    position: absolute; left: 0; top: 50%; transform: translateY(-50%);
    width: 2.5px; height: 16px; border-radius: 2px;
    background: #E8400C;
  }

  .sb-group-sep {
    height: 1px; background: var(--color-border);
    margin: 5px 3px; opacity: .7;
  }

  .sb-chevron {
    transition: transform .2s cubic-bezier(.4,0,.2,1);
    flex-shrink: 0;
  }
  .sb-chevron.open { transform: rotate(90deg); }
`;

function injectSidebarCSS() {
  if (typeof document === 'undefined' || document.getElementById('sb-styles')) return;
  const el = document.createElement('style');
  el.id = 'sb-styles';
  el.textContent = SIDEBAR_CSS;
  document.head.appendChild(el);
}
injectSidebarCSS();

/* ─────────────────────────────────────────────────────────
   RÔLE → BADGE COLOR
   ───────────────────────────────────────────────────────── */
const ROLE_COLORS = {
  // Nouveaux rôles XAMIO (depuis Appartenance)
  'Super Admin':      { bg: 'rgba(232,64,12,.15)',  color: '#E8400C',  label: 'Super Admin' },
  'Admin Entreprise': { bg: 'rgba(232,64,12,.15)',  color: '#E8400C',  label: 'Admin' },
  'Directeur':        { bg: 'rgba(99,102,241,.15)', color: '#6366f1',  label: 'Directeur' },
  'Manager':          { bg: 'rgba(16,185,129,.15)', color: '#10b981',  label: 'Manager' },
  'Assistant':        { bg: 'rgba(245,158,11,.15)', color: '#f59e0b',  label: 'Assistant' },
  'Assistante':       { bg: 'rgba(245,158,11,.15)', color: '#f59e0b',  label: 'Assistante' },
  'Employé':          { bg: 'rgba(148,163,184,.15)', color: '#94a3b8', label: 'Employé' },
  // Anciens rôles — compatibilité
  super_admin:        { bg: 'rgba(232,64,12,.15)',  color: '#E8400C',  label: 'Super Admin' },
  admin:              { bg: 'rgba(232,64,12,.15)',  color: '#E8400C',  label: 'Admin' },
  Administrateur:     { bg: 'rgba(232,64,12,.15)',  color: '#E8400C',  label: 'Admin' },
  directeur:          { bg: 'rgba(99,102,241,.15)', color: '#6366f1',  label: 'Directeur' },
  manager:            { bg: 'rgba(16,185,129,.15)', color: '#10b981',  label: 'Manager' },
  assistante:         { bg: 'rgba(245,158,11,.15)', color: '#f59e0b',  label: 'Assistante' },
  employe:            { bg: 'rgba(148,163,184,.15)', color: '#94a3b8', label: 'Employé' },
};

function getRoleBadge(role) {
  return ROLE_COLORS[role] || { bg: 'rgba(148,163,184,.15)', color: '#94a3b8', label: role || 'Utilisateur' };
}

/* ─────────────────────────────────────────────────────────
   ICÔNES SVG
   ───────────────────────────────────────────────────────── */
const ICONS = {
  '/': (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.35"/>
      <rect x="8" y="1" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.35"/>
      <rect x="1" y="8" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.35"/>
      <rect x="8" y="8" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.35"/>
    </svg>
  ),
  'planning-group': (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.35"/>
      <line x1="1" y1="5.5" x2="13" y2="5.5" stroke="currentColor" strokeWidth="1.35"/>
      <line x1="4.5" y1="0.5" x2="4.5" y2="3.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/>
      <line x1="9.5" y1="0.5" x2="9.5" y2="3.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/>
    </svg>
  ),
  '/agenda': (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.35"/>
      <line x1="1" y1="5.5" x2="13" y2="5.5" stroke="currentColor" strokeWidth="1.35"/>
      <line x1="4.5" y1="0.5" x2="4.5" y2="3.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/>
      <line x1="9.5" y1="0.5" x2="9.5" y2="3.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/>
      <circle cx="4.5" cy="8.5" r=".9" fill="currentColor"/>
      <circle cx="7" cy="8.5" r=".9" fill="currentColor"/>
      <circle cx="9.5" cy="8.5" r=".9" fill="currentColor"/>
    </svg>
  ),
  '/meetings': (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <circle cx="4.5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.35"/>
      <circle cx="9.5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.35"/>
      <path d="M1 12c0-2 1.6-3.5 3.5-3.5S8 10 8 12" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/>
      <path d="M9 8.5c1.9 0 3.5 1.6 3.5 3.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/>
    </svg>
  ),
  '/appointments': (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.35"/>
      <polyline points="7,3.5 7,7 9.5,9" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  '/workshops': (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.35"/>
      <path d="M4.5 4V2.5a2.5 2.5 0 015 0V4" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/>
      <line x1="1" y1="7.5" x2="13" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="7" y1="6.5" x2="7" y2="8.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/>
    </svg>
  ),
  '/events': (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.35"/>
      <polygon points="5.5,4.5 10.5,7 5.5,9.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  '/tasks': (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.35"/>
      <polyline points="3,6.5 5,8.5 7.5,5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="9" y1="5.5" x2="11.5" y2="5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="9" y1="8" x2="11.5" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="3" y1="10.5" x2="11.5" y2="10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  '/documents': (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 1h7l3 3v9a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round"/>
      <polyline points="9,1 9,4 12,4" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round"/>
      <line x1="3.5" y1="7.5" x2="10.5" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="3.5" y1="10" x2="8" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  '/notifications': (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1a4 4 0 00-4 4v3L2 9.5h10L11 8V5a4 4 0 00-4-4z" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round"/>
      <path d="M5.5 11a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.35"/>
    </svg>
  ),
  '/settings': (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.35"/>
      <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.93 2.93l1.06 1.06M10.01 10.01l1.06 1.06M2.93 11.07l1.06-1.06M10.01 3.99l1.06-1.06" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/>
    </svg>
  ),
  '/agenda-directeur': (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="5" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.35"/>
      <path d="M4.5 5V3.5a2.5 2.5 0 015 0V5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/>
      <circle cx="7" cy="9" r="1.2" fill="currentColor"/>
    </svg>
  ),
  profile: (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M1.5 13c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  theme: (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  logout: (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M5 1.5H2.5a1 1 0 00-1 1v9a1 1 0 001 1H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <polyline points="8.5,4 11.5,7 8.5,10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="11.5" y1="7" x2="5" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
};

/* ─────────────────────────────────────────────────────────
   HOOK — nb notifs non lues
   ───────────────────────────────────────────────────────── */
function useUnreadCount() {
  try {
    const { notifications } = require('../../data/mockData');
    return notifications.filter(n => !n.read).length;
  } catch { return 0; }
}

/* ─────────────────────────────────────────────────────────
   Tooltip (mode collapsed)
   ───────────────────────────────────────────────────────── */
function Tooltip({ label, show }) {
  if (!show) return null;
  return <div className="sb-tooltip">{label}</div>;
}

/* ─────────────────────────────────────────────────────────
   NavItem
   ───────────────────────────────────────────────────────── */
function NavItem({ path, label, end, isCollapsed, onNavigate, badge }) {
  const location      = useLocation();
  const unread        = useUnreadCount();
  const [hov, setHov] = useState(false);

  const isActive  = end ? location.pathname === path : location.pathname.startsWith(path);
  const showBadge = badge && unread > 0;

  return (
    <NavLink to={path} end={end} style={{ textDecoration: 'none', display: 'block' }} onClick={onNavigate}>
      <div
        className={`sb-item${isActive ? ' active' : ''}`}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
        }}
      >
        {isActive && !isCollapsed && <span className="sb-accent-bar" />}
        <span style={{ display: 'flex', flexShrink: 0, color: 'inherit', position: 'relative' }}>
          {ICONS[path] || ICONS['/']}
          {showBadge && isCollapsed && (
            <span style={{
              position: 'absolute', top: -3, right: -3,
              width: 7, height: 7, borderRadius: '50%',
              background: '#E8400C',
              border: '1.5px solid var(--color-background-secondary)',
            }} />
          )}
        </span>
        {!isCollapsed && (
          <>
            <span style={{ flex: 1, fontSize: 13, fontWeight: isActive ? 500 : 400, letterSpacing: '-.01em', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {label}
            </span>
            {showBadge && (
              <span style={{
                minWidth: 18, height: 16, padding: '0 5px',
                background: '#E8400C', color: '#fff',
                fontSize: 9.5, fontWeight: 700, borderRadius: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </>
        )}
        {isCollapsed && <Tooltip label={label} show={hov} />}
      </div>
    </NavLink>
  );
}

/* ─────────────────────────────────────────────────────────
   SubNavItem
   ───────────────────────────────────────────────────────── */
function SubNavItem({ path, label, onNavigate }) {
  const location = useLocation();
  const isActive = location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <NavLink to={path} style={{ textDecoration: 'none', display: 'block' }} onClick={onNavigate}>
      <div
        className={`sb-sub${isActive ? ' active' : ''}`}
        style={{ color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}
      >
        <span style={{ position: 'absolute', left: 17, top: 0, bottom: 0, width: 1, background: 'var(--color-border)' }} />
        <span style={{
          position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
          width: 5, height: 5, borderRadius: '50%',
          background: isActive ? '#E8400C' : 'var(--color-border-medium)',
          transition: 'background 120ms ease', flexShrink: 0,
        }} />
        <span style={{ display: 'flex', flexShrink: 0, color: 'inherit' }}>{ICONS[path]}</span>
        <span style={{ fontSize: 12.5, fontWeight: isActive ? 500 : 400, letterSpacing: '-.01em', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {label}
        </span>
      </div>
    </NavLink>
  );
}

/* ─────────────────────────────────────────────────────────
   PlanningGroupItem
   ───────────────────────────────────────────────────────── */
function PlanningGroupItem({ item, isCollapsed, onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();
  const ref      = useRef(null);

  const childPaths    = (item.subItems || []).map(s => s.path);
  const isChildActive = childPaths.some(cp => location.pathname === cp || location.pathname.startsWith(cp + '/'));

  const [open,      setOpen]      = useState(isChildActive);
  const [hov,       setHov]       = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => { if (isChildActive) setOpen(true); }, [isChildActive]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        className={`sb-item${isChildActive ? ' active' : ''}`}
        onMouseEnter={() => { setHov(true); if (isCollapsed) setShowPopup(true); }}
        onMouseLeave={() => { setHov(false); if (isCollapsed) setShowPopup(false); }}
        onClick={() => { if (isCollapsed) setShowPopup(p => !p); else setOpen(o => !o); }}
        style={{
          color: isChildActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
        }}
      >
        {isChildActive && !isCollapsed && <span className="sb-accent-bar" />}
        <span style={{ display: 'flex', flexShrink: 0, color: 'inherit' }}>{ICONS['planning-group']}</span>
        {!isCollapsed && (
          <>
            <span style={{ flex: 1, fontSize: 13, fontWeight: isChildActive ? 500 : 400, letterSpacing: '-.01em', whiteSpace: 'nowrap' }}>
              {item.label}
            </span>
            <svg className={`sb-chevron${open ? ' open' : ''}`} width="10" height="10" viewBox="0 0 10 10" fill="none">
              <polyline points="3,2 7,5 3,8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </>
        )}
        {isCollapsed && <Tooltip label={item.label} show={hov && !showPopup} />}
      </div>

      {isCollapsed && showPopup && (
        <div className="sb-popup" onMouseEnter={() => setShowPopup(true)} onMouseLeave={() => setShowPopup(false)}>
          <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--color-text-muted)', padding: '2px 8px 6px' }}>
            {item.label}
          </p>
          {(item.subItems || []).map(sub => {
            const isActive = location.pathname === sub.path || location.pathname.startsWith(sub.path + '/');
            return (
              <div
                key={sub.path}
                onClick={() => { navigate(sub.path); onNavigate(); setShowPopup(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 9px', borderRadius: 7, cursor: 'pointer',
                  background: isActive ? 'var(--color-background-elevated)' : 'transparent',
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  fontSize: 12.5, fontWeight: isActive ? 500 : 400,
                  transition: 'background .1s', position: 'relative',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-background-tertiary)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                {isActive && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 2.5, height: 14, background: '#E8400C', borderRadius: 2 }} />}
                <span style={{ display: 'flex', flexShrink: 0 }}>{ICONS[sub.path]}</span>
                {sub.label}
              </div>
            );
          })}
        </div>
      )}

      {!isCollapsed && open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 1, marginBottom: 2, animation: 'sb-open .18s ease both' }}>
          {(item.subItems || []).map(sub => (
            <SubNavItem key={sub.path} path={sub.path} label={sub.label} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   NavGroupLabel
   ───────────────────────────────────────────────────────── */
function NavGroupLabel({ label }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '.11em',
      textTransform: 'uppercase', color: 'var(--color-text-disabled)',
      padding: '10px 9px 3px', whiteSpace: 'nowrap', overflow: 'hidden',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <span>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--color-border)', opacity: .6 }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   UserMenu
   ───────────────────────────────────────────────────────── */
function UserMenu({ user, onLogout, onClose }) {
  const badge = getRoleBadge(user?.roleRaw || user?.role || '');
  return (
    <div className="sb-user-menu">
      <div style={{ padding: '11px 13px 9px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #E8400C 0%, #FF6B35 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff',
          }}>
            {user?.initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {user?.name}
            </p>
            <span className="sb-role-badge" style={{ background: badge.bg, color: badge.color, marginTop: 3 }}>
              {badge.label}
            </span>
          </div>
        </div>
      </div>
      <div style={{ padding: '4px' }}>
        <button className="sb-user-menu-item" onClick={onClose}>
          <span style={{ color: 'var(--color-text-muted)' }}>{ICONS.profile}</span>
          Mon profil
        </button>
        <button className="sb-user-menu-item" onClick={onClose}>
          <span style={{ color: 'var(--color-text-muted)' }}>{ICONS.theme}</span>
          Préférences
        </button>
        <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />
        <button className="sb-user-menu-item danger" onClick={onLogout}>
          <span>{ICONS.logout}</span>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SIDEBAR PRINCIPALE
   ───────────────────────────────────────────────────────── */
export default function Sidebar() {
  const { user, logout }                                                = useAuth();
  const navigate                                                        = useNavigate();
  const { collapsed, mobileOpen, toggle, closeMobileDrawer, isMobile } = useSidebar();
  const perms                                                           = usePermissions();

  const isCollapsed  = isMobile ? false : collapsed;
  const sidebarWidth = isMobile ? 240 : (collapsed ? 58 : 220);
  const groups       = buildNavGroups(perms);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef                     = useRef(null);
  const badge                           = getRoleBadge(user?.roleRaw || user?.role || '');

  // ── Fermer le menu user au clic extérieur ──
  useEffect(() => {
    if (!showUserMenu) return;
    function handleClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showUserMenu]);

  // ── Logout ──
  function handleLogout() {
    setShowUserMenu(false);
    closeMobileDrawer();
    logout().finally(() => {
      window.location.href = '/login';
    });
  }

  function handleNavigate() {
    if (isMobile) closeMobileDrawer();
  }

  return (
    <>
      {isMobile && mobileOpen && (
        <div
          onClick={closeMobileDrawer}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 199, backdropFilter: 'blur(2px)' }}
        />
      )}

      <aside style={{
        position: 'fixed', left: 0, top: 0,
        width: sidebarWidth, height: '100vh',
        background: 'var(--color-background-secondary)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column',
        zIndex: 200, overflow: 'hidden',
        transition: isMobile
          ? 'transform 260ms cubic-bezier(.4,0,.2,1)'
          : 'width 260ms cubic-bezier(.4,0,.2,1)',
        transform: isMobile ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
      }}>

        {/* Logo + Toggle */}
        <div style={{
          height: 48, display: 'flex', alignItems: 'center',
          padding: isCollapsed ? '0 10px' : '0 10px 0 12px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0, gap: 6,
        }}>
          <div
            onClick={isCollapsed ? toggle : () => { navigate('/'); handleNavigate(); }}
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1, overflow: 'hidden', minWidth: 0 }}
          >
            {isCollapsed
              ? <XamioLogo variant="mark" height={22} />
              : <XamioLogo variant="full" height={20} />
            }
          </div>
          {!isCollapsed && (
            <button className="sb-toggle" onClick={isMobile ? closeMobileDrawer : toggle} title="Réduire">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <line x1="2" y1="3.5" x2="11" y2="3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <line x1="2" y1="6.5" x2="8" y2="6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <line x1="2" y1="9.5" x2="11" y2="9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '6px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {groups.map((group, gi) => (
            <div key={gi} style={{ marginBottom: group.label ? 2 : 0 }}>
              {group.label && !isCollapsed && <NavGroupLabel label={group.label} />}
              {group.label && isCollapsed && gi > 0 && <div className="sb-group-sep" />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {group.items.map(item =>
                  item.subItems ? (
                    <PlanningGroupItem key={item.label} item={item} isCollapsed={isCollapsed} onNavigate={handleNavigate} />
                  ) : (
                    <NavItem key={item.path} path={item.path} label={item.label} end={item.end} isCollapsed={isCollapsed} onNavigate={handleNavigate} badge={item.badge} />
                  )
                )}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer utilisateur */}
        <div ref={userMenuRef} style={{ borderTop: '1px solid var(--color-border)', padding: '7px 6px', flexShrink: 0, position: 'relative' }}>
          {showUserMenu && (
            <UserMenu
              user={user}
              onLogout={handleLogout}
              onClose={() => setShowUserMenu(false)}
            />
          )}

          {!isCollapsed ? (
            <button className="sb-avatar-btn" onClick={() => setShowUserMenu(v => !v)}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #E8400C 0%, #FF6B35 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9.5, fontWeight: 700, color: '#fff',
                boxShadow: '0 0 0 2px var(--color-background-secondary), 0 0 0 3px rgba(232,64,12,.25)',
              }}>
                {user?.initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
                  {user?.name}
                </p>
                <span className="sb-role-badge" style={{ background: badge.bg, color: badge.color }}>
                  {badge.label}
                </span>
              </div>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, color: 'var(--color-text-disabled)', transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s' }}>
                <polyline points="2,3.5 5,6.5 8,3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
              <div
                title={user?.name}
                onClick={() => setShowUserMenu(v => !v)}
                style={{
                  width: 26, height: 26, borderRadius: '50%', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #E8400C 0%, #FF6B35 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9.5, fontWeight: 700, color: '#fff',
                  boxShadow: '0 0 0 2px var(--color-background-secondary), 0 0 0 3px rgba(232,64,12,.25)',
                }}
              >
                {user?.initials}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}