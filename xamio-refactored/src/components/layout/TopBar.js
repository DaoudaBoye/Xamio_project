import React, { useState, useRef, useEffect, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useSidebar } from '../../context/SidebarContext';
import { useMeetings } from '../../context/MeetingsContext';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { notifications as mockNotifications } from '../../data/mockData';

/* ─────────────────────────────────────────────────────────
   CSS INJECTION
   ───────────────────────────────────────────────────────── */
const TOPBAR_CSS = `
  @keyframes tb-drop {
    from { opacity: 0; transform: translateY(-6px) scale(.98); }
    to   { opacity: 1; transform: translateY(0)    scale(1);   }
  }

  .tb-btn {
    display: flex; align-items: center; justify-content: center;
    background: transparent; border: 1px solid var(--color-border);
    border-radius: 8px; cursor: pointer;
    color: var(--color-text-muted);
    transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
    flex-shrink: 0;
  }
  .tb-btn:hover {
    background: var(--color-background-elevated);
    border-color: var(--color-border-medium);
    color: var(--color-text-primary);
  }
  .tb-btn.active {
    background: var(--color-background-elevated);
    border-color: var(--color-border-medium);
    color: var(--color-text-primary);
  }

  .tb-btn.theme-toggle {
    color: var(--color-text-secondary);
    border-color: var(--color-border-medium);
  }
  .tb-btn.theme-toggle:hover {
    color: var(--color-text-primary);
    background: var(--color-background-elevated);
    border-color: var(--color-border-strong);
  }

  .tb-icon-btn {
    display: flex; align-items: center; justify-content: center;
    background: transparent; border: none; border-radius: 8px; cursor: pointer;
    color: var(--color-text-secondary);
    transition: background 120ms ease, color 120ms ease;
    flex-shrink: 0;
  }
  .tb-icon-btn:hover {
    background: var(--color-background-elevated);
    color: var(--color-text-primary);
  }

  .tb-search-wrap {
    position: relative; display: flex; align-items: center;
  }
  .tb-search {
    height: 30px;
    background: var(--color-background-tertiary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 0 32px 0 28px;
    font-size: 12px;
    color: var(--color-text-primary);
    font-family: var(--font-sans);
    outline: none;
    transition: width 200ms cubic-bezier(.4,0,.2,1), border-color 120ms ease, box-shadow 120ms ease;
    width: 148px;
  }
  .tb-search:focus {
    width: 240px;
    border-color: #E8400C;
    box-shadow: 0 0 0 3px rgba(232,64,12,.10);
  }
  .tb-search::placeholder { color: var(--color-text-disabled); }

  .tb-notif-dot {
    position: absolute; top: 5px; right: 5px;
    width: 6px; height: 6px; border-radius: 50%;
    background: #E8400C;
    border: 1.5px solid var(--color-background-secondary);
  }

  .tb-dropdown {
    position: absolute; right: 0; top: calc(100% + 8px);
    background: var(--color-background-secondary);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,.14);
    overflow: hidden; z-index: 300;
    animation: tb-drop .16s cubic-bezier(.4,0,.2,1) both;
  }

  .tb-notif-row {
    display: flex; gap: 10px; padding: 10px 14px; cursor: pointer;
    transition: background 100ms ease;
    border: none; background: transparent; width: 100%; text-align: left;
    font-family: var(--font-sans);
  }
  .tb-notif-row:hover { background: var(--color-background-tertiary); }

  .tb-breadcrumb-btn {
    background: none; border: none; cursor: pointer;
    color: var(--color-text-muted); font-size: 12px;
    font-family: var(--font-sans); padding: 0;
    transition: color 120ms ease; white-space: nowrap;
  }
  .tb-breadcrumb-btn:hover { color: var(--color-text-primary); }

  .tb-xamio-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 8px 3px 6px;
    background: linear-gradient(135deg, rgba(232,64,12,.12) 0%, rgba(255,107,53,.08) 100%);
    border: 1px solid rgba(232,64,12,.2);
    border-radius: 6px;
    font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
    color: #E8400C;
  }

  .tb-search-result-row {
    width: 100%; display: flex; align-items: center; gap: 10px;
    padding: 8px 12px; background: transparent; border: none;
    cursor: pointer; font-family: var(--font-sans); text-align: left;
    transition: background 100ms ease;
  }
  .tb-search-result-row:hover {
    background: var(--color-background-tertiary);
  }
`;

(function injectTopbarCSS() {
  if (typeof document === 'undefined' || document.getElementById('tb-styles')) return;
  const el = document.createElement('style');
  el.id = 'tb-styles';
  el.textContent = TOPBAR_CSS;
  document.head.appendChild(el);
})();

