const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const envValue = import.meta.env.VITE_API_BASE_URL;

// If we are on a real domain (Render) but the env var says 'localhost', ignore the env var.
const shouldIgnoreEnv = !isLocal && envValue?.includes('localhost');

export const API_BASE_URL = (shouldIgnoreEnv || !envValue)
    ? (isLocal ? 'http://127.0.0.1:8000' : '')
    : envValue;
