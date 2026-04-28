// src/hooks/useMeetingsSync.js
import { useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';

const POLL_INTERVAL = 30_000; // 30 secondes

export function useMeetingsSync(onUpdate) {
    const intervalRef  = useRef(null);
    const lastFetchRef = useRef(null);

    const fetchMeetings = useCallback(async () => {
        try {
            const data = await api.get('/reunions');
            if (data?.success && data?.data) {
                onUpdate(data.data);
                lastFetchRef.current = new Date().toISOString();
            }
        } catch (e) {
            // Silencieux — ne pas alerter l'utilisateur sur un polling raté
            console.warn('Polling réunions échoué:', e.message);
        }
    }, [onUpdate]);

    const start = useCallback(() => {
        if (intervalRef.current) return; // déjà démarré
        intervalRef.current = setInterval(fetchMeetings, POLL_INTERVAL);
    }, [fetchMeetings]);

    const stop = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    // Pause quand l'onglet est en arrière-plan
    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden) {
                stop();
            } else {
                fetchMeetings(); // refetch immédiat au retour
                start();
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [start, stop, fetchMeetings]);

    return { start, stop, fetchNow: fetchMeetings };
}