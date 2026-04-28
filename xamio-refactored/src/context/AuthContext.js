import React, {
  createContext, useContext, useState,
  useCallback, useEffect, useRef,
} from 'react';

const API_BASE = process.env.REACT_APP_API_URL || '/api';
const REFRESH_INTERVAL     = 20 * 60 * 60 * 1000; // 20h
const MAX_REFRESH_FAILURES = 5;

async function apiPost(path, body) {
  const token = localStorage.getItem('xamio_token');
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && (
      data.code === 'SESSION_TIMEOUT' ||
      data.code === 'TOKEN_EXPIRED'   ||
      data.code === 'SESSION_NOT_FOUND'
    )) {
      window.dispatchEvent(new Event('xamio:logout'));
      throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
    }

    const errors  = data.errors;
    const message = errors
      ? Object.values(errors).flat()[0]
      : data.message || 'Identifiants incorrects.';
    throw new Error(message);
  }

  return data;
}

const ROLE_LABELS = {
  'Super Admin':      'Super Admin',
  'Admin Entreprise': 'Administrateur',
  'Directeur':        'Directeur',
  'Manager':          'Manager',
  'Assistant':        'Assistant',
  'Assistante':       'Assistante',
  'Employé':          'Employé',
  super_admin:        'Super Admin',
  admin:              'Administrateur',
  directeur:          'Directeur',
  manager:            'Manager',
  assistante:         'Assistante',
  employe:            'Employé',
};

