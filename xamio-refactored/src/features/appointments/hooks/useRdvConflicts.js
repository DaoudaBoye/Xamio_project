import { useState, useEffect, useRef, useMemo } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || '/api';


function getToken() {
  return localStorage.getItem('xamio_token') || null;
}

function toMinutes(dateStr, timeStr = '00:00') {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, min]  = (timeStr || '00:00').split(':').map(Number);
  return Date.UTC(y, m - 1, d, h, min) / 60000;
}

function overlaps(s1, e1, s2, e2) {
  return s1 < e2 && s2 < e1;
}

/**
 * Détecte les conflits d'agenda pour un RDV en cours de création.
 * Vérifie si des participants internes sont déjà engagés sur ce créneau.
 *
 * @param {string}   date                  - Date du RDV (YYYY-MM-DD)
 * @param {string}   time                  - Heure du RDV (HH:mm)
 * @param {number}   duration              - Durée en minutes
 * @param {Array}    participantsInternes  - Participants internes [{ email }]
 */
export function useRdvConflicts({ date, time, duration, participantsInternes = [] }) {
  const [conflicts, setConflicts] = useState([]);
  const [checking,  setChecking]  = useState(false);
  const abortRef = useRef(null);

  /* Clé stable pour éviter les re-renders inutiles */
  const participantsKey = useMemo(
    () => JSON.stringify(participantsInternes.map(p => p.email).sort()),
    [participantsInternes]
  );

  useEffect(() => {
    if (!date || !duration) {
      setConflicts([]);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setChecking(true);
      setConflicts([]);

      try {
        const token  = getToken();
        const params = new URLSearchParams({ date });

        const res = await fetch(`${API_BASE}/rendez-vous?${params}`, {
          headers: {
            'Accept':        'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          signal: abortRef.current.signal,
        });

        if (!res.ok) return;

        const json = await res.json();

        /* Support des deux formats de réponse API */
        const rdvs = json.data ?? json.rendez_vous ?? [];

        const newStart = toMinutes(date, time);
        const newEnd   = newStart + Number(duration);

        /* Emails des participants internes du nouveau RDV */
        const newEmails = new Set(
          participantsInternes
            .map(p => (p.email ?? '').toLowerCase().trim())
            .filter(Boolean)
        );

        const found = rdvs.filter(r => {
          /* Ignorer les RDV annulés ou terminés */
          if (['annule', 'termine'].includes(r.rdv_statut)) return false;

          const rDate = (r.rdv_date ?? '').slice(0, 10);

          /* Vérification du chevauchement horaire */
          let timeConflict = false;
          if (!time || !r.rdv_heure) {
            /* Pas d'heure précise → conflit si même jour */
            timeConflict = rDate === date;
          } else {
            const rStart = toMinutes(rDate, r.rdv_heure);
            const rEnd   = rStart + Number(r.rdv_duree ?? 60);
            timeConflict = overlaps(newStart, newEnd, rStart, rEnd);
          }

          if (!timeConflict)    return false;
          if (newEmails.size === 0) return false;

          /* Emails des participants internes du RDV existant */
          const existingEmails = (r.rdv_participants ?? [])
            .map(p =>
              (
                p.user?.email     ??
                p.utilisateur?.email ??
                ''
              ).toLowerCase().trim()
            )
            .filter(Boolean);

          return existingEmails.some(email => newEmails.has(email));
        });

        setConflicts(found);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('[useRdvConflicts]', err.message);
        }
      } finally {
        setChecking(false);
      }
    }, 400); /* Debounce 400ms — identique à useMeetingConflicts */

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [date, time, duration, participantsKey]);

  return { conflicts, checking };
}