// src/features/documents/hooks/useMeetingDocuments.js

import { useEffect, useRef, useState } from 'react';

export function useMeetingDocuments({ addDocument, baseUrl = '', fetchOptions = {} }) {
  const addDocRef     = useRef(addDocument);
  const baseUrlRef    = useRef(baseUrl);
  const fetchOptRef   = useRef(fetchOptions);
  const tokenRef      = useRef(localStorage.getItem('xamio_token'));
  const controllerRef = useRef(null);
  const [loading, setLoading] = useState(!!tokenRef.current);

  useEffect(() => { addDocRef.current   = addDocument;  }, [addDocument]);
  useEffect(() => { baseUrlRef.current  = baseUrl;      }, [baseUrl]);
  useEffect(() => { fetchOptRef.current = fetchOptions; }, [fetchOptions]);

  const startSync = useRef(() => {
    if (!tokenRef.current) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);

    syncMeetingDocs({
      addDocument:  (...args) => addDocRef.current(...args),
      token:        tokenRef.current,
      baseUrl:      baseUrlRef.current,
      fetchOptions: { ...fetchOptRef.current, signal: controller.signal },
    })
      .catch(err => { if (err.name !== 'AbortError') console.warn('[useMeetingDocuments]', err); })
      .finally(() => setLoading(false));
  }).current;

  useEffect(() => {
    const onLogin  = () => { tokenRef.current = localStorage.getItem('xamio_token'); startSync(); };
    const onLogout = () => { tokenRef.current = null; controllerRef.current?.abort(); setLoading(false); };
    window.addEventListener('xamio:login',  onLogin);
    window.addEventListener('xamio:logout', onLogout);
    return () => {
      window.removeEventListener('xamio:login',  onLogin);
      window.removeEventListener('xamio:logout', onLogout);
    };
  }, [startSync]);

  useEffect(() => {
    startSync();
    return () => controllerRef.current?.abort();
  }, [startSync]);

  return { loading };
}

export async function syncMeetingDocs({ addDocument, token, baseUrl = '', fetchOptions = {} }) {
  const { signal, ...restOptions } = fetchOptions;
  const base    = { credentials: 'include', signal, ...restOptions };
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    ...(restOptions.headers ?? {}),
  };

  try {
    const res = await fetch(`${baseUrl}/api/reunions`, { ...base, headers });
    if (!res.ok) throw new Error(`GET /api/reunions → ${res.status}`);

    const body     = await res.json();
    const reunions = Array.isArray(body) ? body : (body.data ?? []);

    // Si le back inclut compte_rendu → 1 seule requête
    const hasCR = reunions.some(r => r.compte_rendu !== undefined);

    if (hasCR) {
      for (const reunion of reunions) {
        if (!reunion.compte_rendu) continue;
        addDocument(crToDoc(reunion.compte_rendu, reunion));
      }
      return;
    }

    // Fallback N+1 si la relation n'est pas encore chargée côté back
    await Promise.allSettled(
      reunions.map(async (reunion) => {
        const reunId = reunion.reun_id ?? reunion.id;
        if (!reunId) return;
        try {
          const res2  = await fetch(`${baseUrl}/api/reunions/${reunId}/compte-rendu`, { ...base, headers });
          if (!res2.ok) return;
          const body2 = await res2.json();
          const cr    = body2.data;
          if (!cr) return;
          addDocument(crToDoc(cr, reunion));
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.warn(`[useMeetingDocuments] Erreur CR réunion ${reunId} :`, err.message);
          }
        }
      }),
    );

  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('[useMeetingDocuments] Impossible de charger les réunions :', err.message);
    }
  }
}

export function crToDoc(cr, reunion) {
  const title = reunion?.reun_titre ?? reunion?.title ?? `Réunion #${reunion?.reun_id}`;
  const date  = reunion?.reun_date  ?? reunion?.date  ?? cr.created_at ?? null;

  return {
    id:           `cr-${cr.cr_id}`,
    name:         `CR — ${title}`,
    source:       'meeting',
    meetingId:    reunion?.reun_id ?? cr.reun_id,
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