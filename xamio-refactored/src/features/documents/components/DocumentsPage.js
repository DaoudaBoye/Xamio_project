import React, { useState, useRef } from 'react';
import { SectionHeader, Badge, SearchBar, Modal, Button } from '../../../components/ui/index';
import Icon from '../../../components/ui/Icon';
import { useNotif } from '../../../context/NotifContext';
import { documents as initialDocs } from '../../../data/mockData';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────
const TYPE_ICONS  = { pdf: '📄', xlsx: '📊', fig: '🎨', docx: '📝', png: '🖼️', default: '📁' };
const TYPE_COLORS = { pdf: 'red', xlsx: 'green', fig: 'purple', docx: 'blue', png: 'blue' };

const CATEGORIES = ['Commercial', 'Technique', 'Stratégie', 'Design', 'Juridique', 'Finance', 'Support'];

const ACCEPTED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
];
const MAX_SIZE_MB      = 50;
const TOTAL_STORAGE_MB = 1024;

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────────────────────────────────────
function parseMB(sizeStr) {
  const n = parseFloat(sizeStr);
  if (isNaN(n)) return 0;
  return sizeStr.includes('MB') ? n : n / 1024;
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file) {
  if (!ACCEPTED_MIME.includes(file.type))
    return 'Format non supporté. Utilisez PDF, DOCX, XLSX ou PNG.';
  if (file.size > MAX_SIZE_MB * 1024 * 1024)
    return `Fichier trop lourd (max ${MAX_SIZE_MB} MB).`;
  return null;
}

function getExtension(filename) {
  return filename?.split('.').pop()?.toLowerCase() || 'default';
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles partagés
// ─────────────────────────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  fontSize: 13,
  border: '0.5px solid var(--color-border)',
  borderRadius: 8,
  background: 'var(--color-background-primary)',
  color: 'var(--color-text)',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--color-text-muted)',
  marginBottom: 5,
};

const errorStyle = {
  fontSize: 11,
  color: 'var(--color-error, #dc2626)',
  marginTop: 4,
};

