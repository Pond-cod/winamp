// Base URL configuration for Backend API (Search & Audio Stream)
import { Capacitor } from '@capacitor/core';

// Home PC IP on port 4000 (Tested & Active)
export const DEFAULT_LOCAL_IP = 'http://192.168.1.148:4000';
export const DEFAULT_VERCEL_BACKEND = 'https://winamp-ecru.vercel.app';

export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('winamp_backend_url');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }

    // In native Android APK on local WiFi: default to home PC backend
    if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
      return DEFAULT_LOCAL_IP;
    }

    const hostname = window.location.hostname || '';
    // If running in development on PC (localhost:5173 or 127.0.0.1)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:4000';
    }

    // When deployed on web: default to Vercel Backend
    return DEFAULT_VERCEL_BACKEND;
  }
  return DEFAULT_LOCAL_IP;
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
