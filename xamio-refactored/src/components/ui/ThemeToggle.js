/**
 * ThemeToggle — Composants pour changer le thème sombre/clair
 */
import React from 'react';
import { useTheme } from '../../context/ThemeContext';

/** Bouton compact avec icône soleil/lune */
export function ThemeToggleButton() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-medium)', cursor: 'pointer', color: 'var(--color-text-muted)', transition: 'all var(--transition-fast)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-background-elevated)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
    >
      {isDark ? '☀' : '🌙'}
    </button>
  );
}

/** Sélecteur Sombre / Clair sous forme de pill */
export function ThemePicker() {
  const { theme, setDark, setLight } = useTheme();
  return (
    <div style={{ display: 'inline-flex', background: 'var(--color-background-elevated)', borderRadius: 'var(--radius-medium)', padding: 2, gap: 1 }}>
      {[{ key: 'dark', label: 'Sombre', action: setDark }, { key: 'light', label: 'Clair', action: setLight }].map(opt => (
        <button key={opt.key} onClick={opt.action}
          style={{ padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: theme === opt.key ? 500 : 400, background: theme === opt.key ? 'var(--color-background-secondary)' : 'transparent', color: theme === opt.key ? 'var(--color-text-primary)' : 'var(--color-text-muted)', transition: 'all var(--transition-fast)', fontFamily: 'var(--font-sans)' }}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default ThemeToggleButton;
