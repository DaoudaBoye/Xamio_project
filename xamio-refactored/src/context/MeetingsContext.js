import React, {
  createContext, useContext, useState,
  useCallback, useEffect, useMemo, useRef,
} from 'react';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const POLL_INTERVAL = 15_000;
const CACHE_KEY     = 'xamio_meetings_cache';

function getToken() {
  return localStorage.getItem('xamio_token') || null;
}

/* ── Cache sessionStorage ─────────────────────────────────── */
function saveCache(list) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch (_) {}
}

function loadCache() {
  try {
    const raw    = sessionStorage.getItem(CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) { return []; }
}

function clearCache() {
  try { sessionStorage.removeItem(CACHE_KEY); } catch (_) {}
}

/* ── API ──────────────────────────────────────────────────── */
async function apiFetch(path, options = {}) {
  const token = getToken();
  const res   = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept:         'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // FIX : check strict sur les codes serveur uniquement — plus de msg.includes('token')
  // qui déclenchait un faux logout sur des 401 métier contenant le mot "token".
  if (res.status === 401) {
    const data = await res.json().catch(() => ({}));
    const code = data?.code || '';

    const isSessionExpired =
      code === 'SESSION_TIMEOUT'   ||
      code === 'TOKEN_EXPIRED'     ||
      code === 'SESSION_NOT_FOUND';

    if (isSessionExpired) {
      console.warn('[MeetingsContext] Session expirée → déconnexion');
      window.dispatchEvent(new Event('xamio:logout'));
    } else {
      console.warn('[MeetingsContext] 401 métier sur', path, '— session conservée');
    }

    return null;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Erreur API');
  return data;
}

/* ── Normalisation ────────────────────────────────────────── */

function buildName(user) {
  if (!user) return '';
  if (user.nom_complet) return user.nom_complet;
  const full = `${user.util_prenom ?? ''} ${user.util_nom ?? ''}`.trim();
  return full || user.name || user.email || '';
}

function normalizeParticipant(p) {
  const ext  = p.contact_externe ?? p.contactExterne ?? null;
  const user = p.user ?? null;

  return {
    id:                p.part_id    ?? p.id ?? null,
    part_id:           p.part_id    ?? null,
    part_email:        user?.email  ?? ext?.contact_email ?? p.email ?? '',
    part_statut:       p.part_statut            ?? 'invite',
    part_statut_invitation: p.part_statut_invitation ?? 'en_attente',
    user_id:           user?.id     ?? p.user_id ?? null,
    name:              buildName(user) || ext?.contact_nom || '',
    email:             user?.email  ?? ext?.contact_email ?? '',
    ext_nom:           ext?.contact_nom   ?? '',
    ext_email:         ext?.contact_email ?? '',
    ext_telephone:     ext?.contact_tel   ?? '',
    ...p,
  };
}

function normalizeAgendaItem(a) {
  return {
    id:   a.poj_id ?? a.id,
    text: a.poj_intitule ?? a.text ?? '',
    ...a,
  };
}

function normalizeReunion(r) {
  const src = r?.reunion ?? r;

  const organisateurUser = src.organisateur ?? null;
  const organizerName    = buildName(organisateurUser) || src.organizer || '';

  return {
    id:            src.reun_id        ?? src.id       ?? Date.now(),
    title:         src.reun_titre     ?? src.title    ?? '',
    date: src.reun_date
      ? (typeof src.reun_date === 'string' ? src.reun_date.split('T')[0] : src.reun_date)
      : src.date ?? '',
    time:          src.reun_heure     ?? src.time     ?? '',
    duration:      src.reun_duree_min ?? src.duration ?? 60,
    location:      src.reun_lieu      ?? src.location ?? '',
    status:        src.statut_calcule ?? src.reun_statut ?? src.status ?? 'planifiee',
    visibility:    src.reun_visibilite ?? src.visibility ?? '',

    organizer:       organizerName,
    organizer_id:    organisateurUser?.id ?? src.user_id ?? null,
    organizer_email: organisateurUser?.email ?? '',

    cancelReason:   src.reun_annul_motif  ?? src.cancelReason   ?? '',
    postponeReason: src.reun_report_motif ?? src.postponeReason ?? '',

    participant_reunions: (src.participant_reunions ?? src.participantReunions ?? src.participants ?? [])
      .map(normalizeParticipant),

    get participants() { return this.participant_reunions; },

    agenda: (src.point_ordre_jours ?? src.pointOrdreJours ?? src.agenda ?? [])
      .map(normalizeAgendaItem),

    departements: src.departements ?? [],

    summary:     src.summary   ?? '',
    decisions:   src.decisions ?? [],
    actions:     src.actions   ?? [],
    minutes:     src.minutes   ?? null,
    postponedTo: src.postponedTo ?? null,
    startedAt:   src.startedAt  ?? null,
    created_at:  src.created_at ?? null,
    updated_at:  src.updated_at ?? null,
  };
}

function normalizeAll(list) {
  return (list ?? []).map(normalizeReunion);
}

/* ── Context ──────────────────────────────────────────────── */

const MeetingsContext = createContext(null);

export function MeetingsProvider({ children }) {
  const [meetings,   setMeetings]   = useState(() => loadCache());
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [lastSync,   setLastSync]   = useState(null);

  const pollRef    = useRef(null);
  const isFetching = useRef(false);

  /* ── setMeetings + cache ── */
  const setMeetingsWithCache = useCallback((listOrUpdater) => {
    setMeetings(prev => {
      const next = typeof listOrUpdater === 'function' ? listOrUpdater(prev) : listOrUpdater;
      saveCache(next);
      return next;
    });
  }, []);

  /* ── Fetch principal ── */
  const fetchMeetings = useCallback(async (silent = false) => {
    if (isFetching.current) return;
    if (!getToken()) { setLoading(false); return; }

    isFetching.current = true;
    if (!silent) setLoading(true);
    setFetchError(null);

    const timeout = setTimeout(() => { isFetching.current = false; }, 10_000);

    try {
      const data = await apiFetch('/reunions');

      if (data === null) return;

      const list = data?.data ?? data?.reunions ?? (Array.isArray(data) ? data : null);
      if (!Array.isArray(list)) return;

      setMeetingsWithCache(normalizeAll(list));
      setLastSync(new Date().toISOString());
    } catch (err) {
      setFetchError(err.message);
      console.warn('[Meetings] Fetch échoué (session conservée) :', err.message);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
      isFetching.current = false;
    }
  }, [setMeetingsWithCache]);

  /* ── Polling ── */
  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => fetchMeetings(true), POLL_INTERVAL);
  }, [fetchMeetings]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  /* ── Pause en arrière-plan ── */
  // FIX : suppression du isFetching.current = false brutal qui pouvait créer
  // deux fetches concurrents au retour d'onglet si un fetch était en cours.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        fetchMeetings(true);
        startPolling();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [startPolling, stopPolling, fetchMeetings]);

  /* ── Démarrage initial ── */
  useEffect(() => {
    if (getToken()) {
      const cached = loadCache();
      if (cached.length > 0) setLoading(false);
      fetchMeetings(cached.length > 0).then(() => startPolling());
    } else {
      setLoading(false);
    }

    const handleLogin  = () => fetchMeetings().then(() => startPolling());
    const handleLogout = () => {
      stopPolling();
      setMeetings([]);
      clearCache();
      setFetchError(null);
      setLoading(false);
      setLastSync(null);
    };

    window.addEventListener('xamio:login',  handleLogin);
    window.addEventListener('xamio:logout', handleLogout);
    return () => {
      stopPolling();
      window.removeEventListener('xamio:login',  handleLogin);
      window.removeEventListener('xamio:logout', handleLogout);
    };
  }, [fetchMeetings, startPolling, stopPolling]);

  /* ── Actions ── */

  const create = useCallback(async () => {
    if (isFetching.current) await new Promise(r => setTimeout(r, 600));
    await fetchMeetings(true);
  }, [fetchMeetings]);

  const cancel = useCallback(async (id, reason = '') => {
    await apiFetch(`/reunions/${id}/annuler`, {
      method: 'PATCH',
      body:   JSON.stringify({ reun_annul_motif: reason || null }),
    });
    await fetchMeetings(true);
  }, [fetchMeetings]);

  const postpone = useCallback(async (id, newDate, newTime, reason = '') => {
    await apiFetch(`/reunions/${id}/reporter`, {
      method: 'PATCH',
      body:   JSON.stringify({
        reun_date:         newDate,
        reun_heure:        newTime  || null,
        reun_report_motif: reason   || null,
      }),
    });
    await fetchMeetings(true);
  }, [fetchMeetings]);

  const reschedule = useCallback(async (id) => {
    await apiFetch(`/reunions/${id}/statut`, {
      method: 'PATCH',
      body:   JSON.stringify({ reun_statut: 'planifiee' }),
    });
    await fetchMeetings(true);
  }, [fetchMeetings]);

  const markDone = useCallback(async (id) => {
    await apiFetch(`/reunions/${id}/statut`, {
      method: 'PATCH',
      body:   JSON.stringify({ reun_statut: 'terminee' }),
    });
    await fetchMeetings(true);
  }, [fetchMeetings]);

  const update = useCallback(async (id, data) => {
    await apiFetch(`/reunions/${id}`, {
      method: 'PUT',
      body:   JSON.stringify(data),
    });
    await fetchMeetings(true);
  }, [fetchMeetings]);

  const addMinutes = useCallback(async (id, minutes) => {
    setMeetingsWithCache(prev => prev.map(m =>
      m.id === id ? {
        ...m,
        minutes,
        summary:   minutes.summary   ?? m.summary,
        decisions: minutes.decisions ?? m.decisions,
        actions:   minutes.actions   ?? m.actions,
      } : m
    ));
    fetchMeetings(true);
  }, [fetchMeetings, setMeetingsWithCache]);

  /* ── Sélecteurs mémoïsés ── */

  const stats = useMemo(() => ({
    upcoming:   meetings.filter(m => m.status === 'planifiee'),
    inProgress: meetings.filter(m => m.status === 'en_cours'),
    done:       meetings.filter(m => m.status === 'terminee'),
    cancelled:  meetings.filter(m => m.status === 'annulee'),
    postponed:  meetings.filter(m => m.status === 'reportee'),
  }), [meetings]);

  const getById = useCallback(
    (id) => meetings.find(m => String(m.id) === String(id)) ?? null,
    [meetings],
  );

  const value = useMemo(() => ({
    meetings,
    loading,
    fetchError,
    lastSync,
    fetchMeetings,
    create,
    update,
    cancel,
    postpone,
    reschedule,
    markDone,
    addMinutes,
    getById,
    ...stats,
  }), [
    meetings, loading, fetchError, lastSync,
    fetchMeetings, create, update,
    cancel, postpone, reschedule,
    markDone, addMinutes,
    getById, stats,
  ]);

  return (
    <MeetingsContext.Provider value={value}>
      {children}
    </MeetingsContext.Provider>
  );
}

export function useMeetings() {
  const ctx = useContext(MeetingsContext);
  if (!ctx) throw new Error('useMeetings must be inside MeetingsProvider');
  return ctx;
}