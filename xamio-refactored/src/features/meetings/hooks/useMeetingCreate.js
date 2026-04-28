import { useState, useCallback } from 'react';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL)
  || 'http://localhost:8000/api';

function getToken() {
  return localStorage.getItem('xamio_token') || null;
}

export function useMeetingCreate() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const create = useCallback(async (data) => {
    setLoading(true);
    setError(null);

    const token = getToken();

    const payload = {
      reun_titre:      data.title,
      reun_date:       data.date,
      reun_heure:      data.time       || null,
      reun_duree_min:  data.duration,
      reun_lieu:       data.location   || null,
      reun_visibilite: data.visibility,
      dept_ids:        data.dept_ids   || [],

      agenda: (data.agenda || []).map((a, i) => ({
        poj_intitule: a.text || a.intitule,
        poj_ordre:    i + 1,
      })),

      participants: (data.participants || []).map(p => ({
        nom:     p.nom     || '',
        email:   p.email,
        societe: p.societe || '',
      })),
    };

    try {
      const res = await fetch(`${API_BASE}/reunions`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Accept':        'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = json.errors
          ? Object.values(json.errors).flat()[0]
          : json.message || 'Une erreur est survenue.';
        setError(message);
        throw new Error(message);
      }

      return json;

    } catch (err) {
      if (!error) setError(err.message || 'Une erreur est survenue.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
}