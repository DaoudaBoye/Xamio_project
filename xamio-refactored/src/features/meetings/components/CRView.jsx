/**
 * Xamio — CRView.jsx
 * - Bouton "Ouvrir" → modal pleine page qui affiche le document (PDF iframe ou texte)
 * - Si pas de fichier source → affiche le CR structuré (résumé, décisions, actions)
 * - Bouton "Télécharger / Imprimer" → window.print() HTML formaté
 * - Bouton "Source" → URL signée S3
 * - Bouton "Analyser" → visible quand has_file = true → déclenche onAnalyze()
 */

import React, { useState, useCallback } from 'react';
import { T, Ic, fmtDate, GhostBtn } from './_shared';

/* ── Icônes inline ── */
function DocIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M4 2h6l3 3v9H4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M10 2v3h3M6 8h5M6 11h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function DlIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M3 11v2h10v-2M8 3v7M5.5 8.5L8 11l2.5-2.5"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"
        stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M4 5V2h8v3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <rect x="1" y="5" width="14" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M4 9h8M4 12h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M4 9v5h8V9" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M9 1L3 9h5l-1 6 6-8H8l1-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );
}

function SpinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
      style={{ animation: 'xmd-spin 1s linear infinite' }}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.8"
        strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
    </svg>
  );
}

/* ── Sous-composants ── */
function DecisionItem({ text }) {
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      padding: '9px 0', borderBottom: `1px solid ${T.bd0}`,
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 2,
        background: T.acc, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Ic.dec /></span>
      <p style={{ fontSize: 13, color: T.t2, lineHeight: 1.55, margin: 0 }}>
        {typeof text === 'string' ? text : text?.text || ''}
      </p>
    </div>
  );
}

