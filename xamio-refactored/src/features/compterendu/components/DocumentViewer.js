/**
 * XAMIO — DocumentViewer v2
 * Aperçu document avec analyse step-by-step + contenu scrollable
 */
import React, { useState } from 'react';
import { useCompteRendu } from '../../../context/CompteRenduContext';
import { useNotif } from '../../../context/NotifContext';
import { formatFileSize, MOCK_DOCUMENT } from '../../../data/compteRenduMock';
import { ANALYZE_STEPS } from '../../../context/CompteRenduContext';

/* ── Icône fichier ── */
function FileTypeIcon({ name = '' }) {
  const ext = (name.split('.').pop() || 'pdf').toUpperCase();
  const color = ext === 'PDF' ? '#F03E3E' : ext === 'DOCX' || ext === 'DOC' ? '#4FA3F7' : '#2DA44E';
  return (
    <div style={{ width: 40, height: 48, borderRadius: 6, background: `${color}12`, border: `1px solid ${color}25`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, flexShrink: 0 }}>
      <span style={{ fontSize: 8, fontWeight: 800, color, letterSpacing: '.05em', fontFamily: 'var(--font-mono)' }}>{ext}</span>
      {[20, 15, 18].map((w, i) => <div key={i} style={{ width: w, height: 1.5, borderRadius: 1, background: `${color}${i === 0 ? '50' : '30'}` }} />)}
    </div>
  );
}

/* ── Skeleton ── */
function Sk({ w = '100%', h = 12 }) {
  return <div style={{ width: w, height: h, borderRadius: 4, background: 'var(--color-background-elevated)', animation: 'shimmer 1.6s ease-in-out infinite' }} />;
}

/* ── Barre de progression analyse ── */
function AnalyzeProgress({ step }) {
  const steps = ANALYZE_STEPS;
  const progress = Math.round(((step + 1) / steps.length) * 100);
  return (
    <div style={{ padding: '20px', background: 'var(--color-background-secondary)', border: '1px solid var(--color-accent-border)', borderRadius: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-accent)', animation: `bounce 1.2s ${i*0.2}s ease-in-out infinite` }} />
          ))}
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-accent)' }}>{steps[step]}</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{progress}%</span>
      </div>
      {/* Progress bar */}
      <div style={{ height: 4, borderRadius: 2, background: 'var(--color-background-elevated)', overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ height: '100%', borderRadius: 2, background: 'var(--color-accent)', width: `${progress}%`, transition: 'width 500ms cubic-bezier(0.4,0,0.2,1)' }} />
      </div>
      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: i <= step ? 'var(--color-accent)' : 'var(--color-background-elevated)', border: `1px solid ${i <= step ? 'transparent' : 'var(--color-border-medium)'}`, transition: 'all 300ms' }}>
              {i < step && <span style={{ color: '#fff', fontSize: 8, fontWeight: 800 }}>✓</span>}
              {i === step && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#fff' }} />}
            </div>
            <span style={{ fontSize: 11, color: i <= step ? 'var(--color-text-primary)' : 'var(--color-text-muted)', fontWeight: i === step ? 600 : 400, transition: 'color 300ms' }}>{s}</span>
          </div>
        ))}
      </div>
      {/* Skeleton preview */}
      <div style={{ marginTop: 16, padding: 12, background: 'var(--color-background-tertiary)', borderRadius: 9, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {[100, 87, 93, 70, 85, 60, 78].map((w, i) => <Sk key={i} w={`${w}%`} />)}
      </div>
    </div>
  );
}

export default function DocumentViewer() {
  const { document: doc, isAnalyzing, isAnalyzed, analyzeStep, reset } = useCompteRendu();
  const { addToast } = useNotif();
  const [expanded, setExpanded] = useState(false);

  if (!doc) return null;

  const uploadDate = new Date(doc.uploadedAt).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Fiche fichier */}
      <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-medium)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <FileTypeIcon name={doc.name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>{doc.name}</p>
          <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            <span>{formatFileSize(doc.size)}</span>
            <span>·</span>
            <span>{uploadDate}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          <button onClick={() => addToast('Document téléchargé !', 'success')} title="Télécharger" style={btnStyle}>⬇</button>
          <button onClick={reset} title="Supprimer le document" style={{ ...btnStyle, color: 'var(--color-danger)' }}>✕</button>
        </div>
      </div>

      {/* Loader analyse */}
      {isAnalyzing && <AnalyzeProgress step={analyzeStep} />}

      {/* Aperçu document */}
      {isAnalyzed && (
        <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-medium)', borderRadius: 12, overflow: 'hidden', animation: 'fadeSlide 300ms ease' }}>
          <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-background-tertiary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 11 }}>👁</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '.08em' }}>APERÇU DU DOCUMENT</span>
            </div>
            <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent)', fontSize: 11, fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
              {expanded ? '▲ Réduire' : '▼ Développer'}
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ maxHeight: expanded ? 500 : 260, overflowY: 'auto', padding: '16px 18px', transition: 'max-height 300ms cubic-bezier(0.4,0,0.2,1)' }}>
              <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.8, color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                {MOCK_DOCUMENT.content}
              </pre>
            </div>
            {!expanded && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'linear-gradient(to bottom, transparent, var(--color-background-secondary))', pointerEvents: 'none' }} />
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer { 0%,100%{opacity:.35} 50%{opacity:.7} }
        @keyframes bounce  { 0%,80%,100%{transform:scale(.55);opacity:.4} 40%{transform:scale(1);opacity:1} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

const btnStyle = {
  width: 28, height: 28, borderRadius: 6,
  border: '1px solid var(--color-border-medium)',
  background: 'var(--color-background-elevated)',
  cursor: 'pointer', color: 'var(--color-text-muted)',
  fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 120ms',
};
