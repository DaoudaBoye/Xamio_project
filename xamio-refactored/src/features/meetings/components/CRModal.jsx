/**
 * CRModal.jsx — Xamio
 * Modal de visualisation complète + téléchargement d'un compte rendu
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

/* ══════════════════════════════════════════
   STYLES
══════════════════════════════════════════ */
function useStyles() {
  useEffect(() => {
    const id = 'crmodal-styles';
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = `
      @keyframes crm-bg  { from{opacity:0} to{opacity:1} }
      @keyframes crm-box { from{opacity:0;transform:translateY(18px) scale(.97)} to{opacity:1;transform:none} }
      @keyframes crm-up  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }

      .crm-overlay {
        position: fixed; inset: 0; z-index: 1000;
        background: rgba(15,23,42,.55);
        backdrop-filter: blur(3px);
        display: flex; align-items: center; justify-content: center;
        padding: 20px;
        animation: crm-bg .18s ease;
      }
      .crm-box {
        background: #fff;
        border-radius: 16px;
        width: 100%; max-width: 680px;
        max-height: 90vh;
        display: flex; flex-direction: column;
        box-shadow: 0 24px 80px rgba(0,0,0,.18);
        animation: crm-box .22s cubic-bezier(.22,1,.36,1);
        overflow: hidden;
      }
      .crm-header {
        display: flex; align-items: flex-start; justify-content: space-between;
        padding: 20px 24px 16px;
        border-bottom: 1.5px solid #F1F5F9;
        flex-shrink: 0;
      }
      .crm-body {
        overflow-y: auto; flex: 1;
        padding: 20px 24px;
      }
      .crm-body::-webkit-scrollbar { width: 4px; }
      .crm-body::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
      .crm-footer {
        padding: 14px 24px;
        border-top: 1.5px solid #F1F5F9;
        display: flex; gap: 10px; justify-content: flex-end;
        flex-shrink: 0;
        background: #F8FAFC;
      }
      .crm-tab {
        padding: 7px 14px; border: none; background: none;
        cursor: pointer; font-family: inherit;
        font-size: 13px; font-weight: 600; color: #6B7280;
        border-bottom: 2.5px solid transparent;
        transition: all .13s;
      }
      .crm-tab.active { color: #1E6FE8; border-bottom-color: #1E6FE8; }
      .crm-tab:hover:not(.active) { color: #374151; }
      .crm-btn {
        display: flex; align-items: center; gap: 7px;
        padding: 9px 16px; border-radius: 8px;
        font-size: 13px; font-weight: 700;
        cursor: pointer; font-family: inherit;
        transition: all .13s; border: none;
      }
      .crm-btn-primary { background: #1E6FE8; color: #fff; }
      .crm-btn-primary:hover { background: #1658C0; }
      .crm-btn-ghost { background: #fff; color: #374151; border: 1.5px solid #CBD5E1 !important; }
      .crm-btn-ghost:hover { border-color: #94A3B8 !important; background: #F8FAFC; }
      .crm-decision-row {
        display: flex; gap: 12px; align-items: flex-start;
        padding: 10px 0; border-bottom: 1px solid #F1F5F9;
      }
      .crm-decision-row:last-child { border-bottom: none; }
      .crm-task {
        background: #F8FAFC; border: 1.5px solid #E2E8F0;
        border-radius: 8px; padding: 11px 14px; margin-bottom: 7px;
        display: flex; align-items: center; gap: 12px;
      }
      .crm-task:last-child { margin-bottom: 0; }
    `;
    document.head.appendChild(s);
  }, []);
}

/* ══════════════════════════════════════════
   ICÔNES
══════════════════════════════════════════ */
const Ic = {
  close: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  download: () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 13h10M8 3v7M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  copy: () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M3 11V3a2 2 0 012-2h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  check: () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  user: () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.6"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  cal: () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M5 1v3M11 1v3M2 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  ai: () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M9 1L3 9h5l-1 6 6-8H8l1-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
};

