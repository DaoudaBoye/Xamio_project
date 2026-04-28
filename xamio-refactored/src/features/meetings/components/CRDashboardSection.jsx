/**
 * CRDashboardSection.jsx — Xamio
 * Section tableau de bord : liste des comptes rendus récents
 * Visible par tous les utilisateurs connectés
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useCR } from '../hooks/useCR';
import CRModal from './CRModal';

/* ══════════════════════════════════════════
   STYLES
══════════════════════════════════════════ */
function useStyles() {
  useEffect(() => {
    const id = 'crdash-styles';
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = `
      @keyframes crd-up { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }

      .crd-section { animation: crd-up .3s cubic-bezier(.22,1,.36,1) both; }

      .crd-card {
        background: #fff;
        border: 1.5px solid #E2E8F0;
        border-radius: 12px;
        padding: 14px 16px;
        cursor: pointer;
        transition: all .15s;
        position: relative;
        overflow: hidden;
      }
      .crd-card::before {
        content: '';
        position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
        background: #1E6FE8;
        border-radius: 3px 0 0 3px;
        opacity: 0;
        transition: opacity .15s;
      }
      .crd-card:hover {
        border-color: #BFDBFE;
        box-shadow: 0 4px 16px rgba(30,111,232,.08);
        transform: translateY(-1px);
      }
      .crd-card:hover::before { opacity: 1; }

      .crd-empty {
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        padding: 40px 24px; text-align: center;
        border: 2px dashed #E2E8F0;
        border-radius: 12px;
        background: #FAFBFC;
      }

      .crd-badge-ai {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 2px 8px; border-radius: 20px;
        background: #EFF6FF; border: 1px solid #BFDBFE;
        font-size: 10px; font-weight: 700; color: #1E6FE8;
      }
      .crd-badge-pub {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 2px 8px; border-radius: 20px;
        background: #F0FDF4; border: 1px solid #BBF7D0;
        font-size: 10px; font-weight: 700; color: #15803D;
      }

      .crd-search {
        width: 100%; padding: 9px 14px 9px 36px;
        border: 1.5px solid #E2E8F0; border-radius: 8px;
        font-size: 13px; color: #1A1F36;
        background: #fff; outline: none;
        font-family: inherit;
        transition: border-color .15s, box-shadow .15s;
        box-sizing: border-box;
      }
      .crd-search:focus {
        border-color: #1E6FE8;
        box-shadow: 0 0 0 3px rgba(30,111,232,.1);
      }
      .crd-search::placeholder { color: #94A3B8; }

      .crd-filter-btn {
        padding: 7px 12px; border-radius: 7px;
        border: 1.5px solid #E2E8F0;
        background: #fff; color: #6B7280;
        font-size: 12px; font-weight: 600;
        cursor: pointer; font-family: inherit;
        transition: all .13s; white-space: nowrap;
      }
      .crd-filter-btn:hover { border-color: #94A3B8; color: #374151; }
      .crd-filter-btn.active {
        background: #1E6FE8; border-color: #1E6FE8; color: #fff;
      }

      .crd-dl-btn {
        display: flex; align-items: center; gap: 5px;
        padding: 5px 10px; border-radius: 6px;
        border: 1.5px solid #E2E8F0;
        background: #fff; color: #374151;
        font-size: 11.5px; font-weight: 600;
        cursor: pointer; font-family: inherit;
        transition: all .13s; flex-shrink: 0;
      }
      .crd-dl-btn:hover { border-color: #1E6FE8; color: #1E6FE8; background: #EFF6FF; }
    `;
    document.head.appendChild(s);
  }, []);
}

/* ══════════════════════════════════════════
   ICÔNES
══════════════════════════════════════════ */
const Ic = {
  doc:      () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 2h6l3 3v9H4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M10 2v3h3M6 8h5M6 11h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  search:   () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6"/><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  download: () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 13h10M8 3v7M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  eye:      () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.6"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/></svg>,
  ai:       () => <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M9 1L3 9h5l-1 6 6-8H8l1-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  cal:      () => <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M5 1v3M11 1v3M2 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  empty:    () => <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><rect x="6" y="4" width="18" height="26" rx="3" stroke="#CBD5E1" strokeWidth="2"/><path d="M14 4v5h10M10 16h16M10 21h10" stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round"/><circle cx="27" cy="27" r="7" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5"/><path d="M24 27l2 2 4-4" stroke="#1E6FE8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return d; }
}

