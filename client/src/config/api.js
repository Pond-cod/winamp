// Base URL configuration for Backend API (Search & Audio Stream)

// Production Cloud URL on Render.com
export const DEFAULT_CLOUD_BACKEND = 'https://winamp-ytm-server.onrender.com';

export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('winamp_backend_url');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }

    const hostname = window.location.hostname || '';
    // If running in development on PC (localhost:5173 or 127.0.0.1)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:4000';
    }

    // Default to Render Cloud Backend
    return DEFAULT_CLOUD_BACKEND;
  }
  return DEFAULT_CLOUD_BACKEND;
};

// Dynamic string object so ${API_BASE_URL} always returns the latest backend URL
export const API_BASE_URL = {
  toString: () => getApiBaseUrl(),
  valueOf: () => getApiBaseUrl()
};

export const setBackendUrl = (url) => {
  if (typeof window !== 'undefined') {
    const cleanUrl = url ? url.trim().replace(/\/+$/, '') : '';
    if (cleanUrl) {
      localStorage.setItem('winamp_backend_url', cleanUrl);
    } else {
      localStorage.removeItem('winamp_backend_url');
    }
  }
};
