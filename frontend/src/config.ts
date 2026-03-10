// Detect if we are running locally or on a server
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// If local, use the Dev backend (8000). If on Render, use the same domain ('').
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (isLocal ? 'http://localhost:8000' : '');
