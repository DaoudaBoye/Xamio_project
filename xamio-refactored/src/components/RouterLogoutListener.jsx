// src/components/RouterLogoutListener.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function RouterLogoutListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => navigate('/login', { replace: true });
    window.addEventListener('xamio:logout', handler);
    return () => window.removeEventListener('xamio:logout', handler);
  }, [navigate]);

  return null;
}