function timeAgo(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'À l\'instant';
  if (mins < 60)  return `Il y a ${mins} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7)   return `Il y a ${days}j`;
  return fmtDate(d);
}

function downloadTXT(cr, e) {
  e?.stopPropagation();
  const line = '─'.repeat(60);
  let txt = `COMPTE RENDU DE RÉUNION\n${line}\n\n`;
  txt += `Réunion   : ${cr.meetingTitle || '—'}\n`;
  txt += `Date      : ${cr.meetingDate  || '—'}\n`;
  txt += `Rédigé le : ${fmtDate(cr.createdAt)}\n`;
  if (cr.author)         txt += `Rédacteur : ${cr.author}\n`;
  if (cr.generatedByAI)  txt += `Source    : Généré par IA Xamio\n`;
  txt += `\n${line}\n\n`;
  if (cr.summary) txt += `RÉSUMÉ\n${'─'.repeat(20)}\n${cr.summary}\n\n`;
  if (cr.decisions?.length) {
    txt += `DÉCISIONS (${cr.decisions.length})\n${'─'.repeat(20)}\n`;
    cr.decisions.forEach((d, i) => { txt += `${i+1}. ${typeof d === 'string' ? d : d.text || ''}\n`; });
    txt += '\n';
  }
  if (cr.actions?.length) {
    txt += `TÂCHES (${cr.actions.length})\n${'─'.repeat(20)}\n`;
    cr.actions.forEach((a, i) => {
      const t = typeof a === 'string' ? a : a.title || a.text || '';
      txt += `${i+1}. ${t}`;
      if (typeof a === 'object' && a.assignee) txt += `\n   → ${a.assignee}`;
      if (typeof a === 'object' && a.due)      txt += `\n   → ${a.due}`;
      txt += '\n';
    });
  }
  txt += `\n${line}\nXamio — Compte rendu\n`;
  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `CR_${(cr.meetingTitle || 'reunion').replace(/\s+/g, '_')}_${
    new Date(cr.createdAt).toISOString().slice(0, 10)
  }.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════
   CARTE CR
══════════════════════════════════════════ */
function CRCard({ cr, onClick }) {
  const nbDec = cr.decisions?.length || 0;
  const nbAct = cr.actions?.length   || 0;

  return (
    <div className="crd-card" onClick={() => onClick(cr)}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>

        {/* Gauche */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badges */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 7, flexWrap: 'wrap' }}>
            <span className="crd-badge-pub">✓ Publié</span>
            {cr.generatedByAI && <span className="crd-badge-ai"><Ic.ai /> IA</span>}
          </div>

          {/* Titre */}
          <p style={{
            fontSize: 13.5, fontWeight: 700, color: '#1A1F36', margin: '0 0 4px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{cr.meetingTitle || 'Réunion sans titre'}</p>

          {/* Résumé preview */}
          {cr.summary && (
            <p style={{
              fontSize: 12, color: '#6B7280', margin: '0 0 8px',
              lineHeight: 1.55,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>{cr.summary}</p>
          )}

          {/* Stats + date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {nbDec > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 600, color: '#1E6FE8',
                background: '#EFF6FF', padding: '2px 8px', borderRadius: 20,
                border: '1px solid #BFDBFE',
              }}>{nbDec} décision{nbDec > 1 ? 's' : ''}</span>
            )}
            {nbAct > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 600, color: '#F05A28',
                background: '#FFF4EE', padding: '2px 8px', borderRadius: 20,
                border: '1px solid #FDBA8C',
              }}>{nbAct} tâche{nbAct > 1 ? 's' : ''}</span>
            )}
            <span style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Ic.cal /> {cr.meetingDate || fmtDate(cr.createdAt)}
            </span>
            <span style={{ fontSize: 11, color: '#CBD5E1' }}>·</span>
            <span style={{ fontSize: 11, color: '#94A3B8' }}>{timeAgo(cr.createdAt)}</span>
          </div>
        </div>

        {/* Droite : actions */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'flex-start' }}>
          <button
            className="crd-dl-btn"
            onClick={(e) => downloadTXT(cr, e)}
            title="Télécharger"
          >
            <Ic.download /> Télécharger
          </button>
          <button
            className="crd-dl-btn"
            onClick={(e) => { e.stopPropagation(); onClick(cr); }}
            title="Voir"
            style={{ color: '#1E6FE8', borderColor: '#BFDBFE', background: '#EFF6FF' }}
          >
            <Ic.eye /> Voir
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════ */
export default function CRDashboardSection({ maxVisible = 6 }) {
  useStyles();

  const { crList } = useCR();
  const [selected,  setSelected]  = useState(null);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all');   // all | ai | manual
  const [showAll,   setShowAll]   = useState(false);

  // Filtrage + recherche
  const filtered = crList
    .filter(cr => {
      if (filter === 'ai')     return cr.generatedByAI;
      if (filter === 'manual') return !cr.generatedByAI;
      return true;
    })
    .filter(cr => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (cr.meetingTitle || '').toLowerCase().includes(q) ||
        (cr.summary      || '').toLowerCase().includes(q) ||
        (cr.author       || '').toLowerCase().includes(q)
      );
    });

  const visible = showAll ? filtered : filtered.slice(0, maxVisible);
  const hasMore = filtered.length > maxVisible && !showAll;

  if (!crList.length) return null; // Ne rien afficher si aucun CR

  return (
    <>
      {/* ── MODAL ── */}
      {selected && (
        <CRModal cr={selected} onClose={() => setSelected(null)} />
      )}

      {/* ── SECTION ── */}
      <div className="crd-section" style={{ marginBottom: 24 }}>

        {/* En-tête section */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14, flexWrap: 'wrap', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: '#EFF6FF', border: '1px solid #BFDBFE',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#1E6FE8',
            }}><Ic.doc /></div>
            <div>
              <h3 style={{
                fontSize: 15, fontWeight: 700, color: '#1A1F36',
                margin: 0, fontFamily: 'var(--font-sans, "Segoe UI", sans-serif)',
              }}>
                Comptes rendus
                <span style={{
                  marginLeft: 8, fontSize: 12, fontWeight: 600,
                  padding: '2px 8px', borderRadius: 20,
                  background: '#F1F5F9', color: '#64748B',
                }}>{crList.length}</span>
              </h3>
              <p style={{ fontSize: 11.5, color: '#94A3B8', margin: 0 }}>
                Visibles par tous les participants
              </p>
            </div>
          </div>
        </div>

        {/* Barre recherche + filtres */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {/* Recherche */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <span style={{
              position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
              color: '#94A3B8', lineHeight: 0, pointerEvents: 'none',
            }}><Ic.search /></span>
            <input
              className="crd-search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un compte rendu…"
            />
          </div>

          {/* Filtres */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { v: 'all',    l: 'Tous' },
              { v: 'ai',     l: '⚡ IA' },
              { v: 'manual', l: 'Manuel' },
            ].map(({ v, l }) => (
              <button
                key={v}
                className={`crd-filter-btn${filter === v ? ' active' : ''}`}
                onClick={() => setFilter(v)}
              >{l}</button>
            ))}
          </div>
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <div className="crd-empty">
            <div style={{ marginBottom: 12 }}><Ic.empty /></div>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: '#94A3B8', margin: 0 }}>
              {search ? 'Aucun résultat pour cette recherche' : 'Aucun compte rendu disponible'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visible.map((cr, i) => (
              <div
                key={cr.id}
                style={{ animation: `crd-up .25s cubic-bezier(.22,1,.36,1) ${i * 40}ms both` }}
              >
                <CRCard cr={cr} onClick={setSelected} />
              </div>
            ))}

            {/* Voir plus */}
            {hasMore && (
              <button
                onClick={() => setShowAll(true)}
                style={{
                  width: '100%', padding: '10px', borderRadius: 8,
                  border: '1.5px dashed #CBD5E1', background: 'transparent',
                  color: '#6B7280', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all .13s',
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#1E6FE8'; e.currentTarget.style.color = '#1E6FE8'; }}
                onMouseOut={e  => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#6B7280'; }}
              >
                Voir {filtered.length - maxVisible} compte{filtered.length - maxVisible > 1 ? 's rendu' : ' rendu'} supplémentaire{filtered.length - maxVisible > 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
