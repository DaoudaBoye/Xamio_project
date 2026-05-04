/**
 * Xamio — DocumentsPage v4.5
 * src/features/documents/components/DocumentsPage.js
 */

import React, {
  useState, useMemo, useRef, useEffect,
  useCallback, memo, createContext, useContext,
  useId,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotif }    from '../../../context/NotifContext';
import { useMeetingDocuments } from '../hooks/useMeetingDocuments';
import {
  fetchDocuments,
  uploadDocument,
  getSignedUrl,
  patchDocument,
  deleteDocument,
  exportCRtxt,
} from '../services/documentService';

/* ════════════════════════════════════════════════════════════════
   GLOBAL CSS
   ════════════════════════════════════════════════════════════════ */
const CSS_ID = 'xd-global-style-v4';
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  .xd-page { font-family: var(--font-sans); }
  .xd-grid {
    display: grid; gap: 10px;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
  }
  @media (max-width: 700px) {
    .xd-grid        { grid-template-columns: 1fr !important; }
    .xd-filters-row { flex-direction: column; align-items: stretch !important; }
    .xd-stats-row   { grid-template-columns: repeat(2, 1fr) !important; }
    .xd-header-row  { flex-direction: column; align-items: flex-start !important; }
  }
  @keyframes xd-fade-up  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
  @keyframes xd-bar      { from{transform:scaleX(0)} to{transform:scaleX(1)} }
  @keyframes xd-menu-pop { from{opacity:0;transform:scale(.96) translateY(-4px)} to{opacity:1;transform:none} }
  @keyframes xd-modal-bg { from{opacity:0} to{opacity:1} }
  @keyframes xd-modal-box{ from{opacity:0;transform:translateY(14px) scale(.97)} to{opacity:1;transform:none} }
  @keyframes xd-pulse    { 0%,100%{opacity:.4} 50%{opacity:.9} }
  @keyframes xd-spin     { to{transform:rotate(360deg)} }
  .xd-card-enter { animation: xd-fade-up .28s cubic-bezier(.22,1,.36,1) both; }
  .xd-page-enter { animation: xd-fade-up .22s cubic-bezier(.22,1,.36,1); }
  .xd-doc-card   { transition: border-color .18s, box-shadow .18s, background .18s; cursor: pointer; }
  .xd-doc-card:hover {
    border-color: var(--color-border-strong) !important;
    box-shadow: var(--shadow-dropdown) !important;
    background: var(--color-background-tertiary) !important;
  }
  .xd-doc-card:focus-visible { outline: 2px solid #E8500A; outline-offset: 2px; }
  .xd-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
  .xd-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .xd-scrollbar::-webkit-scrollbar-thumb { background: var(--color-background-hover); border-radius: 99px; }
  .xd-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--color-text-muted); }
  .xd-skeleton { animation: xd-pulse 1.5s ease-in-out infinite; background: var(--color-background-tertiary); border-radius: 4px; }
  .xd-meeting-badge { transition: background .13s, border-color .13s; }
  .xd-meeting-badge:hover { background: var(--color-purple-bg, #ede9fe) !important; border-color: var(--color-purple-border, #c4b5fd) !important; }
`;
function injectGlobalStyle() {
  if (typeof document === 'undefined' || document.getElementById(CSS_ID)) return;
  const s = document.createElement('style');
  s.id = CSS_ID; s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
}
injectGlobalStyle();

/* ════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ════════════════════════════════════════════════════════════════ */
const T = {
  bg1: 'var(--color-background-secondary)',
  bg2: 'var(--color-background-tertiary)',
  bg3: 'var(--color-background-elevated)',
  bd0: 'var(--color-border)',
  bd1: 'var(--color-border-medium)',
  bd2: 'var(--color-border-strong)',
  t1:  'var(--color-text-primary)',
  t2:  'var(--color-text-secondary)',
  t3:  'var(--color-text-muted)',
  acc:  '#E8500A', acc2: '#C94108',
  accm: 'rgba(232,80,10,.08)', accb: 'rgba(232,80,10,.22)',
  pur:  'var(--color-purple, #7c3aed)',
  purb: 'var(--color-purple-bg, #f5f3ff)',
  purr: 'var(--color-purple-border, #c4b5fd)',
  r6: 'var(--radius-medium)', r8: 'var(--radius-large)',
  r10: '10px', r12: 'var(--radius-xlarge)',
  r16: '16px', r20: '20px',
  shadowDropdown: 'var(--shadow-dropdown)',
  shadowModal:    'var(--shadow-modal)',
  fileColors: {
    pdf:  { fg: '#b91c1c', bg: 'rgba(185,28,28,.08)',  border: 'rgba(185,28,28,.2)'  },
    docx: { fg: '#1d4ed8', bg: 'rgba(29,78,216,.08)',  border: 'rgba(29,78,216,.2)'  },
    xlsx: { fg: '#15803d', bg: 'rgba(21,128,61,.08)',  border: 'rgba(21,128,61,.2)'  },
    png:  { fg: '#7c3aed', bg: 'rgba(124,58,237,.08)', border: 'rgba(124,58,237,.2)' },
  },
};

/* ════════════════════════════════════════════════════════════════
   CONSTANTES
   ════════════════════════════════════════════════════════════════ */
const CATEGORIES       = ['Commercial', 'Technique', 'Stratégie', 'Design', 'Juridique', 'Finance', 'Support'];
const MAX_SIZE_MB      = 50;
const TOTAL_STORAGE_MB = 1024;

const ACCEPTED_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
]);
const EXT_MIME = {
  pdf:  'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  png:  'image/png',
};
const TYPE_LABELS = { pdf: 'PDF', docx: 'Word', xlsx: 'Excel', png: 'Image', default: 'Fichier' };

const CAT_FILTERS = [
  { v: 'all', l: 'Toutes catégories' },
  ...CATEGORIES.map(c => ({ v: c, l: c })),
  { v: 'Comptes-rendus', l: 'Comptes-rendus' },
];
const ACCESS_FILTERS = [{ v: 'all', l: 'Tous les accès' }, { v: 'partage', l: 'Partagés' }, { v: 'prive', l: 'Privés' }];
const TYPE_FILTERS   = [{ v: 'all', l: 'Tous les types' }, { v: 'pdf', l: 'PDF' }, { v: 'docx', l: 'Word' }, { v: 'xlsx', l: 'Excel' }, { v: 'png', l: 'Images' }];
const SOURCE_FILTERS = [{ v: 'all', l: 'Toutes origines' }, { v: 'library', l: 'Bibliothèque' }, { v: 'meeting', l: 'Comptes-rendus' }];
const VIS_OPTIONS = [
  { id: 'prive',        label: 'Privé',       sub: 'Moi uniquement',       iconKey: 'lock',  danger: true  },
  { id: 'equipe',       label: 'Équipe',       sub: "Mon équipe seulement", iconKey: 'share', danger: false },
  { id: 'organisation', label: 'Organisation', sub: "Toute l'organisation", iconKey: 'share', danger: false },
];

/* ════════════════════════════════════════════════════════════════
   UTILITAIRES
   ════════════════════════════════════════════════════════════════ */
const parseMB      = (s = '') => { const n = parseFloat(s); return isNaN(n) ? 0 : (s.includes('MB') ? n : n / 1024); };
const formatSize   = (b) => b < 1_048_576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1_048_576).toFixed(1)} MB`;
const getExtension = (f = '') => f.split('.').pop()?.toLowerCase() || 'default';
const initials     = (n = '') => n.split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
const hashColor    = (s = '') => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return ['#2E70D9','#E07B2A','#3D9A6F','#7B60C8','#B0443A','#2A8FA8','#C85070','#4A8C4A'][Math.abs(h) % 8];
};
function validateFile(file) {
  const ext  = getExtension(file.name);
  const mime = file.type || EXT_MIME[ext] || '';
  if (!ACCEPTED_MIME.has(mime)) return 'Format non supporté. Utilisez PDF, DOCX, XLSX ou PNG.';
  if (file.size > MAX_SIZE_MB * 1_048_576) return `Fichier trop lourd (max ${MAX_SIZE_MB} MB).`;
  return null;
}

/* ════════════════════════════════════════════════════════════════
   HOOK — chargement docs bibliothèque
   ════════════════════════════════════════════════════════════════ */
function useLibraryDocuments({ addDocument }) {
  const addRef = useRef(addDocument);
  useEffect(() => { addRef.current = addDocument; }, [addDocument]);

  useEffect(() => {
    const token = localStorage.getItem('xamio_token');
    if (!token) return;
    const ctrl = new AbortController();
    fetchDocuments(ctrl.signal)
      .then(docs => docs.forEach(d => addRef.current(d)))
      .catch(err => { if (err.name !== 'AbortError') console.warn('[useLibraryDocuments]', err.message); });
    return () => ctrl.abort();
  }, []);
}

/* ════════════════════════════════════════════════════════════════
   DOCUMENTS CONTEXT
   ════════════════════════════════════════════════════════════════ */
const DocumentsContext = createContext(null);

export function DocumentsProvider({ children }) {
  const [docs, setDocs] = useState([]);
  const addDocument    = useCallback(doc => setDocs(p => p.some(d => d.id === doc.id) ? p : [doc, ...p]), []);
  const removeDocument = useCallback(id  => setDocs(p => p.filter(d => d.id !== id)), []);
  const updateDocument = useCallback((id, patch) => setDocs(p => p.map(d => d.id === id ? { ...d, ...patch } : d)), []);
  const value = useMemo(() => ({ docs, addDocument, removeDocument, updateDocument }), [docs, addDocument, removeDocument, updateDocument]);
  return <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>;
}

export function useDocumentsCtx() {
  const ctx = useContext(DocumentsContext);
  const [localDocs, setLocalDocs] = useState([]);
  const localAdd    = useCallback(doc => setLocalDocs(p => p.some(d => d.id === doc.id) ? p : [doc, ...p]), []);
  const localRemove = useCallback(id  => setLocalDocs(p => p.filter(d => d.id !== id)), []);
  const localUpdate = useCallback((id, patch) => setLocalDocs(p => p.map(d => d.id === id ? { ...d, ...patch } : d)), []);
  const fallback = useMemo(() => ({ docs: localDocs, addDocument: localAdd, removeDocument: localRemove, updateDocument: localUpdate }), [localDocs, localAdd, localRemove, localUpdate]);
  return ctx ?? fallback;
}

/* ════════════════════════════════════════════════════════════════
   HOOKS UTILITAIRES
   ════════════════════════════════════════════════════════════════ */
function useOutsideClick(ref, cb) {
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) cb(); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [ref, cb]);
}