function adaptUser(laravelUser) {
  const prenom = laravelUser.util_prenom || laravelUser.prenom || '';
  const nom    = laravelUser.util_nom    || laravelUser.nom    || '';
  const name   = laravelUser.nom_complet || `${prenom} ${nom}`.trim();
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const roleRaw  = laravelUser.role || '';
  const org      = laravelUser.organisation;

  return {
    id:          laravelUser.id,
    name,
    initials,
    email:       laravelUser.email,
    twofa:       laravelUser.twofa_actif || false,
    role:        ROLE_LABELS[roleRaw] || roleRaw,
    roleRaw,
    role_id:     laravelUser.role_id || null,
    company:     org?.org_nom    || laravelUser.entreprise?.nom || 'XAMIO',
    companyId:   org?.org_id     || laravelUser.company_id      || null,
    orgPays:     org?.org_pays   || '',
    orgActif:    org?.org_actif  ?? true,
    plan:        laravelUser.plan || laravelUser.entreprise?.plan || 'gratuit',
    appStatut:   laravelUser.app_statut || 'actif',
  };
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(() => {
    try {
      const stored = localStorage.getItem('xamio_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const refreshFailures                 = useRef(0);
  const isLoggingOutRef                 = useRef(false);

  // ── Centralised state clear ───────────────────────────────────────────────
  // FIX : ne dispatche plus xamio:logout — c'est soit l'appelant (apiPost/refresh)
  // qui l'a déjà dispatché, soit logout() manuel qui le fera après.
  const clearAuth = useCallback(() => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    localStorage.removeItem('xamio_token');
    localStorage.removeItem('xamio_user');
    setUser(null);
    setIsLoggingOut(false);
    refreshFailures.current = 0;

    // ← PAS de dispatchEvent ici : évite la boucle clearAuth → xamio:logout → handler → clearAuth

    setTimeout(() => { isLoggingOutRef.current = false; }, 1000);
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const data = await apiPost('/auth/login', { email, password });
    const { user: laravelUser, token } = data.data;

    localStorage.setItem('xamio_token', token);
    const adapted = adaptUser(laravelUser);
    localStorage.setItem('xamio_user', JSON.stringify(adapted));
    setUser(adapted);
    refreshFailures.current = 0;
    isLoggingOutRef.current = false;

    window.dispatchEvent(new Event('xamio:login'));
    return adapted;
  }, []);

  // ── Manual logout ─────────────────────────────────────────────────────────
  // FIX : clearAuth d'abord, dispatch ensuite — une seule fois, proprement
  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    try { await apiPost('/auth/logout', {}); } catch (_) {}
    clearAuth();
    window.dispatchEvent(new Event('xamio:logout')); // ← ici seulement
  }, [clearAuth]);

  // ── Listen for xamio:logout (venant de apiPost ou du refresh) ────────────
  useEffect(() => {
    const handler = () => {
      if (isLoggingOutRef.current) return;

      const token = localStorage.getItem('xamio_token');
      if (!token && !user) return; // déjà déconnecté

      isLoggingOutRef.current = true;
      localStorage.removeItem('xamio_token');
      localStorage.removeItem('xamio_user');
      setUser(null);
      setIsLoggingOut(false);
      refreshFailures.current = 0;
      setTimeout(() => { isLoggingOutRef.current = false; }, 1000);
    };

    window.addEventListener('xamio:logout', handler);
    return () => window.removeEventListener('xamio:logout', handler);
  }, [user]);

  // ── Auto-refresh toutes les 20h ───────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const refreshToken = async () => {
      const token = localStorage.getItem('xamio_token');
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept:         'application/json',
            Authorization:  `Bearer ${token}`,
          },
        });

        // FIX : check strict sur les codes — pas de msg.includes('token') trop large
        if (res.status === 401) {
          const data = await res.json().catch(() => ({}));
          const code = data?.code || '';
          const isExpired =
            code === 'SESSION_TIMEOUT'   ||
            code === 'TOKEN_EXPIRED'     ||
            code === 'SESSION_NOT_FOUND';

          if (isExpired) {
            console.warn('[Auth] Token expiré → déconnexion');
            clearAuth();
            window.dispatchEvent(new Event('xamio:logout'));
          }
          // 401 métier → on ne déconnecte pas
          return;
        }

        // FIX : reset failures dès que le serveur répond 2xx, avant même de lire data
        if (!res.ok) {
          refreshFailures.current += 1;
          console.warn(`[Auth] Refresh échoué ${refreshFailures.current}/${MAX_REFRESH_FAILURES}`);
          if (refreshFailures.current >= MAX_REFRESH_FAILURES) {
            console.warn('[Auth] Trop d\'échecs → déconnexion');
            clearAuth();
            window.dispatchEvent(new Event('xamio:logout'));
          }
          return;
        }

        // 2xx : reset immédiat du compteur
        refreshFailures.current = 0;

        const data = await res.json().catch(() => ({}));
        if (data?.success && data?.data?.token) {
          localStorage.setItem('xamio_token', data.data.token);
          console.info('[Auth] Token rafraîchi avec succès.');
        }
      } catch (err) {
        refreshFailures.current += 1;
        console.warn(`[Auth] Erreur réseau refresh ${refreshFailures.current}/${MAX_REFRESH_FAILURES}:`, err.message);
        if (refreshFailures.current >= MAX_REFRESH_FAILURES) {
          console.warn('[Auth] Réseau indisponible → déconnexion');
          clearAuth();
          window.dispatchEvent(new Event('xamio:logout'));
        }
      }
    };

    const interval = setInterval(refreshToken, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [user, clearAuth]);

  const raw = user?.roleRaw || '';
  const isAdmin      = ['Super Admin', 'Admin Entreprise', 'super_admin', 'admin'].includes(raw);
  const isDirecteur  = ['Directeur',  'directeur'].includes(raw);
  const isManager    = ['Manager',    'manager'].includes(raw);
  const isAssistante = ['Assistant',  'Assistante', 'assistante', 'assistant'].includes(raw);
  const isEmploye    = true;

  return (
    <AuthContext.Provider value={{
      user,
      isAuth: !!user,
      isLoggingOut,
      login,
      logout,
      isAdmin,
      isDirecteur,
      isManager,
      isAssistante,
      isEmploye,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

export default AuthContext;