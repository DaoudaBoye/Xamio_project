import { useEffect, useRef, useCallback } from 'react';

const INACTIVITY_LIMIT = 2 * 60 * 60 * 1000; // 2 heures

export function useInactivityLogout() {
  const timerRef    = useRef(null);
  const isActiveRef = useRef(true); // ← évite de déconnecter si déjà déconnecté

  // ← Pas de useNavigate ici — navigate instable causait des re-renders
  //   La déconnexion est gérée par AuthContext via l'événement xamio:logout
  //   qui redirige vers /login automatiquement
  const logout = useCallback(() => {
    if (!isActiveRef.current) return;
    if (!localStorage.getItem('xamio_token')) return; // ← déjà déconnecté

    isActiveRef.current = false;
    localStorage.removeItem('xamio_token');
    localStorage.removeItem('xamio_user');
    window.dispatchEvent(new Event('xamio:logout'));
  }, []); // ← [] : aucune dépendance instable

  const resetTimer = useCallback(() => {
    if (!isActiveRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, INACTIVITY_LIMIT);
  }, [logout]); // ← logout est stable grâce à []

  useEffect(() => {
    isActiveRef.current = !!localStorage.getItem('xamio_token');

    if (!isActiveRef.current) return; // ← pas de timer si pas connecté

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer(); // ← démarrer le timer initial

    // Réactiver si l'utilisateur se reconnecte
    const handleLogin = () => {
      isActiveRef.current = true;
      resetTimer();
    };

    // Stopper si déconnexion externe (autre onglet, AuthContext)
    const handleLogout = () => {
      isActiveRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };

    window.addEventListener('xamio:login',  handleLogin);
    window.addEventListener('xamio:logout', handleLogout);

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      window.removeEventListener('xamio:login',  handleLogin);
      window.removeEventListener('xamio:logout', handleLogout);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);
}