const scriptCache = new Map();
function useScript(src) {
  const [state, setState] = useState(() => ({ loaded: src ? !!window._xdScriptLoaded?.[src] : false, error: null }));
  useEffect(() => {
    if (!src) return;
    if (window._xdScriptLoaded?.[src]) { setState({ loaded: true, error: null }); return; }
    let promise = scriptCache.get(src);
    if (!promise) {
      promise = new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => { window._xdScriptLoaded = { ...window._xdScriptLoaded, [src]: true }; res(); };
        s.onerror = rej;
        document.head.appendChild(s);
      });
      scriptCache.set(src, promise);
    }
    let cancelled = false;
    promise
      .then(() => { if (!cancelled) setState({ loaded: true, error: null }); })
      .catch(e  => { if (!cancelled) setState({ loaded: false, error: e }); scriptCache.delete(src); });
    return () => { cancelled = true; };
  }, [src]);
  return state;
}

function useDocFilters(docs) {
  const [query, setQuery]               = useState('');
  const [catFilter, setCatFilter]       = useState('all');
  const [accessFilter, setAccessFilter] = useState('all');
  const [typeFilter, setTypeFilter]     = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return docs.filter(d => {
      if (q && !d.name.toLowerCase().includes(q) && !d.author.toLowerCase().includes(q)) return false;
      if (catFilter    !== 'all' && d.category !== catFilter) return false;
      if (accessFilter === 'partage' && d.visibility === 'prive')  return false;
      if (accessFilter === 'prive'   && d.visibility !== 'prive')  return false;
      if (typeFilter   !== 'all' && d.type !== typeFilter) return false;
      if (sourceFilter !== 'all' && (d.source ?? 'library') !== sourceFilter) return false;
      return true;
    });
  }, [docs, query, catFilter, accessFilter, typeFilter, sourceFilter]);

  const resetFilters = useCallback(() => {
    setQuery(''); setCatFilter('all'); setAccessFilter('all'); setTypeFilter('all'); setSourceFilter('all');
  }, []);
  const hasActiveFilters = query !== '' || catFilter !== 'all' || accessFilter !== 'all' || typeFilter !== 'all' || sourceFilter !== 'all';
  return { query, setQuery, catFilter, setCatFilter, accessFilter, setAccessFilter, typeFilter, setTypeFilter, sourceFilter, setSourceFilter, filtered, resetFilters, hasActiveFilters };
}

/* ════════════════════════════════════════════════════════════════
   ICÔNES SVG
   ════════════════════════════════════════════════════════════════ */
