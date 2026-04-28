/**
 * services/api.js
 * Couche de communication API globale — Xamio
 */

const API_BASE      = process.env.REACT_APP_API_URL || '';
const ANTHROPIC_API = 'https://api.anthropic.com/v1';

// ── Helper : récupérer le token stocké ────────────────────────────────────────
const getToken = () => localStorage.getItem('xamio_token');

// ── Helper : headers communs avec auth ───────────────────────────────────────
const authHeaders = (extra = {}) => ({
    'Content-Type':  'application/json',
    'Accept':        'application/json',
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    ...extra,
});

// ── Helper : gestion des erreurs HTTP ────────────────────────────────────────
const handleResponse = async (response) => {
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const error = new Error(data?.message || `HTTP ${response.status}`);
        error.response = { status: response.status, data };
        throw error;
    }
    return response.json();
};

/**
 * Client Anthropic — features AI et CompteRendu
 */
export const anthropicClient = {
    sendMessage: async (messages, systemPrompt, maxTokens = 1000) => {
        const response = await fetch(`${ANTHROPIC_API}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model:      'claude-sonnet-4-6',
                max_tokens: maxTokens,
                system:     systemPrompt,
                messages,
            }),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data?.error?.message || `Erreur API (${response.status})`);
        }

        const data = await response.json();
        return data.content?.map(b => b.text || '').join('') || '';
    },
};

/**
 * Client HTTP Xamio — avec authentification automatique
 */
export const api = {
    get: async (endpoint, options = {}) => {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method:  'GET',
            headers: authHeaders(options.headers),
        });
        return handleResponse(response);
    },

    post: async (endpoint, body, options = {}) => {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method:  'POST',
            headers: authHeaders(options.headers),
            body:    JSON.stringify(body),
        });
        return handleResponse(response);
    },

    patch: async (endpoint, body, options = {}) => {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method:  'PATCH',
            headers: authHeaders(options.headers),
            body:    JSON.stringify(body),
        });
        return handleResponse(response);
    },

    put: async (endpoint, body, options = {}) => {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method:  'PUT',
            headers: authHeaders(options.headers),
            body:    JSON.stringify(body),
        });
        return handleResponse(response);
    },

    delete: async (endpoint, options = {}) => {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method:  'DELETE',
            headers: authHeaders(options.headers),
        });
        return handleResponse(response);
    },
};

// Conserver la compatibilité avec l'ancien nom
export const httpClient = api;