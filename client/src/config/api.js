// Base URL configuration for Backend API (Search & Audio Stream)
import { Capacitor } from '@capacitor/core';

// Production Vercel Domain
export const DEFAULT_VERCEL_BACKEND = 'https://winamp-pond-cod.vercel.app';

export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('winamp_backend_url');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }

    // In native Android APK: connect to Vercel production backend
    if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
      return DEFAULT_VERCEL_BACKEND;
    }

    const hostname = window.location.hostname || '';
    // If running in development on PC (localhost:5173 or 127.0.0.1)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:4000';
    }

    // When deployed on Vercel or web: use the current origin
    if (window.location.origin && window.location.origin.startsWith('http')) {
      return window.location.origin;
    }

    return DEFAULT_VERCEL_BACKEND;
  }
  return DEFAULT_VERCEL_BACKEND;
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