const IcPlus     = memo(() => <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);
const IcDots     = memo(() => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden><circle cx="3" cy="8" r="1.4" fill="currentColor"/><circle cx="8" cy="8" r="1.4" fill="currentColor"/><circle cx="13" cy="8" r="1.4" fill="currentColor"/></svg>);
const IcClose    = memo(() => <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>);
const IcSearch   = memo(() => <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>);
const IcCloud    = memo(() => <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M12.5 9A3 3 0 009 6.1V6a3 3 0 00-6 0v.5A2.5 2.5 0 003 11h9.5a2 2 0 000-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>);
const IcDownload = memo(() => <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>);
const IcShare    = memo(() => <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden><circle cx="12" cy="3" r="2" stroke="currentColor" strokeWidth="1.4"/><circle cx="12" cy="13" r="2" stroke="currentColor" strokeWidth="1.4"/><circle cx="4" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/><path d="M10 4L6 7M10 12L6 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>);
const IcTrash    = memo(() => <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M3 5h10M6 5V3h4v2M5 5l.5 8h5L11 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const IcEye      = memo(() => <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/></svg>);
const IcLock     = memo(() => <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden><rect x="3" y="7.5" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 7.5V5a2.5 2.5 0 015 0v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>);
const IcCheck    = memo(() => <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const IcFilter   = memo(() => <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M2 3h12M4 8h8M6 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>);
const IcChevDown = memo(() => <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const IcWarn     = memo(() => <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M8 2L14.5 13H1.5L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 7v3M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>);
const IcFilePdf  = memo(() => <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden><rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M13 2v4h4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>);
const IcFileDocx = memo(() => <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden><rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>);
const IcFileXlsx = memo(() => <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden><rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>);
const IcFileImg  = memo(() => <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden><rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/><circle cx="7" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M2 14l4-4 3 3 3-3 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>);
const IcFile     = memo(() => <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden><path d="M5 2h8l4 4v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M13 2v4h4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>);
const IcMeeting  = memo(() => <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 1v4M11 1v4M2 7h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>);
const IcSpinner  = memo(() => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden style={{ animation: 'xd-spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity=".25"/><path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);

const FILE_ICONS = { pdf: IcFilePdf, docx: IcFileDocx, xlsx: IcFileXlsx, png: IcFileImg };
const FileIcon = memo(function FileIcon({ type }) {
  const Comp = FILE_ICONS[type] || IcFile;
  const c = T.fileColors[type] || { fg: T.t3 };
  return <span style={{ color: c.fg, lineHeight: 0, display: 'inline-flex', flexShrink: 0 }}><Comp /></span>;
});

/* ════════════════════════════════════════════════════════════════
   COMPOSANTS ATOMIQUES
   ════════════════════════════════════════════════════════════════ */
const IconBtnInner = React.forwardRef(function IconBtn({ children, onClick, active, danger, title, size = 28 }, ref) {
  return (
    <button ref={ref} onClick={onClick} title={title} aria-label={title} aria-pressed={active}
      style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? T.bg3 : 'transparent', border: `1px solid ${active ? T.bd1 : 'transparent'}`, borderRadius: T.r6, cursor: 'pointer', flexShrink: 0, color: active ? T.t1 : T.t3, transition: 'all .13s' }}
      onMouseEnter={e => { e.currentTarget.style.background = T.bg2; e.currentTarget.style.borderColor = T.bd1; e.currentTarget.style.color = danger ? 'var(--color-danger)' : T.t2; }}
      onMouseLeave={e => { e.currentTarget.style.background = active ? T.bg3 : 'transparent'; e.currentTarget.style.borderColor = active ? T.bd1 : 'transparent'; e.currentTarget.style.color = active ? T.t1 : T.t3; }}
    >{children}</button>
  );
});
const IconBtn = memo(IconBtnInner);

const Avatar = memo(function Avatar({ name = '', size = 22 }) {
  const color = hashColor(name);
  return <span style={{ width: size, height: size, borderRadius: '50%', background: color + '22', border: `1.5px solid ${color}44`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color, flexShrink: 0, lineHeight: 1 }}>{initials(name)}</span>;
});

const Tag = memo(function Tag({ icon, children, color = T.t3, bg = T.bg3 }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: T.r20, background: bg, color, fontSize: 11, fontWeight: 500, border: `1px solid ${color}22`, whiteSpace: 'nowrap' }}>{icon && <span style={{ lineHeight: 0, opacity: .85 }}>{icon}</span>}{children}</span>;
});

const TypePill = memo(function TypePill({ type }) {
  const c = T.fileColors[type] || { fg: T.t3, bg: T.bg2, border: T.bd0 };
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: T.r20, background: c.bg, fontSize: 11, fontWeight: 500, color: c.fg, border: `1px solid ${c.border}`, whiteSpace: 'nowrap' }}>{TYPE_LABELS[type] || 'Fichier'}</span>;
});

const PrimaryBtn = memo(function PrimaryBtn({ children, onClick, small, disabled, loading: isLoading }) {
  return (
    <button onClick={onClick} disabled={disabled || isLoading}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: small ? '6px 14px' : '9px 18px', borderRadius: T.r8, border: 'none', background: T.acc, color: '#FFF', fontSize: small ? 12 : 13, fontWeight: 700, cursor: (disabled || isLoading) ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', transition: 'background .15s, transform .15s, box-shadow .15s', boxShadow: `0 2px 8px ${T.acc}33`, whiteSpace: 'nowrap', opacity: (disabled || isLoading) ? .7 : 1 }}
      onMouseEnter={e => { if (!disabled && !isLoading) { e.currentTarget.style.background = T.acc2; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 4px 20px ${T.acc}55`; } }}
      onMouseLeave={e => { e.currentTarget.style.background = T.acc; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 2px 8px ${T.acc}33`; }}
    >{isLoading && <IcSpinner />}{children}</button>
  );
});

const GhostBtn = memo(function GhostBtn({ children, onClick, small, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: small ? '5px 12px' : '8px 16px', borderRadius: T.r8, border: `1px solid ${T.bd1}`, background: 'transparent', fontSize: small ? 12 : 13, fontWeight: 450, color: T.t2, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', transition: 'all .15s', whiteSpace: 'nowrap', opacity: disabled ? .5 : 1 }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = T.bg2; e.currentTarget.style.color = T.t1; } }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.t2; }}
    >{children}</button>
  );
});

function FormLabel({ children, htmlFor, required, hint }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'block', fontSize: 12, fontWeight: 500, color: T.t2, marginBottom: 5 }}>
      {children}
      {required && <span style={{ color: 'var(--color-danger)', marginLeft: 3 }} aria-hidden>*</span>}
      {hint && <span style={{ color: T.t3, fontWeight: 400, marginLeft: 6, fontSize: 11 }}>{hint}</span>}
    </label>
  );
}

function Field({ as: As = 'input', id, hasError, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <As id={id} {...props} aria-invalid={hasError || undefined}
      style={{ width: '100%', background: T.bg3, border: `1px solid ${hasError ? 'var(--color-danger)' : focused ? T.bd2 : T.bd0}`, borderRadius: T.r8, padding: As === 'textarea' ? '9px 13px' : '0 13px', height: As === 'textarea' ? undefined : 36, color: T.t1, fontSize: 13, lineHeight: 1.6, outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box', transition: 'border-color .15s, box-shadow .15s', boxShadow: focused ? `0 0 0 3px ${T.accm}` : 'none', caretColor: 'var(--color-warning)', ...props.style }}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    />
  );
}

const DropItem = memo(function DropItem({ label, selected, onClick }) {
  return (
    <button onClick={onClick} role="option" aria-selected={selected}
      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: T.r6, border: 'none', background: 'transparent', color: selected ? T.t1 : T.t2, fontSize: 12.5, fontWeight: selected ? 500 : 400, cursor: 'pointer', fontFamily: 'var(--font-sans)', textAlign: 'left', transition: 'all .1s' }}
      onMouseEnter={e => { e.currentTarget.style.background = T.bg3; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >{label}{selected && <span style={{ color: T.acc, lineHeight: 0 }}><IcCheck /></span>}</button>
  );
});

function Dropdown({ label, options, value, onChange, icon }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClick(ref, useCallback(() => setOpen(false), []));
  const current = options.find(o => o.v === value);
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open}
        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 12px', height: 34, borderRadius: T.r8, border: `1px solid ${open ? T.bd2 : T.bd0}`, background: open ? T.bg2 : T.bg1, color: T.t1, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all .13s', whiteSpace: 'nowrap' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = T.bd2; e.currentTarget.style.background = T.bg2; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = T.bd0; e.currentTarget.style.background = T.bg1; } }}
      >
        {icon && <span style={{ color: T.t3, lineHeight: 0 }}>{icon}</span>}
        {current?.l || label}
        <span style={{ color: T.t3, lineHeight: 0, marginLeft: 2, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}><IcChevDown /></span>
      </button>
      {open && (
        <div role="listbox" style={{ position: 'absolute', top: 40, left: 0, zIndex: 300, background: T.bg2, border: `1px solid ${T.bd1}`, borderRadius: T.r10, padding: 5, minWidth: 200, boxShadow: T.shadowDropdown, animation: 'xd-menu-pop .14s cubic-bezier(.22,1,.36,1)' }}>
          {options.map(o => <DropItem key={o.v} label={o.l} selected={o.v === value} onClick={() => { onChange(o.v); setOpen(false); }} />)}
        </div>
      )}
    </div>
  );
}

const ActionItem = memo(function ActionItem({ icon, label, danger, onClick }) {
  const color = danger ? 'var(--color-danger)' : T.t2;
  return (
    <button onClick={onClick}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: T.r6, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12.5, fontWeight: 450, color, fontFamily: 'var(--font-sans)', textAlign: 'left', transition: 'all .1s' }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? 'rgba(240,112,112,.07)' : T.bg3; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    ><span style={{ lineHeight: 0, opacity: .85, flexShrink: 0 }}>{icon}</span>{label}</button>
  );
});

const ActiveChip = memo(function ActiveChip({ label, onRemove }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 8px 2px 10px', borderRadius: T.r20, background: T.accm, border: `1px solid ${T.accb}`, fontSize: 11, fontWeight: 500, color: T.acc }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.acc, lineHeight: 0, padding: 1, opacity: .7 }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '.7'}><IcClose /></button>
    </span>
  );
});

/* ════════════════════════════════════════════════════════════════
   MODAL
   ════════════════════════════════════════════════════════════════ */