// ─────────────────────────────────────────────────────────────────────────────
// Composant UploadModal
// ─────────────────────────────────────────────────────────────────────────────
function UploadModal({ open, onClose, onUpload }) {
  const fileRef = useRef(null);

  const [file,        setFile]     = useState(null);
  const [nom,         setNom]      = useState('');
  const [categorie,   setCat]      = useState('');
  const [description, setDesc]     = useState('');
  const [visibilite,  setVis]      = useState('prive');
  const [dragging,    setDragging] = useState(false);
  const [errors,      setErrors]   = useState({});
  const [loading,     setLoading]  = useState(false);

  function handleClose() {
    setFile(null); setNom(''); setCat('');
    setDesc(''); setVis('prive'); setErrors({}); setLoading(false);
    onClose();
  }

  function pickFile(f) {
    const err = validateFile(f);
    if (err) { setErrors(e => ({ ...e, file: err })); return; }
    setFile(f);
    if (!nom) setNom(f.name.replace(/\.[^.]+$/, ''));
    setErrors(e => ({ ...e, file: null }));
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  }

  function validate() {
    const errs = {};
    if (!file)      errs.file      = 'Veuillez sélectionner un fichier.';
    if (!categorie) errs.categorie = 'La catégorie est obligatoire.';
    return errs;
  }

  async function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file',        file);
      formData.append('nom',         nom || file.name);
      formData.append('categorie',   categorie);
      formData.append('description', description);
      formData.append('visibilite',  visibilite);
      // Passe le fichier brut pour la prévisualisation PNG
      formData._rawFile = file;

      await onUpload(formData);
      handleClose();
    } catch (err) {
      setErrors({ submit: err?.message || "Erreur lors de l'upload." });
    } finally {
      setLoading(false);
    }
  }

  const visOptions = [
    { id: 'prive',   label: 'Privé',   sub: 'Moi uniquement', icon: 'lock'  },
    { id: 'partage', label: 'Partagé', sub: "Toute l'équipe", icon: 'share' },
  ];

  return (
 <Modal
  open={open}
  onClose={handleClose}
  title="Uploader un document"
  style={{
    width: '900px',         // largeur augmentée pour grand écran
    maxWidth: '95vw',       // responsive sur petits écrans
    maxHeight: '90vh',      // limite la hauteur de la fenêtre
    padding: '24px',        // padding intérieur
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center', // centre verticalement
    overflow: 'hidden',       // empêche overflow du modal
  }}
>
  {/* Scroll interne si le contenu dépasse */}
  <div style={{ 
    overflowY: 'auto', 
    paddingRight: 8,   // petit padding pour éviter que le scroll cache le contenu
    display: 'flex', 
    flexDirection: 'column', 
    gap: 16 
  }}>

    {/* Zone de dépôt */}
    <div
      onClick={() => fileRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      style={{
        border: `2px dashed ${
          dragging    ? 'var(--color-accent)' :
          errors.file ? 'var(--color-error, #dc2626)' :
          'var(--color-accent-border)'}`,
        borderRadius: 12,
        padding: '28px 20px',
        textAlign: 'center',
        background: dragging ? 'var(--color-accent-bg)' : 'var(--color-surface, var(--color-background-secondary))',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <input
        ref={fileRef}
        type="file"
        hidden
        accept=".pdf,.docx,.xlsx,.png"
        onChange={e => e.target.files[0] && pickFile(e.target.files[0])}
      />
      <Icon name="cloud" size={28} color="var(--color-accent)" style={{ margin: '0 auto 8px' }} />
      {file ? (
        <>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>{file.name}</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3 }}>{formatSize(file.size)}</p>
        </>
      ) : (
        <>
          <p style={{ fontSize: 14, color: 'var(--color-accent)', fontWeight: 600 }}>Cliquez ou glissez-déposez</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>PDF, DOCX, XLSX, PNG — max 50 MB</p>
        </>
      )}
    </div>
    {errors.file && <p style={errorStyle}>{errors.file}</p>}

    {/* Nom + Catégorie */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <div>
        <label style={labelStyle}>Nom du document</label>
        <input
          style={inputStyle}
          placeholder="ex. Rapport Q1 2026"
          value={nom}
          onChange={e => setNom(e.target.value)}
        />
      </div>
      <div>
        <label style={labelStyle}>
          Catégorie <span style={{ color: 'var(--color-error, #dc2626)' }}>*</span>
        </label>
        <select
          style={{
            ...inputStyle,
            borderColor: errors.categorie ? 'var(--color-error, #dc2626)' : undefined,
          }}
          value={categorie}
          onChange={e => { setCat(e.target.value); setErrors(er => ({ ...er, categorie: null })); }}
        >
          <option value="">— Choisir —</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {errors.categorie && <p style={errorStyle}>{errors.categorie}</p>}
      </div>
    </div>

    {/* Description */}
    <div>
      <label style={labelStyle}>
        Description{' '}
        <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(optionnel)</span>
      </label>
      <textarea
        style={{ ...inputStyle, resize: 'none', height: 60 }}
        placeholder="Décrivez brièvement le contenu…"
        value={description}
        onChange={e => setDesc(e.target.value)}
        maxLength={200}
      />
    </div>

    {/* Visibilité */}
    <div>
      <label style={labelStyle}>
        Visibilité <span style={{ color: 'var(--color-error, #dc2626)' }}>*</span>
        <span style={{
          marginLeft: 8, fontSize: 10, fontWeight: 400,
          background: 'var(--color-error-bg, #fef2f2)',
          color: 'var(--color-error, #dc2626)',
          padding: '1px 6px', borderRadius: 20,
        }}>
          Privé par défaut
        </span>
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        {visOptions.map(opt => {
          const active    = visibilite === opt.id;
          const isPrivate = opt.id === 'prive';
          return (
            <div
              key={opt.id}
              onClick={() => setVis(opt.id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                border: `0.5px solid ${active
                  ? isPrivate ? 'var(--color-error, #dc2626)' : 'var(--color-success, #16a34a)'
                  : 'var(--color-border)'}`,
                borderRadius: 8, padding: '10px 12px', cursor: 'pointer',
                background: active
                  ? isPrivate ? 'var(--color-error-bg, #fef2f2)' : 'var(--color-success-bg, #f0fdf4)'
                  : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              <Icon
                name={opt.icon}
                size={16}
                color={active
                  ? isPrivate ? 'var(--color-error, #dc2626)' : 'var(--color-success, #16a34a)'
                  : 'var(--color-text-muted)'}
              />
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', margin: 0 }}>{opt.label}</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>{opt.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6 }}>
        Vous pouvez modifier la visibilité après l'upload.
      </p>
    </div>

    {/* Erreur globale */}
    {errors.submit && (
      <p style={{ ...errorStyle, textAlign: 'center' }}>{errors.submit}</p>
    )}

    {/* Actions */}
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
      <Button variant="ghost" onClick={handleClose} disabled={loading}>
        Annuler
      </Button>
      <Button variant="primary" icon="cloud" onClick={handleSubmit} disabled={loading}>
        {loading ? 'Upload en cours…' : 'Uploader'}
      </Button>
    </div>

  </div>
</Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chargement dynamique des librairies CDN (une seule fois)
// ─────────────────────────────────────────────────────────────────────────────
function loadScript(src, globalKey) {
  return new Promise((resolve, reject) => {
    if (window[globalKey]) { resolve(window[globalKey]); return; }
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load',  () => resolve(window[globalKey]));
      existing.addEventListener('error', reject);
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.onload  = () => resolve(window[globalKey]);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook : convertit un File en contenu prévisualisable
// ─────────────────────────────────────────────────────────────────────────────
function useFilePreview(doc) {
  const [state, setState] = useState({ status: 'idle', content: null, totalPages: 1 });
  const canvasRef = useRef(null);
  const pdfRef    = useRef(null); // instance PDF.js courante

  React.useEffect(() => {
    if (!doc?.rawFile) { setState({ status: 'idle', content: null, totalPages: 1 }); return; }

    setState({ status: 'loading', content: null, totalPages: 1 });
    const file = doc.rawFile;
    const type = doc.type;

    // ── PNG ──────────────────────────────────────────────────────────────────
    if (type === 'png') {
      const url = URL.createObjectURL(file);
      setState({ status: 'done', content: { kind: 'image', url }, totalPages: 1 });
      return () => URL.revokeObjectURL(url);
    }

    // ── DOCX (mammoth.js) ────────────────────────────────────────────────────
    if (type === 'docx') {
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js', 'mammoth')
        .then(mammoth => file.arrayBuffer())
        .then(buf => window.mammoth.convertToHtml({ arrayBuffer: buf }))
        .then(result => setState({
          status: 'done',
          content: { kind: 'html', html: result.value },
          totalPages: 1,
        }))
        .catch(() => setState({ status: 'error', content: null, totalPages: 1 }));
      return;
    }

    // ── XLSX (SheetJS) ───────────────────────────────────────────────────────
    if (type === 'xlsx') {
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'XLSX')
        .then(() => file.arrayBuffer())
        .then(buf => {
          const wb   = window.XLSX.read(buf, { type: 'array' });
          const ws   = wb.Sheets[wb.SheetNames[0]];
          const html = window.XLSX.utils.sheet_to_html(ws, { editable: false });
          setState({ status: 'done', content: { kind: 'html', html }, totalPages: 1 });
        })
        .catch(() => setState({ status: 'error', content: null, totalPages: 1 }));
      return;
    }

    // ── PDF (PDF.js) ─────────────────────────────────────────────────────────
    if (type === 'pdf') {
      let cancelled = false;
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', 'pdfjsLib')
        .then(() => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          return file.arrayBuffer();
        })
        .then(buf => window.pdfjsLib.getDocument({ data: buf }).promise)
        .then(pdf => {
          if (cancelled) return;
          pdfRef.current = pdf;
          setState({ status: 'done', content: { kind: 'pdf' }, totalPages: pdf.numPages });
        })
        .catch(() => setState({ status: 'error', content: null, totalPages: 1 }));
      return () => { cancelled = true; };
    }

    setState({ status: 'unsupported', content: null, totalPages: 1 });
  }, [doc?.id]);

  return { state, canvasRef, pdfRef };
}

// ─────────────────────────────────────────────────────────────────────────────
// Rendu PDF sur canvas
// ─────────────────────────────────────────────────────────────────────────────
function PdfCanvas({ pdfRef, page }) {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  React.useEffect(() => {
    if (!pdfRef.current || !canvasRef.current) return;

    // Annule le rendu précédent si encore en cours
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    pdfRef.current.getPage(page).then(pdfPage => {
      const canvas  = canvasRef.current;
      if (!canvas) return;
      const ctx     = canvas.getContext('2d');
      const vp      = pdfPage.getViewport({ scale: 1.4 });
      canvas.width  = vp.width;
      canvas.height = vp.height;
      const task = pdfPage.render({ canvasContext: ctx, viewport: vp });
      renderTaskRef.current = task;
      task.promise.catch(err => {
        if (err?.name !== 'RenderingCancelledException') console.error(err);
      });
    });
  }, [pdfRef, page]);

  return (
    <canvas
      ref={canvasRef}
      style={{ maxWidth: '100%', display: 'block', margin: '0 auto' }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant PreviewModal
// ─────────────────────────────────────────────────────────────────────────────
function PreviewModal({ doc, onClose, onDownload, onShare }) {
  const [page, setPage] = useState(1);
  const { state, pdfRef } = useFilePreview(doc);

  React.useEffect(() => { setPage(1); }, [doc?.id]);

  if (!doc) return null;

  const { status, content, totalPages } = state;
  const isPdf = doc.type === 'pdf';

  // ── Zone de contenu ──────────────────────────────────────────────────────
  const renderContent = () => {
    if (status === 'loading') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--color-text-muted)' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '3px solid var(--color-border)',
            borderTopColor: 'var(--color-accent)',
            animation: 'spin 0.7s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: 13 }}>Chargement de l'aperçu…</span>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <span style={{ fontSize: 40 }}>⚠️</span>
          <p style={{ fontSize: 13, marginTop: 10 }}>Impossible de charger l'aperçu.</p>
        </div>
      );
    }

    if (status === 'done' && content) {
      // Image PNG
      if (content.kind === 'image') {
        return (
          <img
            src={content.url}
            alt={doc.name}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 6 }}
          />
        );
      }

      // HTML (DOCX converti par mammoth, ou XLSX converti par SheetJS)
      if (content.kind === 'html') {
        return (
          <div
            style={{ width: '100%', height: '100%', overflow: 'auto', padding: '16px 20px', boxSizing: 'border-box' }}
            dangerouslySetInnerHTML={{ __html: content.html }}
          />
        );
      }

      // PDF via canvas
      if (content.kind === 'pdf') {
        return (
          <div style={{ width: '100%', height: '100%', overflow: 'auto', padding: 8 }}>
            <PdfCanvas pdfRef={pdfRef} page={page} />
          </div>
        );
      }
    }

    // Fallback : doc sans rawFile (docs mockés)
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 14, height: '100%', padding: '0 24px', textAlign: 'center',
      }}>
        <span style={{ fontSize: 64, lineHeight: 1 }}>{TYPE_ICONS[doc.type] || TYPE_ICONS.default}</span>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 4px' }}>{doc.name}</p>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
          Aperçu disponible uniquement pour les fichiers uploadés dans cette session.
        </p>
      </div>
    );
  };

  return (
<Modal open={!!doc} onClose={onClose} title={`Aperçu — ${doc.name}`}
  style={{ width: '90vw', maxWidth: '1200px', maxHeight: '95vh' }}>      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Métadonnées ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          padding: '8px 12px',
          background: 'var(--color-background-tertiary)',
          borderRadius: 8, fontSize: 12, color: 'var(--color-text-muted)',
        }}>
          <span>👤 {doc.author}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>📦 {doc.size}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>📅 {doc.date}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <Badge label={doc.category} color={TYPE_COLORS[doc.type] || 'gray'} />
          <div style={{ marginLeft: 'auto' }}>
            {doc.shared ? <Badge label="Partagé" color="ochre" /> : <Badge label="Privé" color="muted" />}
          </div>
        </div>

        {/* ── Zone d'aperçu ── */}
        <div style={{
          height: 400, border: '1px solid var(--color-border)', borderRadius: 12,
          overflow: 'hidden', background: 'var(--color-background-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {renderContent()}
        </div>

        {/* ── Pagination PDF ── */}
        {isPdf && totalPages > 1 && status === 'done' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              style={{
                background: 'none', border: '1px solid var(--color-border)',
                borderRadius: 6, padding: '4px 12px',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                color: 'var(--color-text-muted)', fontSize: 13,
                opacity: page <= 1 ? 0.4 : 1, transition: 'opacity 0.15s',
              }}
            >◀</button>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', minWidth: 80, textAlign: 'center' }}>
              Page {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              style={{
                background: 'none', border: '1px solid var(--color-border)',
                borderRadius: 6, padding: '4px 12px',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                color: 'var(--color-text-muted)', fontSize: 13,
                opacity: page >= totalPages ? 0.4 : 1, transition: 'opacity 0.15s',
              }}
            >▶</button>
          </div>
        )}

        {/* ── Actions ── */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" icon="share" onClick={() => { onShare(doc); onClose(); }}>
            {doc.shared ? 'Rendre privé' : 'Partager'}
          </Button>
          <Button variant="ghost" icon="download" onClick={() => onDownload(doc)}>
            Télécharger
          </Button>
          <Button variant="primary" onClick={onClose}>Fermer</Button>
        </div>

      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const { addToast } = useNotif();

  const [docs,        setDocs]        = useState(initialDocs);
  const [query,       setQuery]       = useState('');
  const [filterCat,   setFilterCat]   = useState('Tous');
  const [uploadModal, setUploadModal] = useState(false);
  const [previewDoc,  setPreviewDoc]  = useState(null); // ← nouveau

  const usedMB = docs.reduce((acc, d) => acc + parseMB(d.size), 0);
  const pct    = Math.min(Math.round((usedMB / TOTAL_STORAGE_MB) * 100), 100);

  const allCategories = ['Tous', ...new Set(docs.map(d => d.category))];

  const filtered = docs.filter(d => {
    const matchQ = d.name.toLowerCase().includes(query.toLowerCase())
                || d.author.toLowerCase().includes(query.toLowerCase());
    const matchC = filterCat === 'Tous' || d.category === filterCat;
    return matchQ && matchC;
  });

  // Basculer partage / privé
  function handleShare(doc) {
    setDocs(prev => prev.map(d =>
      d.id === doc.id ? { ...d, shared: !d.shared } : d
    ));
    addToast(doc.shared ? 'Document mis en privé.' : "Document partagé avec l'équipe !", 'success');
  }

  // Supprimer
  function handleDelete(doc) {
    setDocs(prev => prev.filter(d => d.id !== doc.id));
    setPreviewDoc(null);
    addToast('Document supprimé.', 'warning');
  }

  // Télécharger (simulé)
  function handleDownload(doc) {
    addToast(`Téléchargement de ${doc.name}…`, 'info');
  }

  // Upload — reçoit un FormData, simule un ajout local
  async function handleUpload(formData) {
    // TODO : remplacer par un vrai appel API
    // await api.post('/documents', formData);

    const rawFile = formData._rawFile;
    const type    = getExtension(rawFile?.name || '');

    const newDoc = {
      id:       Date.now(),
      name:     formData.get('nom'),
      author:   'Moi',
      size:     rawFile ? formatSize(rawFile.size) : '—',
      date:     new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      category: formData.get('categorie'),
      type,
      shared:   formData.get('visibilite') === 'partage',
      rawFile,  // ← conservé en mémoire pour la prévisualisation réelle
    };

    setDocs(prev => [newDoc, ...prev]);
    addToast('Document uploadé avec succès !', 'success');
  }

  return (
    <div className="animate-enter">
      <SectionHeader
        title="Documents"
        subtitle={`${docs.length} fichiers · ${usedMB.toFixed(1)} MB utilisés`}
        action="Uploader"
        actionIcon="cloud"
        onAction={() => setUploadModal(true)}
      />

      {/* Recherche + filtres catégorie */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <SearchBar value={query} onChange={setQuery} placeholder="Rechercher un document…" />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {allCategories.map(c => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              style={{
                padding: '7px 13px', borderRadius: 8, border: '1px solid',
                fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                transition: 'all var(--transition-normal)',
                background:  filterCat === c ? 'var(--color-accent-bg)'    : 'transparent',
                borderColor: filterCat === c ? 'var(--color-accent-border)' : 'var(--color-border)',
                color:       filterCat === c ? 'var(--color-accent)'        : 'var(--color-text-muted)',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div style={{
        background: 'var(--color-background-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 14, overflow: 'hidden', marginBottom: 18,
      }}>
        {/* En-tête */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2.5fr 100px 130px 90px 80px 90px',
          padding: '10px 20px',
          borderBottom: '1px solid var(--color-border)',
          fontSize: 11, color: 'var(--color-text-muted)',
          fontWeight: 600, letterSpacing: '.05em',
        }}>
          <span>NOM</span>
          <span>TAILLE</span>
          <span>DATE</span>
          <span>CATÉGORIE</span>
          <span>ACCÈS</span>
          <span />
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
            Aucun document trouvé.
          </div>
        )}

        {filtered.map((doc, i) => (
          <div
            key={doc.id}
            onClick={() => setPreviewDoc(doc)} // ← ouvre la prévisualisation
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-background-tertiary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            style={{
              display: 'grid',
              gridTemplateColumns: '2.5fr 100px 130px 90px 80px 90px',
              padding: '13px 20px',
              borderBottom: i < filtered.length - 1 ? '1px solid var(--color-border)' : 'none',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'background var(--transition-normal)',
            }}
          >
            {/* Nom */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{TYPE_ICONS[doc.type] || TYPE_ICONS.default}</span>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doc.name}
                </p>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>par {doc.author}</p>
              </div>
            </div>

            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{doc.size}</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{doc.date}</span>
            <span><Badge label={doc.category} color={TYPE_COLORS[doc.type] || 'gray'} /></span>
            <span>
              {doc.shared
                ? <Badge label="Partagé" color="ochre" />
                : <Badge label="Privé"   color="muted" />}
            </span>

            {/* Actions inline */}
            <div
              style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Bouton aperçu */}
              <button
                title="Prévisualiser"
                onClick={() => setPreviewDoc(doc)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
              >
                <Icon name="eye" size={15} color="var(--color-text-muted)" />
              </button>

              <button
                title="Télécharger"
                onClick={() => handleDownload(doc)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
              >
                <Icon name="download" size={15} color="var(--color-text-muted)" />
              </button>

              <button
                title={doc.shared ? 'Rendre privé' : 'Partager'}
                onClick={() => handleShare(doc)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
              >
                <Icon name="share" size={15} color={doc.shared ? 'var(--color-accent)' : 'var(--color-text-muted)'} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Barre de stockage */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 18px',
        background: 'var(--color-background-secondary)',
        borderRadius: 12, border: '1px solid var(--color-border)',
      }}>
        <Icon name="cloud" size={18} color="var(--color-accent)" />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Stockage utilisé</span>
            <span style={{ fontSize: 12, color: 'var(--color-accent)', fontWeight: 600 }}>
              {usedMB.toFixed(1)} MB / 1 GB
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--color-background-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: pct > 80 ? 'var(--color-error, #dc2626)' : 'var(--color-accent)',
              borderRadius: 3, transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{pct}% utilisé</span>
      </div>

      {/* Modale d'upload */}
      <UploadModal
        open={uploadModal}
        onClose={() => setUploadModal(false)}
        onUpload={handleUpload}
      />

      {/* Modale de prévisualisation */}
      <PreviewModal
        doc={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onDownload={handleDownload}
        onShare={handleShare}
      />
    </div>
  );
}