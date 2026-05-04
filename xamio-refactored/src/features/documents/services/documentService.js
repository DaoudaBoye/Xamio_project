/**
 * src/features/documents/services/documentService.js
 *
 * Toutes les interactions avec /api/documents.
 * Utilisé par DocumentsPage et ses hooks.
 */

const S3_CACHE_TTL = 13 * 60 * 1000; // 13 min (TTL Laravel = 15 min)
const s3UrlCache   = new Map();       // endpoint → { url, expiresAt }

// ── Helpers ────────────────────────────────────────────────────────────────

function getAuthHeaders() {
  const token = localStorage.getItem('xamio_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getCachedUrl(key) {
  const e = s3UrlCache.get(key);
  return e && e.expiresAt > Date.now() ? e.url : null;
}

function setCachedUrl(key, url) {
  s3UrlCache.set(key, { url, expiresAt: Date.now() + S3_CACHE_TTL });
}

/**
 * Convertit un doc retourné par /api/documents en shape locale React.
 * Appelé aussi bien par useLibraryDocuments que par handleUpload.
 */
export function apiDocToDoc(d) {
  return {
    id:         `lib-${d.id}`,
    apiId:      d.id,
    name:       d.name,
    source:     'library',
    type:       d.type,            // extension courte : pdf | docx | xlsx | png
    category:   d.category,
    shared:     d.shared,
    visibility: d.visibility ?? (d.shared ? 'equipe' : 'prive'), // prive | equipe | organisation
    author:     d.author ?? 'Inconnu',
    size:       d.size ?? '—',
    date: d.created_at
      ? new Date(d.created_at).toLocaleDateString('fr-FR', {
          day: 'numeric', month: 'long', year: 'numeric',
        })
      : '—',
    _fromApi: true,
    has_file: true,
    // Infos RAG (optionnel, utilisé par un futur panneau admin)
    rag: d.rag ?? null,
  };
}

// ── Appels API ──────────────────────────────────────────────────────────────

/**
 * GET /api/documents
 * Retourne un tableau de docs déjà convertis en shape locale.
 */
export async function fetchDocuments(signal) {
  const res = await fetch('/api/documents', {
    credentials: 'include',
    signal,
    headers: { Accept: 'application/json', ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`GET /api/documents → ${res.status}`);
  const body = await res.json();
  const raw  = Array.isArray(body) ? body : (body.data ?? []);
  return raw.map(apiDocToDoc);
}

/**
 * POST /api/documents  (multipart/form-data via XHR pour la progression)
 *
 * @param {File}     file
 * @param {object}   meta   { nom, categorie, visibilite }
 * @param {Function} onProgress  (0-100)
 * @returns {Promise<object>}  doc en shape locale
 */
export function uploadDocument(file, meta, onProgress) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append('fichier',    file);
    fd.append('nom',        meta.nom        || file.name);
    fd.append('categorie',  meta.categorie  || '');
    fd.append('visibilite', meta.visibilite || 'prive');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/documents');
    const token = localStorage.getItem('xamio_token');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.withCredentials = true;

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) onProgress?.(Math.round(e.loaded / e.total * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(apiDocToDoc(data.data));
        } catch {
          reject(new Error('Réponse invalide du serveur.'));
        }
      } else {
        try {
          const body = JSON.parse(xhr.responseText);
          reject(new Error(body.message || `Erreur HTTP ${xhr.status}`));
        } catch {
          reject(new Error(`Erreur HTTP ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Erreur réseau.'));
    xhr.send(fd);
  });
}

/**
 * GET /api/documents/{id}/download  ou  /api/reunions/{id}/compte-rendu/download
 * Retourne l'URL signée S3 (mise en cache 13 min).
 */
export async function getSignedUrl(endpoint) {
  const cached = getCachedUrl(endpoint);
  if (cached) return cached;

  const res = await fetch(endpoint, {
    credentials: 'include',
    headers: { Accept: 'application/json', ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`Impossible de générer le lien (${res.status})`);
  const { url } = await res.json();
  setCachedUrl(endpoint, url);
  return url;
}

/**
 * PATCH /api/documents/{id}
 * Met à jour la visibilité (et éventuellement d'autres métadonnées).
 */
export async function patchDocument(apiId, patch) {
  const res = await fetch(`/api/documents/${apiId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`PATCH /api/documents/${apiId} → ${res.status}`);
  return res.json();
}

/**
 * DELETE /api/documents/{id}
 * Supprime le fichier S3 et l'entrée BDD.
 */
export async function deleteDocument(apiId) {
  const res = await fetch(`/api/documents/${apiId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { Accept: 'application/json', ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`DELETE /api/documents/${apiId} → ${res.status}`);
}

/**
 * Génère un export .txt local pour les CR sans fichier S3.
 */
export function exportCRtxt(doc) {
  const lines = [
    `# ${doc.name}`, `Date : ${doc.date}`, '',
    '## Résumé', doc.summary ?? '—', '',
    '## Décisions',
    ...(doc.decisions ?? []).map((d, i) => `${i + 1}. ${d.text}`),
    '',
    '## Actions',
    ...(doc.actions ?? []).map(a =>
      `- ${a.title}${a.assignee ? ` (${a.assignee})` : ''}${a.due ? ` — échéance : ${a.due}` : ''}`
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), {
    href,
    download: `${doc.name.replace(/[^a-z0-9]/gi, '_')}.txt`,
  }).click();
  URL.revokeObjectURL(href);
}

// Expose le cache pour que DocumentsPage puisse y accéder directement
// (ex: prévisualisation + téléchargement partagent le même cache)
export { getCachedUrl, setCachedUrl, s3UrlCache };