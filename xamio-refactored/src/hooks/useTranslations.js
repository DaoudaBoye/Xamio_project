// hooks/useTranslations.js
import { useState, useEffect, useCallback } from 'react';

const cache = {};

export function useTranslations() {
  const [lang, setLang]     = useState(localStorage.getItem('xamio_lang') || 'fr');
  const [trans, setTrans]   = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cache[lang]) {
      setTrans(cache[lang]);
      setLoading(false);
      return;
    }

    fetch(`/api/translations/${lang}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        cache[lang] = data;
        setTrans(data);
        setLoading(false);
      });
  }, [lang]);

  const changeLanguage = useCallback(newLang => {
    localStorage.setItem('xamio_lang', newLang);
    setLang(newLang);
  }, []);

  // Fonction t('team.add_member')
  const t = useCallback((key) => {
    const keys = key.split('.');
    return keys.reduce((obj, k) => obj?.[k], trans) ?? key;
  }, [trans]);

  return { t, lang, changeLanguage, loading };
}