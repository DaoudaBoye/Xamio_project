/**
 * useCR.js — Xamio v2
 * Store singleton : une seule liste partagée entre tous les appelants.
 */

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'xamio_cr_list';

/* ── Singleton ─────────────────────────────────────────── */
let _store = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
})();

const _listeners = new Set();

function _notify() {
  _listeners.forEach(fn => fn([..._store]));
}

function _persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_store));
  } catch {
    console.warn('localStorage indisponible');
  }
}

/* ── Hook ───────────────────────────────────────────────── */
export function useCR() {
  const [crList, setCRList] = useState(() => [..._store]);

  useEffect(() => {
    _listeners.add(setCRList);
    return () => _listeners.delete(setCRList);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        _store = e.newValue ? JSON.parse(e.newValue) : [];
        _notify();
      } catch {
        _store = [];
        _notify();
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const saveCR = useCallback((crData) => {
    const now    = new Date().toISOString();
    const exists = _store.findIndex(cr => cr.meetingId === crData.meetingId);
    if (exists >= 0) {
      _store = _store.map((cr, i) =>
        i === exists ? { ...cr, ...crData, updatedAt: now } : cr
      );
    } else {
      _store = [
        { id: `cr_${Date.now()}`, createdAt: now, updatedAt: now, ...crData },
        ..._store,
      ];
    }
    _persist();
    _notify();
    return crData.meetingId;
  }, []);

  const deleteCR = useCallback((id) => {
    _store = _store.filter(cr => cr.id !== id);
    _persist();
    _notify();
  }, []);

  const getCRByMeeting = useCallback((meetingId) => {
    return crList.find(cr => cr.meetingId === meetingId) ?? null;
  }, [crList]);

  return { crList, saveCR, deleteCR, getCRByMeeting };
}