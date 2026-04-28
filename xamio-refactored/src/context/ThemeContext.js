/**
 * ThemeContext
 * Gère le basculement entre le thème sombre et clair.
 * Les tokens CSS sont appliqués directement sur :root via style.setProperty.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// Clé de stockage dans localStorage
const STORAGE_KEY = 'xamio_theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Récupère le thème sauvegardé, sinon "dark" par défaut
  const [theme, setTheme] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'dark'
  );

  // Applique le thème en modifiant l'attribut data-theme sur <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(current => current === 'dark' ? 'light' : 'dark');
  }

  const value = {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setDark:  () => setTheme('dark'),
    setLight: () => setTheme('light'),
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme doit être utilisé à l\'intérieur de ThemeProvider');
  }
  return context;
}