function Modal({ open, onClose, title, width = 520, children }) {
  const firstFocusRef = useRef(null);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);
  useEffect(() => {
    if (!open) return;
    const hk = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', hk);
    setTimeout(() => firstFocusRef.current?.focus(), 50);
    return () => document.removeEventListener('keydown', hk);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={title} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(6px)', animation: 'xd-modal-bg .16s ease' }}
    >
      <div onClick={e => e.stopPropagation()}
        style={{ background: T.bg1, border: `1px solid ${T.bd1}`, borderRadius: T.r16, width: '100%', maxWidth: width, maxHeight: 'calc(100dvh - 32px)', display: 'flex', flexDirection: 'column', boxShadow: T.shadowModal, animation: 'xd-modal-box .2s cubic-bezier(.22,1,.36,1)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${T.bd0}`, flexShrink: 0 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: T.t1, margin: 0 }}>{title}</h2>
          <IconBtn ref={firstFocusRef} onClick={onClose} title="Fermer"><IcClose /></IconBtn>
        </div>
        <div className="xd-scrollbar" style={{ padding: 20, overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({ onCancel, onConfirm, cancelLabel = 'Annuler', confirmLabel = 'Confirmer', loading = false }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 20, borderTop: `1px solid ${T.bd0}`, marginTop: 4 }}>
      <GhostBtn onClick={onCancel} disabled={loading}>{cancelLabel}</GhostBtn>
      <PrimaryBtn onClick={onConfirm} loading={loading}>{loading ? 'En cours…' : confirmLabel}</PrimaryBtn>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STAT CARDS
   ════════════════════════════════════════════════════════════════ */
const StatCard = memo(function StatCard({ value, label, accent, pct, sub }) {
  return (
    <div style={{ background: T.bg1, border: `1px solid ${T.bd0}`, borderRadius: T.r12, padding: '14px 16px', transition: 'border-color .15s, box-shadow .15s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.bd1; e.currentTarget.style.boxShadow = T.shadowDropdown; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.bd0; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: T.t1, letterSpacing: '-1px', lineHeight: 1 }}>{value}</span>
        {pct !== undefined && <span style={{ fontSize: 11, color: T.t3, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{pct}%</span>}
      </div>
      {pct !== undefined && (
        <div style={{ height: 2, background: T.bg3, borderRadius: 99, marginBottom: 8, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: accent, borderRadius: 99, width: `${pct}%`, transformOrigin: 'left', animation: 'xd-bar .7s cubic-bezier(.22,1,.36,1)' }} />
        </div>
      )}
      <div style={{ fontSize: 11.5, color: T.t3, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
        {pct !== undefined && <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, flexShrink: 0 }} />}
        {label}
      </div>
      {sub && <div style={{ marginTop: 6 }}>{sub}</div>}
    </div>
  );
});

const StatsHeader = memo(function StatsHeader({ docs, usedMB }) {
  const total = docs.length, shared = docs.filter(d => d.shared).length, crCount = docs.filter(d => d.source === 'meeting').length;
  const storagePct = Math.min(Math.round(usedMB / TOTAL_STORAGE_MB * 100), 100);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 10, marginBottom: 24 }} className="xd-stats-row" role="region" aria-label="Statistiques">
      <StatCard value={total}      label="Documents"      sub={<span style={{ color: T.t3, fontSize: 11, fontFamily: 'var(--font-mono)' }}>{usedMB.toFixed(1)} MB utilisés</span>} />
      <StatCard value={shared}     label="Partagés"       accent={T.acc} pct={total > 0 ? Math.round(shared / total * 100) : 0} />
      <StatCard value={crCount}    label="Comptes-rendus" accent={T.pur} pct={total > 0 ? Math.round(crCount / total * 100) : 0} />
      <StatCard value={storagePct} label="Stockage"       accent={storagePct > 80 ? 'var(--color-danger)' : T.acc} pct={storagePct} />
    </div>
  );
});

/* ════════════════════════════════════════════════════════════════
   FILTERS BAR
   ════════════════════════════════════════════════════════════════ */
function FiltersBar({ query, setQuery, catFilter, setCatFilter, accessFilter, setAccessFilter, typeFilter, setTypeFilter, sourceFilter, setSourceFilter, resetFilters, hasActiveFilters, activeCount }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="xd-filters-row" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }} role="search">
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 0 }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.t3, pointerEvents: 'none', lineHeight: 0 }} aria-hidden><IcSearch /></span>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un document, un auteur…" aria-label="Rechercher des documents"
            style={{ width: '100%', background: T.bg1, border: `1px solid ${T.bd0}`, borderRadius: T.r8, padding: '0 34px 0 35px', height: 34, color: T.t1, fontSize: 12.5, outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box', transition: 'border-color .13s, box-shadow .13s', caretColor: 'var(--color-warning)' }}
            onFocus={e => { e.target.style.borderColor = T.bd2; e.target.style.boxShadow = `0 0 0 3px ${T.accm}`; }}
            onBlur={e => { e.target.style.borderColor = T.bd0; e.target.style.boxShadow = 'none'; }}
          />
          {query && <button onClick={() => setQuery('')} aria-label="Effacer" style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.t3, lineHeight: 0, padding: 2 }}><IcClose /></button>}
        </div>
        <Dropdown label="Origine"   icon={<IcMeeting />} options={SOURCE_FILTERS} value={sourceFilter} onChange={setSourceFilter} />
        <Dropdown label="Catégorie" icon={<IcFilter />}  options={CAT_FILTERS}    value={catFilter}    onChange={setCatFilter}    />
        <Dropdown label="Accès"     icon={<IcLock />}    options={ACCESS_FILTERS} value={accessFilter} onChange={setAccessFilter}  />
        <Dropdown label="Type"      icon={<IcFile />}    options={TYPE_FILTERS}   value={typeFilter}   onChange={setTypeFilter}   />
        {hasActiveFilters && (
          <button onClick={resetFilters}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px', height: 34, borderRadius: T.r8, border: `1px solid ${T.bd0}`, background: 'transparent', color: T.t3, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all .13s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.color = T.t1; e.currentTarget.style.borderColor = T.bd1; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.t3; e.currentTarget.style.borderColor = T.bd0; }}
          ><IcClose /> Réinitialiser</button>
        )}
      </div>
      {hasActiveFilters && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }} role="status" aria-live="polite">
          {sourceFilter !== 'all' && <ActiveChip label={SOURCE_FILTERS.find(f => f.v === sourceFilter)?.l} onRemove={() => setSourceFilter('all')} />}
          {catFilter    !== 'all' && <ActiveChip label={CAT_FILTERS.find(f => f.v === catFilter)?.l}       onRemove={() => setCatFilter('all')}    />}
          {accessFilter !== 'all' && <ActiveChip label={ACCESS_FILTERS.find(f => f.v === accessFilter)?.l} onRemove={() => setAccessFilter('all')} />}
          {typeFilter   !== 'all' && <ActiveChip label={TYPE_FILTERS.find(f => f.v === typeFilter)?.l}     onRemove={() => setTypeFilter('all')}   />}
          {query !== ''           && <ActiveChip label={`"${query}"`}                                       onRemove={() => setQuery('')}           />}
          <span style={{ fontSize: 11, color: T.t3, marginLeft: 2 }}>{activeCount} résultat{activeCount !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MEETING BADGE
   ════════════════════════════════════════════════════════════════ */
function MeetingBadge({ meetingId, meetingTitle }) {
  const navigate = useNavigate();
  return (
    <button className="xd-meeting-badge"
      onClick={e => { e.stopPropagation(); navigate(`/meetings/${meetingId}`); }}
      title={`Réunion : ${meetingTitle || meetingId}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: T.r20, background: T.purb, border: `1px solid ${T.purr}`, fontSize: 11, fontWeight: 600, color: T.pur, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)' }}
    ><span style={{ lineHeight: 0 }}><IcMeeting /></span>Compte-rendu</button>
  );
}

/* ════════════════════════════════════════════════════════════════
   DOC CARD + SKELETON
   ════════════════════════════════════════════════════════════════ */
const DocCard = memo(function DocCard({ doc, onPreview, onDownload, onShare, onDelete, onClick, index }) {
  const c = T.fileColors[doc.type] || { fg: T.t3, bg: T.bg2, border: T.bd0 };
  const isMeeting = doc.source === 'meeting';
  return (
    <article className="xd-doc-card xd-card-enter" role="listitem" tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      style={{ background: T.bg1, border: `1px solid ${isMeeting ? T.purr : T.bd0}`, borderRadius: T.r12, padding: '15px 16px', position: 'relative', overflow: 'hidden', animationDelay: `${index * 30}ms`, minWidth: 0 }}
    >
      {isMeeting && <div style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', background: T.pur, borderRadius: '3px 0 0 3px' }} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: T.r8, flexShrink: 0, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileIcon type={doc.type} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: T.t1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</p>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', marginTop: 5 }}>
              <TypePill type={doc.type} />
              {doc.category && <Tag color={T.acc} bg={T.accm}>{doc.category}</Tag>}
              {isMeeting
                ? <MeetingBadge meetingId={doc.meetingId} meetingTitle={doc.meetingTitle} />
                : doc.visibility === 'organisation'
                  ? <Tag icon={<IcShare />} color="var(--color-success)" bg="var(--color-success-bg)">Organisation</Tag>
                  : doc.visibility === 'equipe'
                    ? <Tag icon={<IcShare />} color="var(--color-success)" bg="var(--color-success-bg)">Équipe</Tag>
                    : <Tag icon={<IcLock />} color={T.t3} bg={T.bg2}>Privé</Tag>
              }
            </div>
          </div>
        </div>
        <div onClick={e => e.stopPropagation()}>
          <DocActionMenu doc={doc} onPreview={() => onPreview(doc)} onDownload={() => onDownload(doc)} onShare={() => onShare(doc)} onDelete={() => onDelete(doc)} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, fontSize: 11, color: T.t3, flexWrap: 'wrap', alignItems: 'center', fontFamily: 'var(--font-mono)' }}>
        <span>{doc.size}</span><span style={{ opacity: .35 }}>·</span>
        <span style={{ fontFamily: 'var(--font-sans)' }}>{doc.date}</span><span style={{ opacity: .35 }}>·</span>
        <span style={{ fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 5 }}><Avatar name={doc.author} size={14} />{doc.author}</span>
      </div>
    </article>
  );
},
(prev, next) =>
  prev.doc.id         === next.doc.id         &&
  prev.doc.shared     === next.doc.shared      &&
  prev.doc.visibility === next.doc.visibility  &&
  prev.doc.name       === next.doc.name        &&
  prev.doc.source     === next.doc.source      &&
  prev.doc.category   === next.doc.category    &&
  prev.index          === next.index
);

// Skeleton affiché pendant le chargement des CRs
const DocCardSkeleton = memo(function DocCardSkeleton({ index }) {
  return (
    <div style={{
      background: T.bg1, border: `1px solid ${T.bd0}`,
      borderRadius: T.r12, padding: '15px 16px',
      animationDelay: `${index * 60}ms`,
    }} className="xd-card-enter">
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div className="xd-skeleton" style={{ width: 36, height: 36, borderRadius: T.r8, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="xd-skeleton" style={{ height: 13, width: '65%' }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <div className="xd-skeleton" style={{ height: 20, width: 44, borderRadius: 99 }} />
            <div className="xd-skeleton" style={{ height: 20, width: 80, borderRadius: 99 }} />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div className="xd-skeleton" style={{ height: 11, width: 30 }} />
        <div className="xd-skeleton" style={{ height: 11, width: 70 }} />
        <div className="xd-skeleton" style={{ height: 11, width: 80 }} />
      </div>
    </div>
  );
});

/* ════════════════════════════════════════════════════════════════
   ACTION MENU
   ════════════════════════════════════════════════════════════════ */
function DocActionMenu({ doc, onPreview, onDownload, onShare, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClick(ref, useCallback(() => setOpen(false), []));
  const vis = doc.visibility ?? (doc.shared ? 'equipe' : 'prive');
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <IconBtn onClick={() => setOpen(o => !o)} active={open} title="Actions"><IcDots /></IconBtn>
      {open && (
        <div role="menu" style={{ position: 'absolute', right: 0, top: 34, zIndex: 200, background: T.bg2, border: `1px solid ${T.bd1}`, borderRadius: T.r10, padding: 5, minWidth: 200, boxShadow: T.shadowDropdown, animation: 'xd-menu-pop .14s cubic-bezier(.22,1,.36,1)' }}>
          <ActionItem icon={<IcEye />}      label="Prévisualiser" onClick={() => { setOpen(false); onPreview();  }} />
          <ActionItem icon={<IcDownload />} label="Télécharger"   onClick={() => { setOpen(false); onDownload(); }} />
          {doc.source !== 'meeting' && (
            <ActionItem icon={<IcShare />}
              label={
                vis === 'organisation' ? "Restreindre à l'équipe"
                : vis === 'equipe'     ? "Élargir ou privatiser"
                : 'Partager'
              }
              onClick={() => { setOpen(false); onShare(); }} />
          )}
          <div style={{ height: 1, background: T.bd0, margin: '4px 0' }} />
          <ActionItem icon={<IcTrash />} label="Supprimer" danger onClick={() => { setOpen(false); onDelete(); }} />
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   UPLOAD MODAL
   ════════════════════════════════════════════════════════════════ */
function UploadModal({ open, onClose, onUpload }) {
  const fileRef = useRef(null);
  const [file, setFile]         = useState(null);
  const [nom, setNom]           = useState('');
  const [categorie, setCat]     = useState('');
  const [description, setDesc]  = useState('');
  const [visibilite, setVis]    = useState('prive');
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState(0);
  const nomId = useId(), catId = useId(), descId = useId();

  const reset = useCallback(() => { setFile(null); setNom(''); setCat(''); setDesc(''); setVis('prive'); setErrors({}); setLoading(false); setProgress(0); }, []);
  const handleClose = useCallback(() => { if (!loading) { reset(); onClose(); } }, [loading, reset, onClose]);

  const pickFile = useCallback(f => {
    const err = validateFile(f);
    if (err) { setErrors(e => ({ ...e, file: err })); return; }
    setFile(f); setNom(n => n || f.name.replace(/\.[^.]+$/, '')); setErrors(e => ({ ...e, file: null }));
  }, []);

  const handleDrop = useCallback(e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) pickFile(f); }, [pickFile]);

  const handleSubmit = useCallback(async () => {
    const errs = {};
    if (!file)      errs.file      = 'Veuillez sélectionner un fichier.';
    if (!categorie) errs.categorie = 'La catégorie est obligatoire.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setProgress(0);
    try {
      const doc = await uploadDocument(file, { nom: nom || file.name, categorie, visibilite }, pct => setProgress(pct));
      await onUpload(doc);
      reset(); onClose();
    } catch (err) {
      setErrors({ submit: err?.message || "Erreur lors de l'upload." });
      setLoading(false); setProgress(0);
    }
  }, [file, nom, categorie, visibilite, onUpload, reset, onClose]);

  return (
    <Modal open={open} onClose={handleClose} title="Uploader un document" width={640}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div role="button" tabIndex={0}
          onClick={() => !loading && fileRef.current?.click()}
          onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !loading) fileRef.current?.click(); }}
          onDragOver={e => { e.preventDefault(); if (!loading) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { if (!loading) handleDrop(e); }}
          style={{ border: `2px dashed ${dragging ? T.acc : errors.file ? 'var(--color-danger)' : T.accb}`, borderRadius: T.r12, padding: '28px 20px', textAlign: 'center', background: dragging ? T.accm : T.bg2, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all .15s' }}
        >
          <input ref={fileRef} type="file" hidden accept=".pdf,.docx,.xlsx,.png" onChange={e => e.target.files[0] && pickFile(e.target.files[0])} />
          <span style={{ lineHeight: 0, display: 'inline-block', color: T.acc, marginBottom: 10 }}><IcCloud /></span>
          {file
            ? <><p style={{ fontSize: 14, fontWeight: 500, color: T.t1, margin: '0 0 3px' }}>{file.name}</p><p style={{ fontSize: 12, color: T.t3, margin: 0 }}>{formatSize(file.size)}</p></>
            : <><p style={{ fontSize: 14, color: T.acc, fontWeight: 600, margin: '0 0 4px' }}>Cliquez ou glissez-déposez</p><p style={{ fontSize: 12, color: T.t3, margin: 0 }}>PDF, DOCX, XLSX, PNG — max {MAX_SIZE_MB} MB</p></>
          }
        </div>
        {errors.file && <p role="alert" style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: -10 }}>{errors.file}</p>}
        {loading && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.t3, marginBottom: 5 }}>
              <span>Upload du fichier en cours…</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{progress}%</span>
            </div>
            <div style={{ height: 4, background: T.bg3, borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: T.acc, width: `${progress}%`, borderRadius: 99, transition: 'width .2s ease' }} />
            </div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <FormLabel htmlFor={nomId}>Nom du document</FormLabel>
            <Field id={nomId} placeholder="ex. Rapport Q1 2026" value={nom} onChange={e => setNom(e.target.value)} disabled={loading} />
          </div>
          <div>
            <FormLabel htmlFor={catId} required>Catégorie</FormLabel>
            <Field as="select" id={catId} value={categorie} hasError={!!errors.categorie} onChange={e => { setCat(e.target.value); setErrors(er => ({ ...er, categorie: null })); }} disabled={loading}>
              <option value="">— Choisir —</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Field>
            {errors.categorie && <p role="alert" style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 4 }}>{errors.categorie}</p>}
          </div>
        </div>
        <div>
          <FormLabel htmlFor={descId} hint="(optionnel)">Description</FormLabel>
          <Field as="textarea" id={descId} placeholder="Décrivez brièvement le contenu…" value={description} onChange={e => setDesc(e.target.value)} maxLength={200} style={{ resize: 'none', height: 60 }} disabled={loading} />
        </div>
        <div>
          <FormLabel required>Visibilité</FormLabel>
          <div style={{ display: 'flex', gap: 8 }} role="radiogroup">
            {VIS_OPTIONS.map(opt => {
              const active  = visibilite === opt.id;
              const fgColor = active ? (opt.danger ? 'var(--color-danger)' : 'var(--color-success)') : T.t3;
              const bgColor = active ? (opt.danger ? 'rgba(220,38,38,.06)' : 'rgba(22,163,74,.06)') : 'transparent';
              const bdColor = active ? (opt.danger ? 'rgba(220,38,38,.3)' : 'rgba(22,163,74,.3)') : T.bd0;
              const IcoComp = opt.iconKey === 'lock' ? IcLock : IcShare;
              return (
                <div key={opt.id} role="radio" aria-checked={active} tabIndex={loading ? -1 : 0}
                  onClick={() => !loading && setVis(opt.id)}
                  onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !loading) setVis(opt.id); }}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${bdColor}`, borderRadius: T.r8, padding: '10px 12px', cursor: loading ? 'not-allowed' : 'pointer', background: bgColor, transition: 'all .15s', opacity: loading ? .6 : 1 }}
                >
                  <span style={{ color: fgColor, lineHeight: 0 }}><IcoComp /></span>
                  <div><p style={{ fontSize: 13, fontWeight: 500, color: T.t1, margin: 0 }}>{opt.label}</p><p style={{ fontSize: 11, color: T.t3, margin: 0 }}>{opt.sub}</p></div>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: T.t3, marginTop: 6 }}>Modifiable après l'upload.</p>
        </div>
        {errors.submit && <p role="alert" style={{ fontSize: 11, color: 'var(--color-danger)', textAlign: 'center' }}>{errors.submit}</p>}
        <ModalFooter onCancel={handleClose} onConfirm={handleSubmit} cancelLabel="Annuler" confirmLabel="Uploader" loading={loading} />
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   DELETE MODAL
   ════════════════════════════════════════════════════════════════ */
function DeleteModal({ doc, onClose, onConfirm, loading }) {
  return (
    <Modal open={!!doc} onClose={onClose} title="Supprimer le document" width={460}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ padding: '12px 14px', background: 'rgba(240,112,112,.07)', border: '1px solid rgba(240,112,112,.18)', borderRadius: T.r10 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-danger)', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 8 }}><IcWarn /> {doc?.name}</p>
          <p style={{ fontSize: 12, color: T.t3, lineHeight: 1.6, margin: 0 }}>Action irréversible. Le fichier sera supprimé de S3 et de la base de données.</p>
        </div>
        <ModalFooter onCancel={onClose} onConfirm={onConfirm} cancelLabel="Conserver" confirmLabel="Supprimer" loading={loading} />
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   PREVIEW
   ════════════════════════════════════════════════════════════════ */
const CDN = {
  mammoth:     'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js',
  xlsx:        'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  pdfjs:       'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  pdfjsWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
};

function useFilePreview(doc) {
  const [status, setStatus]    = useState('idle');
  const [content, setContent]  = useState(null);
  const [totalPages, setTotal] = useState(1);
  const pdfRef = useRef(null);
  const isLocal = doc?.rawFile;
  const { loaded: mammothLoaded } = useScript(isLocal && doc?.type === 'docx' ? CDN.mammoth : null);
  const { loaded: xlsxLoaded    } = useScript(isLocal && doc?.type === 'xlsx' ? CDN.xlsx    : null);
  const { loaded: pdfjsLoaded   } = useScript(isLocal && doc?.type === 'pdf'  ? CDN.pdfjs   : null);

  useEffect(() => {
    if (!doc?.rawFile) { setStatus('idle'); setContent(null); setTotal(1); return; }
    const file = doc.rawFile; let cancelled = false;
    async function load() {
      setStatus('loading'); setContent(null); setTotal(1);
      try {
        if (doc.type === 'png') { const url = URL.createObjectURL(file); if (!cancelled) { setStatus('done'); setContent({ kind: 'image', url }); } return; }
        if (doc.type === 'docx' && mammothLoaded) { const buf = await file.arrayBuffer(); const r = await window.mammoth.convertToHtml({ arrayBuffer: buf }); if (!cancelled) { setStatus('done'); setContent({ kind: 'html', html: r.value }); } return; }
        if (doc.type === 'xlsx' && xlsxLoaded) { const buf = await file.arrayBuffer(); const wb = window.XLSX.read(buf, { type: 'array' }); const ws = wb.Sheets[wb.SheetNames[0]]; const html = window.XLSX.utils.sheet_to_html(ws, { editable: false }); if (!cancelled) { setStatus('done'); setContent({ kind: 'html', html }); } return; }
        if (doc.type === 'pdf' && pdfjsLoaded) { window.pdfjsLib.GlobalWorkerOptions.workerSrc = CDN.pdfjsWorker; const buf = await file.arrayBuffer(); const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise; if (!cancelled) { pdfRef.current = pdf; setStatus('done'); setContent({ kind: 'pdf' }); setTotal(pdf.numPages); } return; }
        if (!cancelled) setStatus('unsupported');
      } catch { if (!cancelled) setStatus('error'); }
    }
    load();
    return () => { cancelled = true; };
  }, [doc?.id, mammothLoaded, xlsxLoaded, pdfjsLoaded]);
  return { status, content, totalPages, pdfRef };
}

function PdfCanvas({ pdfRef, page }) {
  const canvasRef = useRef(null), renderRef = useRef(null);
  useEffect(() => {
    if (!pdfRef.current || !canvasRef.current) return;
    renderRef.current?.cancel(); renderRef.current = null;
    pdfRef.current.getPage(page).then(p => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d'), vp = p.getViewport({ scale: 1.4 });
      canvasRef.current.width = vp.width; canvasRef.current.height = vp.height;
      const task = p.render({ canvasContext: ctx, viewport: vp }); renderRef.current = task;
      task.promise.catch(e => { if (e?.name !== 'RenderingCancelledException') console.error(e); });
    });
  }, [pdfRef, page]);
  return <canvas ref={canvasRef} style={{ maxWidth: '100%', display: 'block', margin: '0 auto' }} />;
}

function PreviewSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 20, width: '100%' }}>
      {[100, 80, 90, 60, 85].map((w, i) => <div key={i} className="xd-skeleton" style={{ height: 14, width: `${w}%` }} />)}
    </div>
  );
}

