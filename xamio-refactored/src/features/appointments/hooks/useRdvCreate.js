import { useState, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

function getToken() {
  return localStorage.getItem('xamio_token') || null;
}

export function useRdvCreate() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const create = useCallback(async (data) => {
    setLoading(true);
    setError(null);

    const token = getToken();

    const payload = {
      rdv_titre:       data.title,
      rdv_date:        data.date,
      rdv_heure:       data.time        || null,
      rdv_duree:       data.duration    || 60,
      rdv_lieu:        data.location    || null,
      rdv_type:        data.type        || null,
      rdv_description: data.description || null,
      rdv_visibilite:  'tous',
      rdv_rappels:     data.rappels     || [],

      contact_principal: (data.contactSociete || data.contactNom || data.contactEmail) ? {
        nom:     data.contactType === 'entreprise'
                   ? (data.contactReferent || data.contactSociete)
                   : (data.contactNom || null),
        email:   data.contactEmail   || null,
        tel:     data.contactTel     || null,
        societe: data.contactSociete || null,
        type:    data.contactType    || 'personne',
      } : null,

      participants_internes: (data.participantsInternes || []).map(p => ({
        user_id: p.user_id,
        nom:     p.nom   || '',
        email:   p.email || '',
      })),

      participants_externes: (data.participantsExternes || []).map(p => ({
        nom:     p.nom     || '',
        email:   p.email,
        societe: p.societe || '',
      })),
    };

    try {
      const res = await fetch(`${API_BASE}/rendez-vous`, {
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