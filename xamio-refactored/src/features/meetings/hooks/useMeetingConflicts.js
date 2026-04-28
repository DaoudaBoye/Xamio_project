import { useState, useEffect, useRef, useMemo } from 'react';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL)
  || 'http://localhost:8000/api';

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

export function useMeetingConflicts({ date, time, duration, participants = [] }) {
  const [conflicts, setConflicts] = useState([]);
  const [checking,  setChecking]  = useState(false);
  const abortRef = useRef(null);

  const participantsKey = useMemo(
    () => JSON.stringify(participants.map(p => p.email).sort()),
    [participants]
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

        const res = await fetch(`${API_BASE}/reunions?${params}`, {
          headers: {
            'Accept':        'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          signal: abortRef.current.signal,
        });

        if (!res.ok) return;

        const json     = await res.json();
        const reunions = json.data ?? json.reunions ?? [];

        const newStart = toMinutes(date, time);
        const newEnd   = newStart + Number(duration);

        const newEmails = new Set(
          participants
            .map(p => (p.email ?? '').toLowerCase().trim())
            .filter(Boolean)
        );

        const found = reunions.filter(r => {
          if (r.reun_statut === 'annulee') return false;

          const rDate = (r.reun_date ?? '').slice(0, 10);

          let timeConflict = false;
          if (!time || !r.reun_heure) {
            timeConflict = rDate === date;
          } else {
            const rStart = toMinutes(rDate, r.reun_heure);
            const rEnd   = rStart + Number(r.reun_duree_min ?? 60);
            timeConflict = overlaps(newStart, newEnd, rStart, rEnd);
          }

          if (!timeConflict) return false;
          if (newEmails.size === 0) return false;

          const existingEmails = (r.participant_reunions ?? r.participantReunions ?? [])
            .map(p =>
              (
                p.contact_externe?.contact_email ??
                p.contactExterne?.contact_email  ??
                ''
              ).toLowerCase().trim()
            )
            .filter(Boolean);

          return existingEmails.some(email => newEmails.has(email));
        });

        setConflicts(found);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('[useMeetingConflicts]', err.message);
        }
      } finally {
        setChecking(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [date, time, duration, participantsKey]);

  return { conflicts, checking };
}