function CRPreviewPanel({ doc }) {
  return (
    <div style={{ padding: '20px 24px', overflowY: 'auto', height: '100%' }}>
      <section style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: T.t3, margin: '0 0 8px' }}>Résumé</h3>
        <p style={{ fontSize: 13.5, color: T.t1, lineHeight: 1.75, margin: 0 }}>{doc.summary ?? <span style={{ color: T.t3, fontStyle: 'italic' }}>Aucun résumé disponible.</span>}</p>
      </section>
      {doc.decisions?.length > 0 && (
        <section style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: T.t3, margin: '0 0 8px' }}>Décisions ({doc.decisions.length})</h3>
          <ol style={{ margin: 0, paddingLeft: 18 }}>{doc.decisions.map((d, i) => <li key={d.id ?? i} style={{ fontSize: 13, color: T.t2, lineHeight: 1.7, marginBottom: 4 }}>{d.text}</li>)}</ol>
        </section>
      )}
      {doc.actions?.length > 0 && (
        <section>
          <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: T.t3, margin: '0 0 8px' }}>Actions ({doc.actions.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {doc.actions.map((a, i) => (
              <div key={a.id ?? i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: T.bg2, borderRadius: T.r8, border: `1px solid ${T.bd0}` }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.acc, flexShrink: 0, marginTop: 6 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: T.t1, margin: 0 }}>{a.title}</p>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 11, color: T.t3 }}>
                    {a.assignee && <span>👤 {a.assignee}</span>}
                    {a.due      && <span>📅 {a.due}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function S3Preview({ fetchUrl, docName, docType }) {
  const [url, setUrl]         = useState(null);
  const [error, setError]     = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    getSignedUrl(fetchUrl)
      .then(signedUrl => { if (!cancelled) { setUrl(signedUrl); setLoading(false); } })
      .catch(()       => { if (!cancelled) { setError(true);    setLoading(false); } });
    return () => { cancelled = true; };
  }, [fetchUrl]);
  if (loading) return <PreviewSkeleton />;
  if (error) return <div style={{ textAlign: 'center', color: T.t3, padding: 24 }}><p style={{ fontSize: 36 }}>⚠️</p><p style={{ fontSize: 13, marginTop: 10 }}>Impossible de charger le fichier.</p></div>;
  const src = docType === 'docx' ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true` : url;
  return <iframe src={src} title={docName} style={{ width: '100%', height: '100%', border: 'none', borderRadius: T.r8 }} sandbox="allow-scripts allow-same-origin allow-popups" />;
}

function PreviewModal({ doc, open, onClose, onDownload, onShare }) {
  const [page, setPage] = useState(1);
  const { status, content, totalPages, pdfRef } = useFilePreview(doc);
  const c = T.fileColors[doc?.type] || { fg: T.t3, bg: T.bg2 };
  const isMeeting = doc?.source === 'meeting';
  useEffect(() => { setPage(1); }, [doc?.id]);
  if (!doc) return null;

  function getDownloadEndpoint(d) {
    if (d._fromS3  && d.hasFile)  return `/api/reunions/${d.meetingId}/compte-rendu/download`;
    if (d._fromApi && d.has_file) return `/api/documents/${d.apiId}/download`;
    return null;
  }

  function renderContent() {
    if (doc._fromS3 && !doc.hasFile) return <CRPreviewPanel doc={doc} />;
    const endpoint = getDownloadEndpoint(doc);
    if (endpoint) return <S3Preview fetchUrl={endpoint} docName={doc.name} docType={doc.type} />;
    if (status === 'loading') return <PreviewSkeleton />;
    if (status === 'error') return <div style={{ textAlign: 'center', color: T.t3 }}><p style={{ fontSize: 36 }}>⚠️</p><p style={{ fontSize: 13, marginTop: 10 }}>Impossible de charger l'aperçu.</p></div>;
    if (status === 'done' && content) {
      if (content.kind === 'image') return <img src={content.url} alt={doc.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 6 }} />;
      if (content.kind === 'html')  return <div style={{ width: '100%', height: '100%', overflow: 'auto', padding: '16px 20px' }} dangerouslySetInnerHTML={{ __html: content.html }} />;
      if (content.kind === 'pdf')   return <div style={{ width: '100%', height: '100%', overflow: 'auto', padding: 8 }}><PdfCanvas pdfRef={pdfRef} page={page} /></div>;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, height: '100%', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: T.r12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileIcon type={doc.type} /></div>
        <p style={{ fontSize: 15, fontWeight: 600, color: T.t1, margin: '0 0 4px' }}>{doc.name}</p>
        <p style={{ fontSize: 12, color: T.t3, margin: 0 }}>Aperçu disponible uniquement pour les fichiers uploadés dans cette session.</p>
      </div>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={`Aperçu — ${doc.name}`} width={900}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '8px 12px', background: T.bg2, borderRadius: T.r8, fontSize: 12, color: T.t3 }}>
          <Avatar name={doc.author} size={18} />
          <span style={{ marginLeft: 2 }}>{doc.author}</span>
          <span style={{ opacity: .4 }}>·</span><span>{doc.size}</span>
          <span style={{ opacity: .4 }}>·</span><span>{doc.date}</span>
          <span style={{ opacity: .4 }}>·</span><TypePill type={doc.type} />
          <div style={{ marginLeft: 'auto' }}>
            {isMeeting ? <MeetingBadge meetingId={doc.meetingId} meetingTitle={doc.meetingTitle} />
              : doc.visibility === 'organisation'
                ? <Tag icon={<IcShare />} color="var(--color-success)" bg="var(--color-success-bg)">Organisation</Tag>
                : doc.visibility === 'equipe'
                  ? <Tag icon={<IcShare />} color="var(--color-success)" bg="var(--color-success-bg)">Équipe</Tag>
                  : <Tag icon={<IcLock />} color={T.t3} bg={T.bg2}>Privé</Tag>}
          </div>
        </div>
        <div style={{ height: 400, border: `1px solid ${T.bd0}`, borderRadius: T.r12, overflow: 'hidden', background: T.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {renderContent()}
        </div>
        {doc.type === 'pdf' && totalPages > 1 && status === 'done' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <GhostBtn small onClick={() => setPage(p => p - 1)} disabled={page <= 1}>◀</GhostBtn>
            <span style={{ fontSize: 12, color: T.t3, minWidth: 80, textAlign: 'center' }} aria-live="polite">Page {page} / {totalPages}</span>
            <GhostBtn small onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>▶</GhostBtn>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {!isMeeting && <GhostBtn onClick={() => { onShare(doc); onClose(); }}>
            {doc.visibility === 'organisation' ? "Restreindre" : doc.visibility === 'equipe' ? "Modifier l'accès" : 'Partager'}
          </GhostBtn>}
          <GhostBtn onClick={() => onDownload(doc)}>Télécharger</GhostBtn>
          <PrimaryBtn onClick={onClose}>Fermer</PrimaryBtn>
        </div>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   EMPTY STATE + STORAGE BAR
   ════════════════════════════════════════════════════════════════ */
function EmptyState({ hasQuery }) {
  return (
    <div role="status" style={{ textAlign: 'center', padding: '72px 24px', background: T.bg1, borderRadius: T.r16, border: `1px solid ${T.bd0}` }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: T.accm, border: `1px solid ${T.accb}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}><span style={{ color: T.acc, lineHeight: 0 }}><IcCloud /></span></div>
      <p style={{ fontSize: 14, fontWeight: 600, color: T.t1, marginBottom: 6 }}>{hasQuery ? 'Aucun résultat' : 'Aucun document'}</p>
      <p style={{ fontSize: 13, color: T.t3, maxWidth: 300, margin: '0 auto', lineHeight: 1.7 }}>{hasQuery ? 'Modifiez vos filtres ou votre recherche.' : 'Uploadez votre premier fichier.'}</p>
    </div>
  );
}

