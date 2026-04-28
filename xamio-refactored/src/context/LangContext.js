// src/context/LangContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api';

function authHeaders() {
  const token = localStorage.getItem('xamio_token');
  return {
    'Content-Type':  'application/json',
    'Accept':        'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

const cache      = {};
const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang,    setLang]    = useState(localStorage.getItem('xamio_lang') || 'fr');
  const [trans,   setTrans]   = useState({});
  const [loading, setLoading] = useState(true); // ← évite le flash de clés avant chargement

  useEffect(() => {
    if (cache[lang]) {
      setTrans(cache[lang]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`${API_BASE}/translations/${lang}`)
      .then(r => r.json())
      .then(res => {
        const data   = res.data || res;
        cache[lang]  = data;
        setTrans(data);
      })
      .catch(() => {
        // Fallback : si le chargement échoue, essayer le français
        if (lang !== 'fr' && cache['fr']) {
          setTrans(cache['fr']);
        }
      })
      .finally(() => setLoading(false));
  }, [lang]);

  const t = useCallback((key, params = {}) => {
    let value = key.split('.').reduce((obj, k) => obj?.[k], trans);
    // Si la clé n'existe pas, retourner la clé (jamais undefined affiché)
    if (value === undefined || value === null) return key;
    // Remplacement des :param
    Object.entries(params).forEach(([k, v]) => {
      value = String(value).replace(`:${k}`, v);
    });
    return value;
  }, [trans]);

  const changeLanguage = useCallback(async (newLang) => {
    localStorage.setItem('xamio_lang', newLang);
    setLang(newLang);
    try {
      await fetch(`${API_BASE}/users/me/locale`, {
        method:  'PATCH',
        headers: authHeaders(),
        body:    JSON.stringify({ locale: newLang }),
      });
    } catch { /* silencieux */ }
  }, []);

    return (
    <LangContext.Provider value={{ t, lang, changeLanguage, loading }}>
        {loading ? null : children}  {/* ← ajouter cette condition */}
    </LangContext.Provider>
    );
}

export function useLang() {
  const context = useContext(LangContext);
  if (!context) {
    throw new Error('useLang doit être utilisé dans un LangProvider');
  }
  return context;
}