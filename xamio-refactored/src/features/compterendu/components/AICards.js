/**
 * XAMIO — AICards v2 : AISummaryCard · KeyPointsList · ExtractedActions
 */
import React, { useState } from 'react';
import { useCompteRendu } from '../../../context/CompteRenduContext';
import { useNotif } from '../../../context/NotifContext';

const SHIMMER = `@keyframes shimmer{0%,100%{opacity:.35}50%{opacity:.7}}`;
const SPIN    = `@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`;

function Sk({ w = '100%', h = 12, style = {} }) {
  return <div style={{ width: w, height: h, borderRadius: 4, background: 'var(--color-background-elevated)', animation: 'shimmer 1.6s ease-in-out infinite', ...style }} />;
}

/* ══════════════════════════════════════════════════════════════
   AISummaryCard
   ══════════════════════════════════════════════════════════════ */
export function AISummaryCard() {
  const { summary, isAnalyzing, isRegenerating, regenerateSummary } = useCompteRendu();
  const { addToast } = useNotif();
  const loading = isAnalyzing || isRegenerating;

  const handleRegen = () => {
    regenerateSummary();
    addToast('Résumé en cours de régénération…', 'info');
  };

  return (
    <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-accent-border)', borderRadius: 14, overflow: 'hidden', animation: 'fadeSlide 300ms ease' }}>
      {/* Header */}
      <div style={{ padding: '11px 14px', background: 'var(--color-accent-bg)', borderBottom: '1px solid var(--color-accent-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 14 }}>✨</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-accent)', letterSpacing: '.07em' }}>RÉSUMÉ IA</span>
          {loading && (
            <div style={{ display: 'flex', gap: 3 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-accent)', animation: `bounce 1.2s ${i*.2}s ease-in-out infinite` }} />)}
            </div>
          )}
        </div>
        <button onClick={handleRegen} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid var(--color-accent-border)', borderRadius: 6, padding: '3px 9px', color: 'var(--color-accent)', fontSize: 10, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .5 : 1, fontFamily: 'var(--font-sans)', transition: 'opacity 120ms' }}>
          <span style={{ display: 'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>↻</span> Régénérer
        </button>
      </div>
      {/* Body */}
      <div style={{ padding: '14px 16px' }}>
        {!summary ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[100,88,76,91,60].map((w,i) => <Sk key={i} w={`${w}%`} />)}</div>
        ) : (
          <p style={{ fontSize: 12.5, lineHeight: 1.8, color: 'var(--color-text-secondary)', fontStyle: 'italic', margin: 0, animation: 'fadeSlide 300ms ease' }}>
            "{summary}"
          </p>
        )}
      </div>
      <style>{`${SHIMMER} ${SPIN} @keyframes bounce{0%,80%,100%{transform:scale(.55);opacity:.4}40%{transform:scale(1);opacity:1}} @keyframes fadeSlide{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   KeyPointsList
   ══════════════════════════════════════════════════════════════ */
export function KeyPointsList() {
  const { keyPoints, isAnalyzing } = useCompteRendu();
  const [tab, setTab] = useState('decisions');

  const tabs = [
    { id: 'decisions',  icon: '✅', label: 'Décisions' },
    { id: 'highlights', icon: '⭐', label: 'Infos clés' },
  ];

  return (
    <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-medium)', borderRadius: 14, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '11px 14px', background: 'var(--color-background-tertiary)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ fontSize: 14 }}>🎯</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '.07em' }}>POINTS CLÉS</span>
      </div>
      {/* Tabs */}
      <div style={{ display: 'flex', padding: '0 14px', borderBottom: '1px solid var(--color-border)', gap: 2 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '9px 10px', fontSize: 11, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? 'var(--color-accent)' : 'var(--color-text-muted)', borderBottom: `2px solid ${tab === t.id ? 'var(--color-accent)' : 'transparent'}`, fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: -1, transition: 'all 120ms', whiteSpace: 'nowrap' }}>
            {t.icon} {t.label}
            {keyPoints && <span style={{ background: tab === t.id ? 'var(--color-accent-bg)' : 'var(--color-background-elevated)', color: tab === t.id ? 'var(--color-accent)' : 'var(--color-text-muted)', borderRadius: 8, padding: '0 5px', fontSize: 9, fontWeight: 700 }}>{keyPoints[t.id]?.length || 0}</span>}
          </button>
        ))}
      </div>
      {/* List */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {isAnalyzing || !keyPoints ? (
          [80,92,70,85].map((w,i) => <Sk key={i} w={`${w}%`} h={32} style={{ borderRadius: 8 }} />)
        ) : (
          (keyPoints[tab] || []).map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 11px', background: 'var(--color-background-tertiary)', borderRadius: 9, border: '1px solid var(--color-border)', animation: `fadeSlide ${200 + i*60}ms ease both` }}>
              <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1, color: tab === 'decisions' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                {tab === 'decisions' ? '✓' : '●'}
              </span>
              <p style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--color-text-secondary)', margin: 0 }}>{item}</p>
            </div>
          ))
        )}
      </div>
      <style>{`${SHIMMER} @keyframes fadeSlide{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ExtractedActions
   ══════════════════════════════════════════════════════════════ */
export function ExtractedActions() {
  const { keyPoints, isAnalyzing, isAnalyzed } = useCompteRendu();
  const { addToast } = useNotif();
  const [created, setCreated] = useState(false);
  const [checked, setChecked] = useState({});

  if (!isAnalyzed && !isAnalyzing) return null;

  const handleCreate = () => {
    setCreated(true);
    addToast(`${keyPoints?.actions?.length || 4} tâches créées avec succès !`, 'success');
  };

  return (
    <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-warning-border)', borderRadius: 14, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '11px 14px', background: 'var(--color-warning-bg)', borderBottom: '1px solid var(--color-warning-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 14 }}>⚡</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-warning)', letterSpacing: '.07em' }}>ACTIONS EXTRAITES</span>
          {keyPoints && <span style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)', borderRadius: 8, padding: '0 6px', fontSize: 9, fontWeight: 800, border: '1px solid var(--color-warning-border)' }}>{keyPoints.actions.length}</span>}
        </div>
        {isAnalyzed && !created ? (
          <button onClick={handleCreate} style={{ background: 'var(--color-warning)', border: 'none', borderRadius: 7, padding: '5px 12px', color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)', letterSpacing: '.04em', display: 'flex', alignItems: 'center', gap: 5 }}>
            ＋ Créer des tâches
          </button>
        ) : isAnalyzed ? (
          <span style={{ fontSize: 10, color: 'var(--color-success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 12 }}>✓</span> Tâches créées
          </span>
        ) : null}
      </div>
      {/* List */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {isAnalyzing || !keyPoints ? (
          [1,2,3].map(i => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Sk w={16} h={16} style={{ borderRadius: 4, flexShrink: 0 }} />
              <Sk w="85%" />
            </div>
          ))
        ) : (
          keyPoints.actions.map((a, i) => {
            const done = !!checked[i];
            return (
              <div key={i} onClick={() => setChecked(p => ({ ...p, [i]: !p[i] }))} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '9px 11px', borderRadius: 9, background: done ? 'var(--color-success-bg)' : 'var(--color-background-tertiary)', border: `1px solid ${done ? 'var(--color-success-border)' : 'var(--color-border)'}`, cursor: 'pointer', transition: 'all 160ms', animation: `fadeSlide ${200 + i*70}ms ease both` }}>
                <div style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0, marginTop: 2, border: `2px solid ${done ? 'var(--color-success)' : 'var(--color-border-medium)'}`, background: done ? 'var(--color-success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 160ms' }}>
                  {done && <span style={{ color: '#fff', fontSize: 8, fontWeight: 900 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: done ? 'var(--color-text-muted)' : 'var(--color-text-primary)', textDecoration: done ? 'line-through' : 'none', marginBottom: 3, lineHeight: 1.4 }}>{a.text}</p>
                  <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {a.assignee && <span>→ {a.assignee}</span>}
                    {a.due && <span>📅 {a.due}</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <style>{`${SHIMMER} @keyframes fadeSlide{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