/* ══════════════════════════════════════════
   GÉNÉRATION PDF TEXTE (sans dépendance)
══════════════════════════════════════════ */
function generateTextContent(cr) {
  const line = '─'.repeat(60);
  const date = new Date(cr.createdAt).toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  let txt = `COMPTE RENDU DE RÉUNION\n${line}\n\n`;
  txt += `Réunion   : ${cr.meetingTitle || '—'}\n`;
  txt += `Date      : ${cr.meetingDate || '—'}\n`;
  txt += `Rédigé le : ${date}\n`;
  if (cr.author) txt += `Rédacteur : ${cr.author}\n`;
  if (cr.generatedByAI) txt += `Source    : Généré par IA Xamio\n`;
  txt += `\n${line}\n\n`;

  if (cr.summary) {
    txt += `RÉSUMÉ\n${'─'.repeat(20)}\n${cr.summary}\n\n`;
  }

  if (cr.decisions?.length) {
    txt += `DÉCISIONS (${cr.decisions.length})\n${'─'.repeat(20)}\n`;
    cr.decisions.forEach((d, i) => {
      txt += `${i + 1}. ${typeof d === 'string' ? d : d.text || ''}\n`;
    });
    txt += '\n';
  }

  if (cr.actions?.length) {
    txt += `ACTIONS / TÂCHES (${cr.actions.length})\n${'─'.repeat(20)}\n`;
    cr.actions.forEach((a, i) => {
      const title = typeof a === 'string' ? a : a.title || a.text || '';
      const assignee = typeof a === 'object' ? a.assignee : null;
      const due = typeof a === 'object' ? a.due : null;
      txt += `${i + 1}. ${title}`;
      if (assignee) txt += `\n   → Responsable : ${assignee}`;
      if (due) txt += `\n   → Échéance    : ${due}`;
      txt += '\n';
    });
    txt += '\n';
  }

  txt += `${line}\nXamio — Compte rendu généré automatiquement\n`;
  return txt;
}

