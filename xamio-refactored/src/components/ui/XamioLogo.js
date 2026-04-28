import React from 'react';

/**
 * XamioLogo — renders the real XAMIO brand mark inline.
 *
 * Props:
 *   variant  "full"   → X mark + "XAMIO" wordmark (default)
 *            "mark"   → X mark only
 *            "word"   → wordmark only
 *   height   number in px (default: 32)
 *   mono     bool — if true, renders in monochrome ochre (for light/inverted contexts)
 */
export default function XamioLogo({ variant = 'full', height = 32, mono = false }) {

  /* ── X mark ──────────────────────────────────────────────────────────── */
  const Mark = ({ h = 32 }) => {
    const w = h; // square
    const scale = h / 144;
    const cx = 72 * scale;
    const cy = 72 * scale;

    if (mono) {
      return (
        <svg width={w} height={h} viewBox="0 0 144 144" fill="none" style={{ flexShrink: 0 }}>
          <polygon points="0,0 28,0 72,72 44,72"    fill="var(--ochre)" opacity=".9"/>
          <polygon points="0,144 28,144 72,72 44,72" fill="var(--ochre)" opacity=".7"/>
          <polygon points="144,0 116,0 72,72 100,72"    fill="var(--ochre)"/>
          <polygon points="144,144 116,144 72,72 100,72" fill="var(--ochre)" opacity=".75"/>
        </svg>
      );
    }

    return (
      <svg width={w} height={h} viewBox="0 0 144 144" fill="none" style={{ flexShrink: 0 }}>
        <defs>
          <linearGradient id={`lg-blue-${h}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4FA3F7"/>
            <stop offset="100%" stopColor="#1255CC"/>
          </linearGradient>
          <linearGradient id={`lg-orange-${h}`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF6A00"/>
            <stop offset="100%" stopColor="#FFB300"/>
          </linearGradient>
        </defs>
        {/* Blue arms */}
        <polygon points="0,0 28,0 72,72 44,72"     fill={`url(#lg-blue-${h})`}/>
        <polygon points="0,144 28,144 72,72 44,72"  fill={`url(#lg-blue-${h})`} opacity="0.85"/>
        {/* Orange arms */}
        <polygon points="144,0 116,0 72,72 100,72"     fill={`url(#lg-orange-${h})`}/>
        <polygon points="144,144 116,144 72,72 100,72"  fill={`url(#lg-orange-${h})`} opacity="0.85"/>
        {/* Centre glint */}
        <polygon points="72,58 85,72 72,86 59,72" fill="white" fillOpacity="0.12"/>
      </svg>
    );
  };

  /* ── Wordmark ─────────────────────────────────────────────────────────── */
  const Word = ({ h = 32 }) => {
    const fontSize = h * 0.72;
    return (
      <span style={{
        fontFamily: "'Syne', 'Trebuchet MS', 'Arial Black', sans-serif",
        fontWeight: 800,
        fontSize,
        letterSpacing: '-0.02em',
        color: mono ? 'var(--ochre)' : 'var(--text-1)',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}>
        XAMIO
      </span>
    );
  };

  /* ── Compose ──────────────────────────────────────────────────────────── */
  if (variant === 'mark') return <Mark h={height} />;
  if (variant === 'word') return <Word h={height} />;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(height * 0.3), flexShrink: 0 }}>
      <Mark h={height} />
      <Word h={height} />
    </div>
  );
}