function ActionItem({ a }) {
  const text     = typeof a === 'string' ? a : a?.text || a?.title || '';
  const assignee = typeof a === 'object' ? a?.assignee : null;
  const due      = typeof a === 'object' ? a?.due      : null;

  return (
    <div style={{
      padding: '11px 14px', borderRadius: T.r8,
      background: T.bg2, border: `1px solid ${T.bd0}`,
      marginBottom: 8,
    }}>
      {/* Titre */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: (assignee || due) ? 8 : 0 }}>
        <span style={{
          width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
          background: T.purb, border: `1px solid ${T.purr}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: T.pur, lineHeight: 0,
        }}><Ic.act /></span>
        <p style={{ fontSize: 13, fontWeight: 600, color: T.t1, margin: 0, lineHeight: 1.5, flex: 1 }}>{text}</p>
      </div>

      {/* Métadonnées : assigné + échéance */}
      {(assignee || due) && (
        <div style={{
          display: 'flex', gap: 10, flexWrap: 'wrap',
          paddingLeft: 29,
        }}>
          {assignee && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 9px', borderRadius: T.r20,
              background: T.accm, border: `1px solid ${T.accb}`,
              fontSize: 11, fontWeight: 600, color: T.acc,
            }}>
              <Ic.user /> {assignee}
            </span>
          )}
          {!assignee && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 9px', borderRadius: T.r20,
              background: T.bg3, border: `1px solid ${T.bd0}`,
              fontSize: 11, color: T.t4, fontStyle: 'italic',
            }}>
              <Ic.user /> Non assigné
            </span>
          )}
          {due && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 9px', borderRadius: T.r20,
              background: '#FFF4EE', border: '1px solid #FDBA8C',
              fontSize: 11, fontWeight: 600, color: '#F05A28',
            }}>
              <Ic.cal /> {fmtDate(due)}
            </span>
          )}
        </div>
      )}

      {/* Aucune métadonnée → afficher "Non assigné" quand même */}
      {!assignee && !due && (
        <div style={{ paddingLeft: 29 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 9px', borderRadius: T.r20,
            background: T.bg3, border: `1px solid ${T.bd0}`,
            fontSize: 11, color: T.t4, fontStyle: 'italic',
          }}>
            <Ic.user /> Non assigné
          </span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MODAL DOCUMENT
═══════════════════════════════════════════════════════════ */
function DocumentModal({ cr, fileUrl, loadingFile, onClose, onDownloadPDF }) {
  const dec = cr?.decisions || [];
  const act = cr?.actions   || [];

  const isPDF   = fileUrl && (fileUrl.includes('.pdf') || fileUrl.includes('application%2Fpdf'));
  const hasFile = !!fileUrl;
  const iframeRef = React.useRef(null);

  const handlePrint = React.useCallback(() => {
    if (isPDF && iframeRef.current) {
      try {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
      } catch {
        const win = window.open(fileUrl, '_blank');
        if (win) win.addEventListener('load', () => win.print());
      }
    } else {
      onDownloadPDF();
    }
  }, [isPDF, fileUrl, onDownloadPDF]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,17,26,.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '28px 24px',
        animation: 'xmd-mbg .18s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: hasFile ? 1060 : 700,
          height: hasFile ? 'calc(100vh - 56px)' : 'auto',
          maxHeight: 'calc(100vh - 56px)',
          display: 'flex', flexDirection: 'column',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.06)',
          animation: 'xmd-mbox .22s cubic-bezier(.22,1,.36,1)',
        }}
      >
        {/* ── Header gradient ── */}
        <div style={{
          flexShrink: 0,
          background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
          padding: '20px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(255,255,255,.15)',
              border: '1.5px solid rgba(255,255,255,.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <path d="M4 2h6l3 3v9H4z" stroke="rgba(255,255,255,.9)" strokeWidth="1.6" strokeLinejoin="round"/>
                <path d="M10 2v3h3M6 8h5M6 11h3" stroke="rgba(255,255,255,.9)" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-.3px' }}>
                  Compte rendu
                </p>
                {cr?.generatedByAI && (
                  <span style={{
                    padding: '2px 9px', borderRadius: 20,
                    background: 'rgba(255,255,255,.2)',
                    border: '1px solid rgba(255,255,255,.25)',
                    fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.9)',
                  }}>✦ IA Xamio</span>
                )}
              </div>
              {cr?.createdAt && (
                <p style={{
                  fontSize: 12, color: 'rgba(255,255,255,.65)',
                  margin: '3px 0 0', fontFamily: 'var(--font-mono)',
                }}>
                  {new Date(cr.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 18px', borderRadius: 10,
                background: 'rgba(255,255,255,.18)',
                border: '1.5px solid rgba(255,255,255,.3)',
                color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
                transition: 'background .13s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.28)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.18)'}
            >
              <PrintIcon /> Télécharger / Imprimer
            </button>
            <button
              onClick={onClose}
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'rgba(255,255,255,.12)',
                border: '1.5px solid rgba(255,255,255,.2)',
                cursor: 'pointer', color: 'rgba(255,255,255,.85)', lineHeight: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background .13s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.24)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.12)'}
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* ── Corps ── */}
        <div style={{
          flex: 1, minHeight: 0, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          background: hasFile ? '#F1F3F5' : '#fff',
        }}>

          {/* Chargement */}
          {loadingFile && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: '#F5F3FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#7C3AED',
              }}>
                <SpinIcon />
              </div>
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                Chargement du document…
              </p>
            </div>
          )}

          {/* PDF iframe */}
          {!loadingFile && hasFile && isPDF && (
            <iframe
              ref={iframeRef}
              src={fileUrl}
              title="Compte rendu"
              style={{ flex: 1, border: 'none', width: '100%', minHeight: 0, display: 'block' }}
            />
          )}

          {/* Fichier non-PDF */}
          {!loadingFile && hasFile && !isPDF && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 20, padding: 48,
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: '#F5F3FF', border: '1.5px solid #DDD6FE',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED',
              }}>
                <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
                  <path d="M4 2h6l3 3v9H4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                  <path d="M10 2v3h3M6 8h5M6 11h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1F36', margin: '0 0 8px' }}>
                  Document disponible
                </p>
                <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 24px', lineHeight: 1.6 }}>
                  Ce format ne peut pas être prévisualisé.<br />
                  Cliquez pour l'ouvrir dans un nouvel onglet.
                </p>
                <a href={fileUrl} target="_blank" rel="noreferrer" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '11px 22px', borderRadius: 10,
                  background: '#7C3AED', color: '#fff',
                  fontSize: 13, fontWeight: 700, textDecoration: 'none',
                }}>
                  <DlIcon /> Ouvrir le document
                </a>
              </div>
            </div>
          )}

          {/* CR structuré */}
          {!loadingFile && !hasFile && (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 28px', background: '#F0FDF4',
                borderBottom: '1px solid #BBF7D0', fontSize: 12, flexShrink: 0,
              }}>
                <span>👥</span>
                <span style={{ fontWeight: 700, color: '#15803D' }}>Visible par tous les participants</span>
                <span style={{ color: '#86EFAC' }}>·</span>
                <span style={{ color: '#166534' }}>Ce compte rendu est partagé avec l'ensemble des invités.</span>
              </div>

              <div style={{ overflowY: 'auto', padding: '32px 40px', flex: 1 }}>

                {/* Résumé */}
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 3, height: 14, borderRadius: 2, background: '#7C3AED' }} />
                    <p style={{ fontSize: 10.5, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.08em', margin: 0 }}>Résumé</p>
                  </div>
                  <div style={{ background: '#F5F3FF', borderRadius: 12, padding: '18px 22px', border: '1px solid #EDE9FE' }}>
                    <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.85, margin: 0 }}>
                      {cr?.summary || <em style={{ color: '#9CA3AF' }}>Aucun résumé disponible.</em>}
                    </p>
                  </div>
                </div>

                {/* Décisions */}
                {dec.length > 0 && (
                  <div style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 3, height: 14, borderRadius: 2, background: '#7C3AED' }} />
                      <p style={{ fontSize: 10.5, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.08em', margin: 0 }}>Décisions · {dec.length}</p>
                    </div>
                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                      {dec.map((d, i) => {
                        const txt = typeof d === 'string' ? d : (d.text || d.dec_intitule || '');
                        return (
                          <div key={i} style={{
                            display: 'flex', gap: 16, alignItems: 'flex-start',
                            padding: '14px 20px',
                            borderBottom: i < dec.length - 1 ? '1px solid #F3F4F6' : 'none',
                          }}>
                            <span style={{
                              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                              background: '#7C3AED', color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 700, marginTop: 1,
                            }}>{i + 1}</span>
                            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.65, margin: 0, paddingTop: 3 }}>{txt}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {act.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 3, height: 14, borderRadius: 2, background: '#7C3AED' }} />
                      <p style={{ fontSize: 10.5, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.08em', margin: 0 }}>Actions · {act.length}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {act.map((a, i) => {
                        const title    = typeof a === 'string' ? a : (a.title || a.text || '');
                        const assignee = typeof a === 'object' ? a.assignee : null;
                        const due      = typeof a === 'object' ? a.due      : null;
                        return (
                          <div key={i} style={{
                            background: '#fff', border: '1px solid #E5E7EB',
                            borderRadius: 12, padding: '14px 18px',
                            display: 'flex', alignItems: 'flex-start', gap: 14,
                          }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7C3AED', flexShrink: 0, marginTop: 6 }} />
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1F36', margin: 0 }}>{title}</p>
                              {(assignee || due) && (
                                <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 12, color: '#6B7280' }}>
                                  {assignee && <span>👤 {assignee}</span>}
                                  {due && <span>📅 {fmtDate(due)}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!dec.length && !act.length && !cr?.summary && (
                  <div style={{ textAlign: 'center', padding: '48px 0' }}>
                    <p style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', margin: 0 }}>
                      Ce compte rendu ne contient pas encore de contenu.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CRView PRINCIPAL
   Props :
     cr           — objet CR normalisé
     onEdit       — callback "Modifier"
     onAnalyze    — callback "Analyser" (visible si cr.has_file = true)
     meetingId    — id de la réunion
═══════════════════════════════════════════════════════════ */
export default function CRView({ cr, onEdit, onAnalyze, meetingId }) {
  const [tab,         setTab]         = useState('summary');
  const [modalOpen,   setModalOpen]   = useState(false);
  const [fileUrl,     setFileUrl]     = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const dec = cr?.decisions || [];
  const act = cr?.actions   || [];
  const doc = cr?.attachedFile || null;

  const tabs = [
    { v: 'summary',   l: 'Résumé',    badge: null,       alwaysShow: true  },
    { v: 'decisions', l: 'Décisions', badge: dec.length, alwaysShow: dec.length > 0 },
    { v: 'actions',   l: 'Actions',   badge: act.length, alwaysShow: true  },
  ];

  /* ── Ouvrir modal ── */
/* Optimisation du téléchargement avec gestion d'erreur propre */
const handleOpen = useCallback(() => {
  // 1. Ouvrir la modal immédiatement — jamais bloquer l'affichage
  setModalOpen(true);
  setFileUrl(null);

  // 2. Si pas de fichier S3 → CR structuré s'affiche instantanément, on s'arrête
  if (!cr?.has_file) return;

  // 3. Fetch de l'URL S3 en arrière-plan, sans bloquer le rendu
  setLoadingFile(true);
  const token = localStorage.getItem('xamio_token');

  fetch(`/api/reunions/${meetingId}/compte-rendu/download`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(res => {
      if (!res.ok) throw new Error('Source non disponible');
      return res.json();
    })
    .then(({ url }) => setFileUrl(url))
    .catch(err => console.error('Xamio Error:', err))
    .finally(() => setLoadingFile(false));

}, [cr?.has_file, meetingId]);

  /* ── Téléchargement source S3 ── */
  const handleDownloadSource = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const token = localStorage.getItem('xamio_token');
      const res = await fetch(
        `/api/reunions/${meetingId}/compte-rendu/download`,
        { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } }
      );
      if (!res.ok) throw new Error('Erreur téléchargement');
      const { url } = await res.json();
      window.open(url, '_blank');
    } catch {
      alert('Impossible de télécharger le fichier source.');
    } finally {
      setDownloading(false);
    }
  }, [downloading, meetingId]);

  /* ── Génération HTML + impression ── */
  const handleDownloadPDF = useCallback(() => {
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Compte rendu</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      max-width: 720px; margin: 48px auto; padding: 0 24px;
      color: #1A1F36; font-size: 14px; line-height: 1.6;
    }
    header { margin-bottom: 36px; border-bottom: 2px solid #7C3AED; padding-bottom: 16px; }
    header h1 { font-size: 24px; font-weight: 700; color: #1A1F36; }
    header p  { font-size: 12px; color: #6B7280; margin-top: 4px; }
    .badge {
      display: inline-flex; align-items: center;
      padding: 2px 10px; border-radius: 20px;
      background: #F5F3FF; border: 1px solid #DDD6FE;
      font-size: 11px; font-weight: 700; color: #7C3AED;
      margin-left: 8px; vertical-align: middle;
    }
    section { margin-bottom: 36px; }
    h2 {
      font-size: 11px; font-weight: 700; color: #6B7280;
      text-transform: uppercase; letter-spacing: .08em; margin-bottom: 14px;
    }
    .summary {
      background: #F5F3FF; border-left: 4px solid #7C3AED;
      padding: 16px 20px; border-radius: 10px;
      font-size: 14px; line-height: 1.85; color: #374151;
    }
    .decision {
      display: flex; gap: 14px; align-items: flex-start;
      padding: 12px 0; border-bottom: 1px solid #F3F4F6;
    }
    .decision:last-child { border-bottom: none; }
    .dec-num {
      width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
      background: #7C3AED; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700;
    }
    .dec-text { font-size: 13.5px; color: #374151; line-height: 1.65; padding-top: 4px; }
    .action {
      background: #F9FAFB; border: 1px solid #E5E7EB;
      border-radius: 10px; padding: 12px 16px; margin-bottom: 8px;
    }
    .action-title { font-size: 13.5px; font-weight: 600; color: #1A1F36; }
    .action-meta  { font-size: 11.5px; color: #6B7280; margin-top: 5px; }
    footer {
      margin-top: 48px; padding-top: 16px; border-top: 1px solid #E5E7EB;
      font-size: 11px; color: #9CA3AF; text-align: center;
    }
    @media print { body { margin: 24px; } @page { margin: 20mm; } }
  </style>
</head>
<body>
  <header>
    <h1>Compte rendu${cr?.generatedByAI ? ' <span class="badge">✦ IA Xamio</span>' : ''}</h1>
    <p>${cr?.createdAt
      ? new Date(cr.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : ''
    }</p>
  </header>
  <section>
    <h2>Résumé</h2>
    <div class="summary">${cr?.summary || '<em style="color:#9CA3AF">Aucun résumé disponible.</em>'}</div>
  </section>
  ${dec.length > 0 ? `
  <section>
    <h2>Décisions · ${dec.length}</h2>
    ${dec.map((d, i) => {
      const txt = typeof d === 'string' ? d : (d.text || d.dec_intitule || '');
      return `<div class="decision"><div class="dec-num">${i + 1}</div><p class="dec-text">${txt}</p></div>`;
    }).join('')}
  </section>` : ''}
  ${act.length > 0 ? `
  <section>
    <h2>Actions · ${act.length}</h2>
    ${act.map(a => {
      const title    = typeof a === 'string' ? a : (a.title || a.text || '');
      const assignee = typeof a === 'object' ? a.assignee : null;
      const due      = typeof a === 'object' ? a.due      : null;
      return `<div class="action">
        <p class="action-title">${title}</p>
        ${assignee || due ? `<p class="action-meta">${assignee ? `👤 ${assignee}` : ''}${assignee && due ? ' &nbsp;·&nbsp; ' : ''}${due ? `📅 ${due}` : ''}</p>` : ''}
      </div>`;
    }).join('')}
  </section>` : ''}
  <footer>Généré par Xamio — ${new Date().toLocaleDateString('fr-FR')}</footer>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank');
    if (win) win.onunload = () => URL.revokeObjectURL(url);
  }, [cr]);

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <>
      <div className="xmd-s3" style={{
        background: T.bg1, border: `1px solid ${T.purr}`,
        borderRadius: T.r14, overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: `1px solid ${T.bd0}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 26, height: 26, borderRadius: T.r6,
              background: T.purb, border: `1px solid ${T.purr}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.pur, lineHeight: 0,
            }}><Ic.doc /></span>
            <div>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: T.t1 }}>Compte rendu</span>
              {cr?.createdAt && (
                <p style={{ fontSize: 10, color: T.t3, margin: '1px 0 0', fontFamily: 'var(--font-mono)' }}>
                  {new Date(cr.createdAt).toLocaleDateString('fr-FR')}
                  {cr.generatedByAI && ' · IA Xamio'}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {cr?.generatedByAI && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '2px 9px', borderRadius: T.r20,
                background: T.purb, border: `1px solid ${T.purr}`,
                fontSize: 10, fontWeight: 600, color: T.pur,
              }}><Ic.ai /> IA</span>
            )}

            <GhostBtn small onClick={handleOpen}>
              <EyeIcon /> Ouvrir
            </GhostBtn>

            {cr?.has_file && (
              <GhostBtn small onClick={handleDownloadSource} disabled={downloading}>
                <DlIcon /> {downloading ? 'Chargement…' : 'Source'}
              </GhostBtn>
            )}

            {/* ── Bouton Analyser : visible uniquement si fichier importé ── */}
            {cr?.has_file && onAnalyze && (
              <button
                onClick={onAnalyze}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: T.r8,
                  border: 'none',
                  background: T.pur,
                  color: '#fff',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', transition: 'background .13s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#6D28D9'}
                onMouseLeave={e => e.currentTarget.style.background = T.pur}
              >
                <SparkleIcon /> Analyser
              </button>
            )}

            {onEdit && (
              <GhostBtn small onClick={onEdit}><Ic.edit /> Modifier</GhostBtn>
            )}
          </div>
        </div>

        {/* ── Bandeau visibilité ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '7px 16px', background: '#F0FDF4',
          borderBottom: `1px solid #BBF7D0`, fontSize: 11.5,
        }}>
          <span style={{ fontSize: 13, lineHeight: 0 }}>👥</span>
          <span style={{ fontWeight: 700, color: '#15803D' }}>Visible par tous les participants</span>
          <span style={{ color: '#86EFAC' }}>·</span>
          <span style={{ color: '#166534' }}>
            Ce compte rendu est partagé avec l'ensemble des invités de la réunion.
          </span>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${T.bd0}`, background: T.bg2 }}>
          {tabs.filter(t => t.alwaysShow || t.badge > 0).map(({ v, l, badge }) => {
            const active = tab === v;
            const showBadge = badge !== null && (badge > 0 || v === 'actions');
            return (
              <button key={v} onClick={() => setTab(v)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '8px 14px', border: 'none', background: 'none',
                borderBottom: `2px solid ${active ? T.pur : 'transparent'}`,
                color: active ? T.pur : T.t3,
                fontSize: 12, fontWeight: active ? 700 : 450,
                cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all .13s',
              }}>
                {l}
                {showBadge && (
                  <span style={{
                    fontSize: 9.5, fontWeight: 700, padding: '1px 5px', borderRadius: 99,
                    background: active ? T.purb : T.bg3,
                    color: active ? T.pur : T.t3,
                    border: `1px solid ${active ? T.purr : T.bd0}`,
                  }}>{badge}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Contenu onglets ── */}
        <div style={{ padding: '16px' }}>
          {tab === 'summary' && (
            cr?.summary
              ? <div style={{
                  padding: '13px 15px', borderRadius: T.r10,
                  background: T.bg2, borderLeft: `3px solid ${T.pur}`,
                }}>
                  <p style={{ fontSize: 13, color: T.t2, lineHeight: 1.8, margin: 0 }}>{cr.summary}</p>
                </div>
              : <p style={{ fontSize: 13, color: T.t3, fontStyle: 'italic' }}>Aucun résumé disponible.</p>
          )}
          {tab === 'decisions' && (
            !dec.length
              ? <p style={{ fontSize: 13, color: T.t3, fontStyle: 'italic' }}>Aucune décision enregistrée.</p>
              : dec.map((d, i) => <DecisionItem key={i} text={d} />)
          )}
          {tab === 'actions' && (
            !act.length
              ? <p style={{ fontSize: 13, color: T.t3, fontStyle: 'italic' }}>Aucune action enregistrée.</p>
              : act.map((a, i) => <ActionItem key={i} a={a} />)
          )}
        </div>

        {/* ── Section document source ── */}
        {doc && (
          <div style={{ borderTop: `1.5px solid ${T.bd0}` }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px', background: T.bg2,
              borderBottom: `1px solid ${T.bd0}`,
            }}>
              <span style={{
                width: 26, height: 26, borderRadius: T.r6,
                background: T.purb, border: `1px solid ${T.purr}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: T.pur, lineHeight: 0, flexShrink: 0,
              }}><DocIcon /></span>
              <span style={{
                fontSize: 11, fontWeight: 700, color: T.t2,
                textTransform: 'uppercase', letterSpacing: '.07em', flex: 1,
              }}>Document source</span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: T.r6,
                background: T.purb, border: `1px solid ${T.purr}`,
                fontSize: 11.5, fontWeight: 600, color: T.pur,
                maxWidth: 220, overflow: 'hidden',
              }}>
                <span style={{ lineHeight: 0, flexShrink: 0 }}><DocIcon /></span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doc.name}
                </span>
              </span>
              <a
                href={doc.base64}
                download={doc.name}
                className="xmd-doc-dl"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: T.r6,
                  border: `1px solid ${T.purr}`, background: '#fff',
                  fontSize: 12, fontWeight: 600, color: T.pur,
                  textDecoration: 'none', flexShrink: 0,
                  transition: 'all .13s', cursor: 'pointer',
                }}
              >
                <DlIcon /> Télécharger
              </a>
            </div>

            {doc.type === 'application/pdf' && (
              <div style={{ background: '#F8F9FA' }}>
                <iframe
                  src={doc.base64}
                  title={doc.name}
                  style={{ width: '100%', height: 500, border: 'none', display: 'block' }}
                />
              </div>
            )}

            {doc.type !== 'application/pdf' && doc.rawText && (
              <div className="xmd-sb" style={{
                padding: '14px 18px', maxHeight: 340, overflowY: 'auto',
                fontSize: 12.5, color: T.t2, lineHeight: 1.8,
                whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', background: T.bg2,
              }}>
                {doc.rawText}
              </div>
            )}

            {doc.type !== 'application/pdf' && !doc.rawText && (
              <div style={{
                padding: '14px 18px', display: 'flex', alignItems: 'center',
                gap: 10, fontSize: 13, color: T.t3,
              }}>
                <span style={{ lineHeight: 0, opacity: .45 }}><DocIcon /></span>
                <span style={{ fontStyle: 'italic' }}>
                  Prévisualisation non disponible — téléchargez le fichier pour le consulter.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modal document ── */}
      {modalOpen && (
        <DocumentModal
          cr={cr}
          fileUrl={fileUrl}
          loadingFile={loadingFile}
          onClose={() => { 
          setModalOpen(false); 
          setFileUrl(null); // reset → force un re-fetch propre à la prochaine ouverture
        }}
          onDownloadPDF={handleDownloadPDF}
        />
      )}
    </>
  );
}