/* ─────────────────────────────────────────────────────────
   PAGE META — avec permission requise
   ───────────────────────────────────────────────────────── */
const PAGE_META = {
  '/':                  { title: 'Tableau de bord', icon: '⬛', permission: null },
  '/agenda':            { title: 'Calendrier',       icon: '📅', permission: null },
  '/agenda-directeur':  { title: 'Agenda Directeur', icon: '🔒', permission: 'voitAgendaDirecteur' },
  '/meetings':          { title: 'Réunions',         icon: '👥', permission: null },
  '/events':            { title: 'Événements',       icon: '▶',  permission: 'voitEvenements' },
  '/tasks':             { title: 'Tâches',            icon: '✅', permission: null },
  '/appointments':      { title: 'Rendez-vous',      icon: '🕐', permission: 'peutGererRDV' },
  '/workshops':         { title: 'Ateliers',          icon: '🎒', permission: 'peutGererAteliers' },
  '/documents':         { title: 'Documents',         icon: '📄', permission: null },
  '/notifications':     { title: 'Notifications',     icon: '🔔', permission: null },
  '/settings':          { title: 'Paramètres',        icon: '⚙️', permission: 'voitParametres' },
};

/* ─────────────────────────────────────────────────────────
   ICÔNES SVG
   ───────────────────────────────────────────────────────── */
const IcoSearch = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.25"/>
    <line x1="7.8" y1="7.8" x2="11" y2="11" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
  </svg>
);

const IcoMenu = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <line x1="2" y1="4"   x2="13" y2="4"   stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="2" y1="7.5" x2="10" y2="7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="2" y1="11"  x2="13" y2="11"  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const IcoSun = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="8" cy="8" r="3"/>
    <line x1="8"    y1="1"    x2="8"    y2="3"/>
    <line x1="8"    y1="13"   x2="8"    y2="15"/>
    <line x1="1"    y1="8"    x2="3"    y2="8"/>
    <line x1="13"   y1="8"    x2="15"   y2="8"/>
    <line x1="2.93" y1="2.93" x2="4.34" y2="4.34"/>
    <line x1="11.66" y1="11.66" x2="13.07" y2="13.07"/>
    <line x1="2.93" y1="13.07" x2="4.34" y2="11.66"/>
    <line x1="11.66" y1="4.34" x2="13.07" y2="2.93"/>
  </svg>
);

const IcoMoon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M13.5 10A6 6 0 015.5 2a6 6 0 100 12 6 6 0 008-4z"
      stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

const IcoBell = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M6.5 1a4 4 0 00-4 4v3L1 9.5h11L10.5 8V5a4 4 0 00-4-4z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
    <path d="M5 11a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.25"/>
  </svg>
);

const IcoChevron = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M3 1.5l3.5 3.5L3 8.5" stroke="var(--color-text-disabled)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ─────────────────────────────────────────────────────────
   NOTIFICATION DROPDOWN
   ───────────────────────────────────────────────────────── */
