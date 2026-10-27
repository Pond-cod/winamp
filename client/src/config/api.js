// Base URL configuration for Backend API (Search & Audio Stream)

export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('winamp_backend_url');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }

    // If accessed via LAN IP on mobile/browser (e.g. http://192.168.1.50:5173), use that IP for backend
    const hostname = window.location.hostname || 'localhost';
    return `http://${hostname}:4000`;
  }
  return 'http://localhost:4000';
};

// Dynamic string object so ${API_BASE_URL} always returns the latest backend URL
export const API_BASE_URL = {
  toString: () => getApiBaseUrl(),
  valueOf: () => getApiBaseUrl()
};

export const setBackendUrl = (url) => {
  if (typeof window !== 'undefined') {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    localStorage.setItem('winamp_backend_url', cleanUrl);
  }
};

