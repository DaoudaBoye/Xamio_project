/**
 * Composants UI réutilisables de XAMIO
 * Chaque composant est simple, lisible et bien commenté.
 */

import React, { useState, useEffect } from 'react';
import { STATUS_COLORS } from '../../styles/colors';

/* ==========================================================================
   Badge — Étiquette colorée pour les statuts et catégories
   Utilisation : <Badge label="À venir" color="blue" />
   ========================================================================== */
export function Badge({ label, color = 'neutral', withDot = false }) {
  const style = STATUS_COLORS[color] || STATUS_COLORS.neutral;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '2px 8px',
      borderRadius: 'var(--radius-small)',
      border: `1px solid ${style.borderColor}`,
      background: style.background,
      color: style.color,
      fontSize: 11,
      fontWeight: 500,
      whiteSpace: 'nowrap',
      lineHeight: '18px',
    }}>
      {withDot && (
        <span style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: style.color,
          flexShrink: 0,
        }} />
      )}
      {label}
    </span>
  );
}

/* ==========================================================================
   Button — Bouton d'action principal
   Variantes : "primary" | "default" | "ghost" | "danger"
   Tailles : "sm" | "md" | "lg"
   ========================================================================== */
export function Button({
  children,
  variant = 'default',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  style,
}) {
  const variantStyles = {
    primary: {
      background: 'var(--color-accent)',
      color: '#ffffff',
      border: '1px solid var(--color-accent-dark)',
    },
    default: {
      background: 'var(--color-background-elevated)',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border-medium)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--color-text-secondary)',
      border: '1px solid transparent',
    },
    danger: {
      background: 'var(--color-danger-bg)',
      color: 'var(--color-danger)',
      border: '1px solid var(--color-danger-border)',
    },
    secondary: {
      background: 'var(--color-background-elevated)',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border-medium)',
    },
  };

  const sizeStyles = {
    sm: { height: 26, padding: '0 10px', fontSize: 11 },
    md: { height: 30, padding: '0 12px', fontSize: 12 },
    lg: { height: 36, padding: '0 16px', fontSize: 13 },
  };

  const currentVariant = variantStyles[variant] || variantStyles.default;
  const currentSize    = sizeStyles[size] || sizeStyles.md;
  const isDisabled     = disabled || loading;

  function handleMouseEnter(e) {
    if (!isDisabled) e.currentTarget.style.filter = 'brightness(1.1)';
  }
  function handleMouseLeave(e) {
    e.currentTarget.style.filter = '';
  }

  return (
    <button
      onClick={!isDisabled ? onClick : undefined}
      disabled={isDisabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: currentSize.height,
        padding: currentSize.padding,
        fontSize: currentSize.fontSize,
        borderRadius: 'var(--radius-medium)',
        fontWeight: 500,
        fontFamily: 'var(--font-sans)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: disabled && !loading ? 0.45 : 1,
        transition: 'all var(--transition-fast)',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        ...currentVariant,
        ...style,
      }}
    >
      {loading && (
        <span style={{
          width: 11, height: 11,
          border: '1.5px solid currentColor',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite',
          display: 'inline-block',
          flexShrink: 0,
        }} />
      )}
      {children}
    </button>
  );
}

/* ==========================================================================
   Card — Surface de contenu
   ========================================================================== */
