import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const NotifContext = createContext(null);

export function NotifProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const addToast = useCallback((message, type = 'success', duration = 3200) => {
    const id = ++counter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const dismiss = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  return (
    <NotifContext.Provider value={{ addToast }}>
      {children}
      <Toasts toasts={toasts} onDismiss={dismiss} />
    </NotifContext.Provider>
  );
}

export function useNotif() {
  const ctx = useContext(NotifContext);
  if (!ctx) throw new Error('useNotif must be inside NotifProvider');
  return ctx;
}

const TYPE = {
  success: { accent: 'var(--color-success)',        bg: 'var(--color-success-bg)',        border: 'var(--color-success-border)'  },
  error:   { accent: 'var(--color-danger)',          bg: 'var(--color-danger-bg)',          border: 'var(--color-danger-border)'   },
  info:    { accent: 'var(--color-accent)',          bg: 'var(--color-accent-bg)',          border: 'var(--color-accent-border)'   },
  warning: { accent: 'var(--color-warning)',         bg: 'var(--color-warning-bg)',         border: 'var(--color-warning-border)'  },
};

const ICONS = {
  success: (c) => <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5.5" stroke={c} strokeWidth="1.2"/><polyline points="3,6 5,8.2 9,4" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  error:   (c) => <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5.5" stroke={c} strokeWidth="1.2"/><path d="M4 4l4 4M8 4l-4 4" stroke={c} strokeWidth="1.4" strokeLinecap="round"/></svg>,
  warning: (c) => <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M6 1.5L11 10.5H1L6 1.5z" stroke={c} strokeWidth="1.2" strokeLinejoin="round"/><path d="M6 5v2.5M6 9h.01" stroke={c} strokeWidth="1.3" strokeLinecap="round"/></svg>,
  info:    (c) => <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5.5" stroke={c} strokeWidth="1.2"/><path d="M6 5.5v3M6 3.5h.01" stroke={c} strokeWidth="1.3" strokeLinecap="round"/></svg>,
};

function Toasts({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(10px) scale(.97); }
          to   { opacity: 1; transform: translateY(0)     scale(1);   }
        }
      `}</style>
      <div style={{
        position: 'fixed', bottom: 28, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', gap: 8,
        zIndex: 9999, pointerEvents: 'none', alignItems: 'center',
      }}>
        {toasts.map((t) => {
          const s = TYPE[t.type] || TYPE.info;
          return (
            <div
              key={t.id}
              onClick={() => onDismiss(t.id)}
              style={{
                pointerEvents: 'all',
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 14px',
                minWidth: 260, maxWidth: 400,
                borderRadius: 10,
                cursor: 'pointer',
                // ← fond opaque tiré du thème, pas du blanc fixe
                background: 'var(--color-background-elevated)',
                border: `1px solid ${s.border}`,
                boxShadow: 'var(--shadow-dropdown)',
                animation: 'toastIn .22s ease both',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Barre latérale colorée */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: 3, background: s.accent, borderRadius: '10px 0 0 10px',
              }} />

              {/* Fond teinté derrière l'icône */}
              <div style={{
                flexShrink: 0, width: 26, height: 26, borderRadius: 6,
                background: s.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {ICONS[t.type]?.(s.accent)}
              </div>

              {/* Message */}
              <span style={{
                fontSize: 13, color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-sans)', flex: 1, lineHeight: 1.45,
              }}>
                {t.message}
              </span>

              {/* Bouton fermer */}
              <button onClick={(e) => { e.stopPropagation(); onDismiss(t.id); }}
                style={{
                  flexShrink: 0, background: 'none', border: 'none',
                  color: 'var(--color-text-muted)', cursor: 'pointer',
                  fontSize: 15, lineHeight: 1, padding: '0 2px',
                }}>
                ×
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}