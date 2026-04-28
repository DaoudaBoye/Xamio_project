import React from 'react';

/**
 * VisibilitySelector — Sélecteur de visibilité réutilisable
 * Utilise uniquement les variables CSS existantes du projet.
 *
 * Props:
 *   value    : 'all' | 'direction'
 *   onChange : (value) => void
 *   fixed    : bool — si true, affiche juste le badge "PRIVÉ" sans interaction
 */

const OPTIONS = [
  {
    value: 'all',
    icon: '👥',
    label: 'Tous les membres',
    desc: "Visible par tous les membres de l'équipe",
    color: 'var(--color-accent)',
    colorBg: 'var(--color-accent-bg)',
    colorBorder: 'var(--color-accent-border)',
  },
  {
    value: 'direction',
    icon: '🔒',
    label: 'Directeur & Assistant',
    desc: 'Visible uniquement par le Directeur et son Assistant',
    color: 'var(--color-purple)',
    colorBg: 'var(--color-purple-bg)',
    colorBorder: 'var(--color-purple-border)',
  },
];

export default function VisibilitySelector({ value, onChange, fixed = false }) {
  if (fixed) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderRadius: 10,
        background: 'var(--color-purple-bg)',
        border: '1px solid var(--color-purple-border)',
      }}>
        <span style={{ fontSize: 16 }}>🔒</span>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-purple)', marginBottom: 1, letterSpacing: '.04em' }}>
            VISIBILITÉ : PRIVÉ
          </p>
          <p style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
            Visible uniquement par le Directeur et son Assistant
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {OPTIONS.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(opt.value); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 10,
              border: `1.5px solid ${active ? opt.colorBorder : 'var(--color-border)'}`,
              background: active ? opt.colorBg : 'var(--color-background-elevated)',
              cursor: 'pointer', textAlign: 'left',
              fontFamily: 'var(--font-sans)',
              transition: 'border-color 0.15s, background 0.15s',
              outline: 'none',
              width: '100%',
            }}
          >
            {/* Icône */}
            <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{opt.icon}</span>

            {/* Texte */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 13, fontWeight: 600, marginBottom: 2,
                color: active ? opt.color : 'var(--color-text-primary)',
              }}>
                {opt.label}
              </p>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                {opt.desc}
              </p>
            </div>

            {/* Indicateur coché */}
            <span style={{
              flexShrink: 0,
              width: 20, height: 20, borderRadius: '50%',
              border: `2px solid ${active ? opt.color : 'var(--color-border-strong)'}`,
              background: active ? opt.color : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}>
              {active && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