export function Card({ children, onClick, padding = '16px', style }) {
  const [isHovered, setIsHovered] = useState(false);
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => isClickable && setIsHovered(true)}
      onMouseLeave={() => isClickable && setIsHovered(false)}
      style={{
        background: 'var(--color-background-secondary)',
        border: `1px solid ${isHovered ? 'var(--color-border-medium)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-large)',
        padding,
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'border-color var(--transition-fast)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ==========================================================================
   SectionHeader — En-tête de section avec titre et bouton d'action optionnel
   ========================================================================== */
export function SectionHeader({ title, subtitle, action, onAction }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
      gap: 12,
    }}>
      <div>
        <h1 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <Button size="sm" onClick={onAction}>{action}</Button>
      )}
    </div>
  );
}

/* ==========================================================================
   Input — Champ de saisie stylisé
   ========================================================================== */
export function Input({ label, type = 'text', value, onChange, placeholder, error }) {
  const [isFocused, setIsFocused] = useState(false);

  function getBorderColor() {
    if (error)     return 'var(--color-danger-border)';
    if (isFocused) return 'var(--color-border-strong)';
    return 'var(--color-border-medium)';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)' }}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          height: 32,
          background: 'var(--color-background-tertiary)',
          border: `1px solid ${getBorderColor()}`,
          borderRadius: 'var(--radius-medium)',
          padding: '0 10px',
          color: 'var(--color-text-primary)',
          fontSize: 13,
          outline: 'none',
          fontFamily: 'var(--font-sans)',
          width: '100%',
          transition: 'border-color var(--transition-fast)',
          boxSizing: 'border-box',
        }}
      />
      {error && (
        <span style={{ fontSize: 11, color: 'var(--color-danger)' }}>{error}</span>
      )}
    </div>
  );
}

/* ==========================================================================
   Modal — Fenêtre de dialogue superposée
   - Centrée verticalement et horizontalement
   - La page derrière reste scrollable
   ========================================================================== */
export function Modal({
  open,
  onClose,
  title,
  children,
  width = 480,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.60)',
        backdropFilter: 'blur(2px)',
        animation: 'fadeIn 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',         // ← marges réduites
        boxSizing: 'border-box',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-background-tertiary)',
          border: '1px solid var(--color-border-medium)',
          borderRadius: 'var(--radius-xlarge)',
          width: '100%',
          maxWidth: width,
          maxHeight: 'calc(100vh - 24px)', // ← colle moins aux bords
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-modal)',
          animation: 'modalEnter 0.22s ease',
          transformOrigin: 'center center',
          overflow: 'hidden',
        }}
      >
        {/* En-tête fixe */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',            // ← réduit
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}>
          <h3 style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.01em',
            margin: 0,
            flex: 1,
          }}>
            {title}
          </h3>

          <button
            onClick={onClose}
            aria-label="Fermer la modale"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-medium)',
              transition: 'all var(--transition-fast)',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-background-elevated)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-muted)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 2L12 12M12 2L2 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Contenu scrollable */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px 16px 16px',       // ← réduit
        }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalEnter {
          from { opacity: 0; transform: scale(0.97) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </div>
  );
}

/* ==========================================================================
   EmptyState — Affichage quand une liste est vide
   ========================================================================== */
export function EmptyState({ title, description, action, onAction }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '60px 20px', gap: 10, textAlign: 'center',
    }}>
      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>{title}</p>
      {description && (
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', maxWidth: 300, lineHeight: 1.6 }}>
          {description}
        </p>
      )}
      {action && (
        <Button size="sm" style={{ marginTop: 8 }} onClick={onAction}>{action}</Button>
      )}
    </div>
  );
}

/* ==========================================================================
   Avatar — Cercle avec les initiales de l'utilisateur
   ========================================================================== */
export function Avatar({ initials, size = 24 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: 'var(--color-background-elevated)',
      border: '1px solid var(--color-border-medium)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.38),
      fontWeight: 500,
      color: 'var(--color-text-secondary)',
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

/* ==========================================================================
   SearchBar — Barre de recherche avec icône loupe
   ========================================================================== */
export function SearchBar({ value, onChange, placeholder = 'Rechercher…' }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <svg
        width="12" height="12" viewBox="0 0 12 12" fill="none"
        style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
      >
        <circle cx="5" cy="5" r="3.5" stroke="var(--color-text-muted)" strokeWidth="1.2" />
        <line x1="7.8" y1="7.8" x2="11" y2="11" stroke="var(--color-text-muted)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: '100%', height: 30,
          background: 'var(--color-background-tertiary)',
          border: `1px solid ${isFocused ? 'var(--color-border-strong)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-medium)',
          padding: '0 10px 0 28px',
          color: 'var(--color-text-primary)',
          fontSize: 12,
          outline: 'none',
          fontFamily: 'var(--font-sans)',
          transition: 'border-color var(--transition-fast)',
        }}
      />
    </div>
  );
}

/* ==========================================================================
   Tag — Étiquette neutre pour les catégories
   ========================================================================== */
export function Tag({ label }) {
  return <Badge label={label} color="neutral" />;
}