function downloadTXT(cr) {
  const content = generateTextContent(cr);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CR_${(cr.meetingTitle || 'reunion').replace(/\s+/g, '_')}_${
    new Date(cr.createdAt).toISOString().slice(0, 10)
  }.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════ */
export default function CRModal({ cr, onClose }) {
  useStyles();
  const [tab,    setTab]    = useState('summary');
  const [copied, setCopied] = useState(false);

  const decisions = cr.decisions || [];
  const actions   = cr.actions   || [];

  // Fermeture clavier
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleCopy = useCallback(() => {
    const text = generateTextContent(cr);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [cr]);

  const fmtDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
    } catch { return d; }
  };

  const TABS = [
    { k: 'summary',   l: 'Résumé' },
    { k: 'decisions', l: `Décisions${decisions.length ? ` (${decisions.length})` : ''}` },
    { k: 'actions',   l: `Tâches${actions.length ? ` (${actions.length})` : ''}` },
  ];

  return (
    <div className="crm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="crm-box">

        {/* ── HEADER ── */}
        <div className="crm-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 10px', borderRadius: 20,
                background: '#F0FDF4', border: '1px solid #BBF7D0',
                fontSize: 11, fontWeight: 700, color: '#15803D',
              }}>✓ Publié</span>
              {cr.generatedByAI && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 9px', borderRadius: 20,
                  background: '#EFF6FF', border: '1px solid #BFDBFE',
                  fontSize: 11, fontWeight: 700, color: '#1E6FE8',
                }}><Ic.ai /> IA Xamio</span>
              )}
            </div>

            {/* Titre réunion */}
            <h2 style={{
              fontSize: 18, fontWeight: 700, color: '#1A1F36',
              margin: '0 0 6px', lineHeight: 1.3,
              fontFamily: 'var(--font-sans, "Segoe UI", sans-serif)',
            }}>{cr.meetingTitle || 'Compte rendu'}</h2>

            {/* Meta */}
            <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#6B7280', flexWrap: 'wrap' }}>
              {cr.meetingDate && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Ic.cal /> {cr.meetingDate}
                </span>
              )}
              {cr.author && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Ic.user /> {cr.author}
                </span>
              )}
              <span style={{ color: '#94A3B8' }}>
                Publié le {fmtDate(cr.createdAt)}
                {cr.updatedAt !== cr.createdAt && ` · Mis à jour le ${fmtDate(cr.updatedAt)}`}
              </span>
            </div>
          </div>

          {/* Bouton fermer */}
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: '1.5px solid #E2E8F0',
              background: '#fff', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#6B7280',
              flexShrink: 0, marginLeft: 12, transition: 'all .13s',
            }}
          ><Ic.close /></button>
        </div>

        {/* ── TABS ── */}
        <div style={{
          display: 'flex', borderBottom: '1.5px solid #F1F5F9',
          padding: '0 24px', background: '#FAFBFC', flexShrink: 0,
        }}>
          {TABS.map(({ k, l }) => (
            <button key={k} className={`crm-tab${tab === k ? ' active' : ''}`} onClick={() => setTab(k)}>
              {l}
            </button>
          ))}
        </div>

        {/* ── BODY ── */}
        <div className="crm-body">

          {/* Résumé */}
          {tab === 'summary' && (
            <div style={{ animation: 'crm-up .2s ease both' }}>
              {cr.summary
                ? <div style={{
                    padding: '16px 18px', borderRadius: 10,
                    background: '#EFF6FF', border: '1.5px solid #BFDBFE',
                    borderLeft: '4px solid #1E6FE8',
                  }}>
                    <p style={{ fontSize: 14, color: '#1A1F36', lineHeight: 1.85, margin: 0 }}>
                      {cr.summary}
                    </p>
                  </div>
                : <p style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>Aucun résumé disponible.</p>
              }
            </div>
          )}

          {/* Décisions */}
          {tab === 'decisions' && (
            <div style={{ animation: 'crm-up .2s ease both' }}>
              {!decisions.length
                ? <p style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>Aucune décision enregistrée.</p>
                : decisions.map((d, i) => {
                    const text = typeof d === 'string' ? d : d.text || '';
                    return (
                      <div key={i} className="crm-decision-row">
                        <span style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: '#1E6FE8', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, marginTop: 2,
                        }}>{i + 1}</span>
                        <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.65, margin: 0, paddingTop: 4 }}>
                          {text}
                        </p>
                      </div>
                    );
                  })
              }
            </div>
          )}

          {/* Actions / Tâches */}
          {tab === 'actions' && (
            <div style={{ animation: 'crm-up .2s ease both' }}>
              {!actions.length
                ? <p style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>Aucune tâche enregistrée.</p>
                : actions.map((a, i) => {
                    const title    = typeof a === 'string' ? a : a.title || a.text || '';
                    const assignee = typeof a === 'object' ? a.assignee : null;
                    const due      = typeof a === 'object' ? (a.due || null) : null;
                    return (
                      <div key={i} className="crm-task">
                        <span style={{
                          width: 10, height: 10, borderRadius: '50%',
                          background: '#1E6FE8', flexShrink: 0,
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13.5, fontWeight: 600, color: '#1A1F36', margin: 0 }}>{title}</p>
                          {(assignee || due) && (
                            <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12, color: '#6B7280', flexWrap: 'wrap' }}>
                              {assignee && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Ic.user /> {assignee}
                                </span>
                              )}
                              {due && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Ic.cal /> {due}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {due && (
                          <span style={{
                            padding: '3px 10px', borderRadius: 6, flexShrink: 0,
                            background: '#FFF4EE', border: '1.5px solid #FDBA8C',
                            fontSize: 11.5, fontWeight: 700, color: '#F05A28',
                            whiteSpace: 'nowrap',
                          }}>{due}</span>
                        )}
                      </div>
                    );
                  })
              }
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="crm-footer">
          <button className="crm-btn crm-btn-ghost" onClick={handleCopy}>
            {copied ? <><Ic.check /> Copié !</> : <><Ic.copy /> Copier le texte</>}
          </button>
          <button className="crm-btn crm-btn-primary" onClick={() => downloadTXT(cr)}>
            <Ic.download /> Télécharger (.txt)
          </button>
        </div>

      </div>
    </div>
  );
}
