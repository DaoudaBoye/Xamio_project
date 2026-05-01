// src/features/documents/hooks/useMeetingDocuments.js

import { useEffect, useRef, useState } from 'react';

export function useMeetingDocuments({
  addDocument,
  baseUrl = '',
  fetchOptions = {},
}) {
  const addDocRef = useRef(addDocument);
  useEffect(() => { addDocRef.current = addDocument; }, [addDocument]);

  // On lit le token depuis localStorage — c'est là que AuthContext le stocke
  const [token, setToken] = useState(() => localStorage.getItem('xamio_token'));

  useEffect(() => {
    const onLogin  = () => setToken(localStorage.getItem('xamio_token'));
    const onLogout = () => setToken(null);
    window.addEventListener('xamio:login',  onLogin);
    window.addEventListener('xamio:logout', onLogout);
    return () => {
      window.removeEventListener('xamio:login',  onLogin);
      window.removeEventListener('xamio:logout', onLogout);
    };
  }, []);

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();
    const signal = controller.signal;

    syncMeetingDocs({
      addDocument: (...args) => addDocRef.current(...args),
      token,
      baseUrl,
      fetchOptions: { ...fetchOptions, signal },
    }).catch((err) => {
      if (err.name !== 'AbortError') {
        console.warn('[useMeetingDocuments]', err);
      }
    });

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
}

export async function syncMeetingDocs({ addDocument, token, baseUrl = '', fetchOptions = {} }) {
  const { signal, ...restOptions } = fetchOptions;
  const base = { credentials: 'include', signal, ...restOptions };
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(restOptions.headers ?? {}),
  };

  let reunions = [];
  try {
    const res = await fetch(`${baseUrl}/api/reunions`, { ...base, headers });
    if (!res.ok) throw new Error(`GET /api/reunions → ${res.status}`);
    const body = await res.json();
    reunions = Array.isArray(body) ? body : (body.data ?? []);
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('[useMeetingDocuments] Impossible de charger les réunions :', err.message);
    }
    return;
  }

  await Promise.allSettled(
    reunions.map(async (reunion) => {
      const reunId = reunion.reun_id ?? reunion.id;
      if (!reunId) return;
      try {
        const res = await fetch(`${baseUrl}/api/reunions/${reunId}/compte-rendu`, {
          ...base,
          headers,
        });
        if (!res.ok) return;
        const body = await res.json();
        const cr = body.data;
        if (!cr) return;
        addDocument(crToDoc(cr, reunion));
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn(`[useMeetingDocuments] Erreur CR réunion ${reunId} :`, err.message);
        }
      }
    }),
  );
}

export function crToDoc(cr, reunion) {
  const title = reunion?.reun_titre ?? reunion?.title ?? `Réunion #${cr.meeting_id}`;
  const date  = reunion?.reun_date  ?? reunion?.date  ?? cr.created_at ?? null;

  return {
    id:           `cr-${cr.cr_id}`,
    name:         `CR — ${title}`,
    source:       'meeting',
    meetingId:    cr.meeting_id,
    meetingTitle: title,
    type:         'docx',
    category:     'Comptes-rendus',
    shared:       false,
    author:       cr.generated_by_ai ? 'IA Xamio' : 'Manuel',
    size:         cr.has_file ? '—' : '< 1 KB',
    date: date
      ? new Date(date).toLocaleDateString('fr-FR', {
          day: 'numeric', month: 'long', year: 'numeric',
        })
      : '—',
    summary:   cr.summary   ?? null,
    decisions: cr.decisions ?? [],
    actions:   cr.actions   ?? [],
    hasFile:   cr.has_file  ?? false,
    _fromS3:   true,
  };
}