const NotifDropdown = memo(({ onClose, isMobile }) => {
  const navigate = useNavigate();
  const unread   = mockNotifications.filter(n => !n.read).length;

  return (
    <div className="tb-dropdown" style={{ width: isMobile ? 'calc(100vw - 24px)' : 300, maxWidth: 320 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 14px 9px',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Notifications
          </span>
          {unread > 0 && (
            <span style={{
              padding: '1px 7px', borderRadius: 20,
              background: 'rgba(232,64,12,.12)', color: '#E8400C',
              fontSize: 10, fontWeight: 700,
            }}>
              {unread} non lues
            </span>
          )}
        </div>
        <button
          onClick={() => { onClose(); navigate('/notifications'); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-sans)', padding: 0, transition: 'color 120ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#E8400C')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
        >
          Tout voir →
        </button>
      </div>

      {mockNotifications.slice(0, 5).map((notif, i) => (
        <button
          key={notif.id}
          className="tb-notif-row"
          onClick={() => { onClose(); navigate('/notifications'); }}
          style={{ borderBottom: i < 4 ? '1px solid var(--color-border)' : 'none' }}
        >
          <div style={{
            width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 5,
            background: notif.read ? 'var(--color-border-medium)' : '#E8400C',
          }} />
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <p style={{
              fontSize: 12, lineHeight: 1.45,
              color: notif.read ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
              fontWeight: notif.read ? 400 : 500,
              overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            }}>
              {notif.text}
            </p>
            <p style={{ fontSize: 10.5, color: 'var(--color-text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
              {notif.time}
            </p>
          </div>
        </button>
      ))}

      <div style={{ padding: '8px 14px', borderTop: '1px solid var(--color-border)', background: 'var(--color-background-tertiary)' }}>
        <p style={{ fontSize: 10.5, color: 'var(--color-text-muted)', textAlign: 'center' }}>
          {mockNotifications.length} notification{mockNotifications.length > 1 ? 's' : ''} au total
        </p>
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────────────────────
   TOPBAR
   ───────────────────────────────────────────────────────── */
export default function TopBar() {
  const { pathname }            = useLocation();
  const navigate                = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { toggle, isMobile }    = useSidebar();
  const { user }                = useAuth();
  const perms                   = usePermissions();
  const { meetings }            = useMeetings();

  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults,   setShowResults]   = useState(false);
  const [notifOpen,     setNotifOpen]     = useState(false);

  const notifRef  = useRef(null);
  const searchRef = useRef(null);

  const unreadCount  = mockNotifications.filter(n => !n.read).length;
  const isDetailPage = pathname.startsWith('/meetings/');
  const meta         = PAGE_META[pathname] || { title: 'XAMIO', icon: '' };

  /* Fermer notifications au clic extérieur */
  useEffect(() => {
    if (!notifOpen) return;
    function handler(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  /* Fermer résultats au clic extérieur */
  useEffect(() => {
    function handler(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ⌘K focus search */
  useEffect(() => {
    function handler(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('tb-search')?.focus();
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  /* ── Logique de recherche filtrée par permissions ── */
  const handleSearch = (q) => {
    setSearchQuery(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const term      = q.toLowerCase();
    const orgId     = user?.companyId ?? user?.org_id ?? null;
    const isAdmin   = perms.isAdmin || perms.isDirecteur || perms.isAssistant;
    const isManager = perms.isManager;

    // ── Réunions — filtrées selon le rôle ──────────────────
    const meetingResults = meetings
      .filter(m => {
        // Filtre organisation : réunions de la même org uniquement
        // (MeetingsContext ne retourne que les réunions de l'org connectée)

        // Filtre visibilité direction
        if (m.visibility === 'direction' && !isAdmin) return false;

        // Admin/Directeur/Assistant → tout voir
        if (isAdmin) return true;

        // Manager → son département + ses réunions
        if (isManager) {
          const userDeptId = user?.departement_id ?? user?.department_id ?? null;
          return (
            (userDeptId && m.departement_id === userDeptId) ||
            m.organisateur_id === user?.id ||
            m.organizer === user?.name ||
            m.participants?.some(p =>
              (p.email && p.email === user?.email) ||
              (p.id    && p.id    === user?.id)
            )
          );
        }

        // Employé → uniquement ses réunions
        return (
          m.organisateur_id === user?.id ||
          m.organizer === user?.name ||
          m.participants?.some(p =>
            (p.email && p.email === user?.email) ||
            (p.id    && p.id    === user?.id)
          )
        );
      })
      .filter(m => m.title?.toLowerCase().includes(term))
      .slice(0, 4)
      .map(m => ({
        type:  'Réunion',
        label: m.title,
        meta:  m.date ? m.date.split('T')[0].split('-').reverse().join('/') : '',
        path:  `/meetings/${m.id}`,
        icon:  '👥',
      }));

    // ── Pages — filtrées selon les permissions ──────────────
    const pageResults = Object.entries(PAGE_META)
      .filter(([, pageMeta]) => {
        // Vérifier la permission de la page
        if (pageMeta.permission && !perms[pageMeta.permission]) return false;
        return pageMeta.title.toLowerCase().includes(term);
      })
      .map(([path, pageMeta]) => ({
        type:  'Page',
        label: pageMeta.title,
        meta:  '',
        path,
        icon:  pageMeta.icon,
      }));

    setSearchResults([...meetingResults, ...pageResults].slice(0, 7));
    setShowResults(true);
  };

  const handleSelectResult = (path) => {
    navigate(path);
    setSearchQuery('');
    setShowResults(false);
  };

  return (
    <header style={{
      height: 48,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: isMobile ? '0 12px' : '0 20px',
      background: 'var(--color-background-secondary)',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky', top: 0, zIndex: 100,
      flexShrink: 0, gap: 12,
    }}>

      {/* ══ GAUCHE ══ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>

        {isMobile && (
          <button className="tb-icon-btn" onClick={toggle} title="Menu" style={{ width: 32, height: 32 }}>
            <IcoMenu />
          </button>
        )}

        {isDetailPage ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button className="tb-breadcrumb-btn" onClick={() => navigate('/meetings')}>
              Réunions
            </button>
            <IcoChevron />
            <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--color-text-primary)', letterSpacing: '-.01em' }}>
              Détail
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="tb-xamio-badge">
              <span style={{
                width: 14, height: 14, borderRadius: 4,
                background: 'linear-gradient(135deg, #E8400C 0%, #FF6B35 100%)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <rect x=".5" y=".5" width="2.8" height="2.8" rx=".6" fill="white"/>
                  <rect x="4.7" y=".5" width="2.8" height="2.8" rx=".6" fill="white"/>
                  <rect x=".5" y="4.7" width="2.8" height="2.8" rx=".6" fill="white"/>
                  <rect x="4.7" y="4.7" width="2.8" height="2.8" rx=".6" fill="white"/>
                </svg>
              </span>
              {meta.title}
            </div>
          </div>
        )}
      </div>

      {/* ══ DROITE ══ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

        {/* Recherche — desktop uniquement */}
        {!isMobile && (
          <div className="tb-search-wrap" ref={searchRef}>
            <span style={{
              position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
              color: searchFocused ? '#E8400C' : 'var(--color-text-muted)',
              pointerEvents: 'none', transition: 'color 120ms ease',
            }}>
              <IcoSearch />
            </span>
            <input
              id="tb-search"
              className="tb-search"
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              onFocus={() => {
                setSearchFocused(true);
                if (searchResults.length > 0) setShowResults(true);
              }}
              onBlur={() => setSearchFocused(false)}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  setSearchQuery('');
                  setShowResults(false);
                  e.target.blur();
                }
                if (e.key === 'Enter' && searchResults.length > 0) {
                  handleSelectResult(searchResults[0].path);
                  e.target.blur();
                }
              }}
              placeholder="Rechercher…"
              autoComplete="off"
            />
            {!searchFocused && !searchQuery && (
              <span style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                fontSize: 9.5, color: 'var(--color-text-disabled)',
                fontFamily: 'var(--font-mono)', pointerEvents: 'none',
                background: 'var(--color-background-elevated)',
                padding: '1px 5px', borderRadius: 4,
                border: '1px solid var(--color-border)',
              }}>
                ⌘K
              </span>
            )}

            {/* ── Résultats ── */}
            {showResults && searchResults.length > 0 && (
              <div style={{
                position: 'absolute', top: 38, left: 0,
                background: 'var(--color-background-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 10,
                boxShadow: '0 8px 32px rgba(0,0,0,.18)',
                zIndex: 400, overflow: 'hidden',
                animation: 'tb-drop .16s cubic-bezier(.4,0,.2,1)',
                minWidth: 280,
              }}>
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    className="tb-search-result-row"
                    onMouseDown={() => handleSelectResult(r.path)}
                    style={{
                      borderBottom: i < searchResults.length - 1
                        ? '1px solid var(--color-border)'
                        : 'none',
                    }}
                  >
                    <span style={{ fontSize: 13, flexShrink: 0 }}>{r.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        fontSize: 12.5, fontWeight: 500,
                        color: 'var(--color-text-primary)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        display: 'block',
                      }}>
                        {r.label}
                      </span>
                      {r.meta && (
                        <span style={{ fontSize: 10.5, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {r.meta}
                        </span>
                      )}
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                      background: 'var(--color-background-elevated)',
                      color: 'var(--color-text-muted)', flexShrink: 0,
                      border: '1px solid var(--color-border)',
                    }}>
                      {r.type}
                    </span>
                  </button>
                ))}
                <div style={{
                  padding: '6px 12px',
                  borderTop: '1px solid var(--color-border)',
                  background: 'var(--color-background-tertiary)',
                }}>
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                    {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} · Entrée pour ouvrir le premier
                  </span>
                </div>
              </div>
            )}

            {/* Aucun résultat */}
            {showResults && searchResults.length === 0 && searchQuery.length >= 2 && (
              <div style={{
                position: 'absolute', top: 38, left: 0,
                background: 'var(--color-background-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 10, padding: '12px 14px',
                boxShadow: '0 8px 32px rgba(0,0,0,.18)',
                zIndex: 400, minWidth: 220,
                animation: 'tb-drop .16s cubic-bezier(.4,0,.2,1)',
              }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Aucun résultat pour « {searchQuery} »
                </span>
              </div>
            )}
          </div>
        )}

        {/* Toggle thème */}
        <button
          className="tb-btn theme-toggle"
          onClick={toggleTheme}
          title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
          style={{ width: 32, height: 32, color: isDark ? '#FACC15' : '#6366F1' }}
        >
          {isDark ? <IcoSun /> : <IcoMoon />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className={`tb-btn${notifOpen ? ' active' : ''}`}
            onClick={() => setNotifOpen(v => !v)}
            style={{ width: 30, height: 30, position: 'relative' }}
          >
            <IcoBell />
            {unreadCount > 0 && <span className="tb-notif-dot" />}
          </button>

          {notifOpen && (
            <NotifDropdown
              onClose={() => setNotifOpen(false)}
              isMobile={isMobile}
            />
          )}
        </div>
      </div>
    </header>
  );
}