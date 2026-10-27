import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { API_BASE_URL } from '../config/api';

/**
 * Pings backend heartbeat to keep watchdog alive while app is active
 */
export const pingHeartbeat = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/heartbeat`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' }
    });
    return res.ok;
  } catch {
    return false;
  }
};

/**
 * Sends dual-tier shutdown signal to stop backend process in Termux
 */
export const requestBackendShutdown = async () => {
  console.log('[LIFECYCLE] Requesting backend shutdown...');

  // 1. Web Tier: HTTP Beacon / Fetch POST to /api/shutdown
  try {
    const shutdownUrl = `${API_BASE_URL}/api/shutdown`;
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(shutdownUrl);
    } else {
      await fetch(shutdownUrl, {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('[LIFECYCLE] HTTP shutdown error:', err);
  }

  // 2. Native Tier: Call TermuxBridge plugin if on Android
  try {
    if (Capacitor.isNativePlatform() && Capacitor.Plugins?.TermuxBridge) {
      await Capacitor.Plugins.TermuxBridge.stopBackend();
    }
  } catch (err) {
    console.warn('[LIFECYCLE] Native TermuxBridge error:', err);
  }
};

/**
 * Safely exits the application, stopping backend first
 */
export const exitWinampApp = async () => {
  await requestBackendShutdown();
  setTimeout(async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await CapApp.exitApp();
      } else {
        window.close();
      }
    } catch {
      window.location.reload();
    }
  }, 250);
};

/**
 * Explicitly triggers Termux backend launch from native bridge
 */
export const startTermuxBackend = async () => {
  try {
    if (Capacitor.isNativePlatform() && Capacitor.Plugins?.TermuxBridge) {
      await Capacitor.Plugins.TermuxBridge.startBackend();
    }
  } catch (err) {
    console.warn('[LIFECYCLE] Failed to start Termux backend:', err);
  }
};