const StorageBar = memo(function StorageBar({ usedMB }) {
  const pct   = Math.min(Math.round(usedMB / TOTAL_STORAGE_MB * 100), 100);
  const color = pct > 80 ? 'var(--color-danger)' : T.acc;
  const label = TOTAL_STORAGE_MB >= 1024 ? `${TOTAL_STORAGE_MB / 1024} GB` : `${TOTAL_STORAGE_MB} MB`;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: T.bg1, borderRadius: T.r12, border: `1px solid ${T.bd0}` }} role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ color: T.acc, lineHeight: 0, flexShrink: 0 }} aria-hidden><IcCloud /></span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: T.t3 }}>Stockage utilisé</span>
          <span style={{ fontSize: 12, color, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{usedMB.toFixed(1)} MB / {label}</span>
        </div>
        <div style={{ height: 6, background: T.bg3, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .4s ease', animation: 'xd-bar .7s cubic-bezier(.22,1,.36,1)' }} />
        </div>
      </div>
      <span style={{ fontSize: 12, color: T.t3, whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>{pct}%</span>
    </div>
  );
});

/* ════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ════════════════════════════════════════════════════════════════ */
export default function DocumentsPage() {
  const { addToast }                                          = useNotif();
  const { docs, addDocument, removeDocument, updateDocument } = useDocumentsCtx();

  useLibraryDocuments({ addDocument });

  // loading = true pendant la requête /api/reunions → affiche les skeletons
  const { loading: meetingLoading } = useMeetingDocuments({
    addDocument,
    fetchOptions: { credentials: 'include' },
  });

  const { query, setQuery, catFilter, setCatFilter, accessFilter, setAccessFilter, typeFilter, setTypeFilter, sourceFilter, setSourceFilter, filtered, resetFilters, hasActiveFilters } = useDocFilters(docs);

  const [uploadModal,   setUploadModal]   = useState(false);
  const [deleteDoc,     setDeleteDoc]     = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [lastPreview, setLastPreview] = useState(null);
  const openPreview  = useCallback(doc => { setLastPreview(doc); setPreviewOpen(true);  }, []);
  const closePreview = useCallback(()  => setPreviewOpen(false), []);

  const usedMB = useMemo(() => docs.reduce((acc, d) => acc + parseMB(d.size), 0), [docs]);

  const handleShare = useCallback(async doc => {
    const cycle   = { prive: 'equipe', equipe: 'organisation', organisation: 'prive' };
    const current = doc.visibility ?? (doc.shared ? 'equipe' : 'prive');
    const newVis  = cycle[current] ?? 'equipe';
    const toastMessages = {
      equipe:       "Partagé avec l'équipe.",
      organisation: "Partagé avec toute l'organisation.",
      prive:        'Document mis en privé.',
    };
    updateDocument(doc.id, { shared: newVis !== 'prive', visibility: newVis });
    if (doc._fromApi && doc.apiId) {
      try {
        await patchDocument(doc.apiId, { visibilite: newVis });
        addToast(toastMessages[newVis], 'success');
      } catch {
        updateDocument(doc.id, { shared: doc.shared, visibility: current });
        addToast('Impossible de modifier la visibilité.', 'error');
      }
    } else {
      addToast(toastMessages[newVis], 'success');
    }
  }, [updateDocument, addToast]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteDoc) return;
    setDeleteLoading(true);
    try {
      if (deleteDoc._fromApi && deleteDoc.apiId) await deleteDocument(deleteDoc.apiId);
      removeDocument(deleteDoc.id);
      if (lastPreview?.id === deleteDoc.id) { setPreviewOpen(false); setLastPreview(null); }
      addToast('Document supprimé.', 'warning');
      setDeleteDoc(null);
    } catch {
      addToast('Impossible de supprimer le document.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteDoc, removeDocument, lastPreview, addToast]);

  const handleDownload = useCallback(async doc => {
    let endpoint = null;
    if (doc._fromS3  && doc.hasFile)  endpoint = `/api/reunions/${doc.meetingId}/compte-rendu/download`;
    if (doc._fromApi && doc.has_file) endpoint = `/api/documents/${doc.apiId}/download`;
    if (endpoint) {
      try {
        const url = await getSignedUrl(endpoint);
        window.open(url, '_blank', 'noopener,noreferrer');
        addToast(`Téléchargement de « ${doc.name} »…`, 'success');
      } catch {
        addToast('Impossible de générer le lien de téléchargement.', 'error');
      }
      return;
    }
    if (doc._fromS3 && !doc.hasFile) {
      exportCRtxt(doc);
      addToast(`Export texte de « ${doc.name} » prêt.`, 'info');
      return;
    }
    addToast(`Téléchargement de « ${doc.name} »…`, 'info');
  }, [addToast]);

  const handleUpload = useCallback(async doc => {
    addDocument(doc);
    addToast('Document uploadé et enregistré sur S3 !', 'success');
  }, [addDocument, addToast]);

  return (
    <div className="xd-page xd-page-enter" style={{ padding: '0 2px', maxWidth: '100%', overflowX: 'hidden' }}>

      <header className="xd-header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.t1, letterSpacing: '-.6px', marginBottom: 4, fontFamily: 'var(--font-sans)' }}>Documents</h1>
          <p style={{ fontSize: 13, color: T.t3 }} aria-live="polite">{docs.length} fichier{docs.length !== 1 ? 's' : ''} · {usedMB.toFixed(1)} MB utilisés</p>
        </div>
        <PrimaryBtn onClick={() => setUploadModal(true)}><IcPlus /> Uploader un fichier</PrimaryBtn>
      </header>

      <StatsHeader docs={docs} usedMB={usedMB} />

      <FiltersBar
        query={query} setQuery={setQuery} catFilter={catFilter} setCatFilter={setCatFilter}
        accessFilter={accessFilter} setAccessFilter={setAccessFilter} typeFilter={typeFilter} setTypeFilter={setTypeFilter}
        sourceFilter={sourceFilter} setSourceFilter={setSourceFilter}
        resetFilters={resetFilters} hasActiveFilters={hasActiveFilters} activeCount={filtered.length}
      />

      {/* EmptyState uniquement si plus aucun chargement en cours */}
      {filtered.length === 0 && !meetingLoading
        ? <EmptyState hasQuery={hasActiveFilters} />
        : (
          <div className="xd-grid" style={{ marginBottom: 18 }} role="list" aria-label="Liste des documents">
            {filtered.map((doc, i) => (
              <DocCard key={doc.id} doc={doc} index={i}
                onClick={() => openPreview(doc)}
                onPreview={openPreview} onDownload={handleDownload}
                onShare={handleShare}  onDelete={setDeleteDoc}
              />
            ))}
            {/* Skeletons pendant le chargement des CRs */}
            {meetingLoading && [0, 1, 2].map(i => (
              <DocCardSkeleton key={`skel-${i}`} index={i} />
            ))}
          </div>
        )
      }

      <StorageBar usedMB={usedMB} />

      <UploadModal open={uploadModal} onClose={() => setUploadModal(false)} onUpload={handleUpload} />
      <PreviewModal doc={lastPreview} open={previewOpen} onClose={closePreview} onDownload={handleDownload} onShare={handleShare} />
      <DeleteModal doc={deleteDoc} onClose={() => setDeleteDoc(null)} onConfirm={handleDeleteConfirm} loading={deleteLoading} />
    </div>
  );
}