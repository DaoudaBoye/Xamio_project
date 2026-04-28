/**
 * XAMIO — FileUploader v2
 * Zone drag & drop élégante avec preview du nom fichier avant confirmation
 */
import React, { useState, useRef, useCallback } from 'react';
import { useCompteRendu } from '../../../context/CompteRenduContext';
import { useNotif } from '../../../context/NotifContext';
import { MOCK_DOCUMENT, formatFileSize } from '../../../data/compteRenduMock';

const ACCEPTED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];
const ACCEPTED_EXT = ['.pdf', '.docx', '.txt'];

function getFileExt(name = '') {
  const parts = name.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE';
}
function getExtColor(ext) {
  if (ext === 'PDF') return '#F03E3E';
  if (ext === 'DOCX' || ext === 'DOC') return '#4FA3F7';
  return '#2DA44E';
}

export default function FileUploader() {
  const { uploadDocument } = useCompteRendu();
  const { addToast } = useNotif();
  const [isDragging, setIsDragging] = useState(false);
  const [stagedFile, setStagedFile] = useState(null); // fichier en attente de confirmation
  const inputRef = useRef(null);

  const validate = (file) => {
    const valid = ACCEPTED_MIME.includes(file.type) ||
      ACCEPTED_EXT.some(e => file.name.toLowerCase().endsWith(e.toLowerCase()));
    if (!valid) { addToast('Format non supporté. PDF, DOCX ou TXT uniquement.', 'error'); return false; }
    if (file.size > 20 * 1024 * 1024) { addToast('Fichier trop volumineux (max 20 Mo).', 'error'); return false; }
    return true;
  };

  const stageFile = useCallback((file) => {
    if (!file || !validate(file)) return;
    setStagedFile(file);
  }, []); // eslint-disable-line

  const confirmUpload = () => {
    if (!stagedFile) return;
    const mockDoc = { ...MOCK_DOCUMENT, name: stagedFile.name, size: stagedFile.size, uploadedAt: new Date().toISOString() };
    uploadDocument(stagedFile, mockDoc);
    addToast('Document envoyé — Analyse IA en cours…', 'info');
    setStagedFile(null);
  };

  const onDrop = (e) => { e.preventDefault(); setIsDragging(false); stageFile(e.dataTransfer.files?.[0]); };
  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onInput = (e) => { stageFile(e.target.files?.[0]); e.target.value = ''; };

  const ext = stagedFile ? getFileExt(stagedFile.name) : null;
  const extColor = ext ? getExtColor(ext) : null;

  return (
    <div style={{ padding: '28px 0 8px' }}>

      {/* Titre */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>
          Uploader un compte rendu
        </p>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          Glissez-déposez un fichier ou cliquez pour sélectionner. L'IA l'analysera automatiquement.
        </p>
      </div>

      {/* Staged file preview */}
      {stagedFile ? (
        <div style={{
          border: '1px solid var(--color-accent-border)',
          borderRadius: 14, overflow: 'hidden',
          background: 'var(--color-accent-bg)',
          animation: 'fadeSlide 200ms ease',
        }}>
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* File icon */}
            <div style={{
              width: 44, height: 52, borderRadius: 8, flexShrink: 0,
              background: `${extColor}15`, border: `1px solid ${extColor}30`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
            }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: extColor, letterSpacing: '.05em', fontFamily: 'var(--font-mono)' }}>{ext}</span>
              <div style={{ width: 20, height: 1.5, background: `${extColor}50`, borderRadius: 1 }} />
              <div style={{ width: 15, height: 1.5, background: `${extColor}30`, borderRadius: 1 }} />
              <div style={{ width: 18, height: 1.5, background: `${extColor}30`, borderRadius: 1 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {stagedFile.name}
              </p>
              <p style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                {formatFileSize(stagedFile.size)} · Prêt à analyser
              </p>
            </div>
            <button onClick={() => setStagedFile(null)} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--color-border-medium)', background: 'var(--color-background-elevated)', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-accent-border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setStagedFile(null)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--color-border-medium)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
              Annuler
            </button>
            <button onClick={confirmUpload} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', cursor: 'pointer', color: '#fff', fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🧠</span> Analyser avec l'IA
            </button>
          </div>
        </div>
      ) : (
        /* Drop zone */
        <div
          onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? 'var(--color-accent)' : 'var(--color-border-medium)'}`,
            borderRadius: 16, padding: '36px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            cursor: 'pointer', userSelect: 'none',
            background: isDragging ? 'var(--color-accent-bg)' : 'var(--color-background-tertiary)',
            transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: isDragging ? 'var(--color-accent-bg)' : 'var(--color-background-elevated)',
            border: `1px solid ${isDragging ? 'var(--color-accent-border)' : 'var(--color-border-medium)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            transition: 'all 180ms', transform: isDragging ? 'scale(1.1)' : 'scale(1)',
          }}>
            {isDragging ? '📂' : '📄'}
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: isDragging ? 'var(--color-accent)' : 'var(--color-text-primary)', marginBottom: 4 }}>
              {isDragging ? 'Relâchez pour sélectionner' : 'Glissez un fichier ici'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              ou{' '}
              <span style={{ color: 'var(--color-accent)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                parcourez vos fichiers
              </span>
            </p>
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            {['PDF', 'DOCX', 'TXT'].map(f => (
              <span key={f} style={{ padding: '2px 9px', borderRadius: 5, background: 'var(--color-background-elevated)', border: '1px solid var(--color-border-medium)', fontSize: 9, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '.07em', fontFamily: 'var(--font-mono)' }}>{f}</span>
            ))}
            <span style={{ padding: '2px 9px', borderRadius: 5, background: 'var(--color-background-elevated)', border: '1px solid var(--color-border-medium)', fontSize: 9, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '.07em', fontFamily: 'var(--font-mono)' }}>MAX 20MO</span>
          </div>
        </div>
      )}

      <input ref={inputRef} type="file" accept=".pdf,.docx,.txt" style={{ display: 'none' }} onChange={onInput} />

      <style>{`@keyframes fadeSlide { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}
