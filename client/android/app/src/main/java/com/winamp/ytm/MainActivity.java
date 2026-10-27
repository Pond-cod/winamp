package com.winamp.ytm;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "WinampMainActivity";
    private static final String TERMUX_PACKAGE = "com.termux";
    private static final String TERMUX_SERVICE = "com.termux.app.RunCommandService";
    private static final String TERMUX_ACTION = "com.termux.RUN_COMMAND";

    // Path inside Termux
    private static final String TERMUX_BASH = "/data/data/com.termux/files/usr/bin/bash";
    private static final String TERMUX_WORKDIR = "/data/data/com.termux/files/home";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Register local plugin so JS can communicate with native TermuxBridge
        registerPlugin(TermuxBridgePlugin.class);
        super.onCreate(savedInstanceState);

        // Start CleanupService to detect when user swipes away app from Recents
        try {
            Intent cleanupIntent = new Intent(this, CleanupService.class);
            startService(cleanupIntent);
        } catch (Throwable t) {
            Log.e(TAG, "Could not start CleanupService", t);
        }

        // Auto-start Backend on app launch
        startBackendStatic(this);
    }

    @Override
    public void onDestroy() {
        Log.i(TAG, "MainActivity onDestroy called. Shutting down Termux backend...");
        stopBackendStatic(this);
        super.onDestroy();
    }

    /**
     * Start the Node.js backend inside Termux using RUN_COMMAND intent
     */
    public static void startBackendStatic(Context context) {
        if (context == null) return;
        Log.i(TAG, "Executing startBackendStatic...");

        // First, check if backend is already alive before sending intent
        new Thread(() -> {
            try {
                URL url = new URL("http://127.0.0.1:4000/api/health");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(500);
                conn.setReadTimeout(500);
                int code = conn.getResponseCode();
                conn.disconnect();
                if (code == 200) {
                    Log.i(TAG, "Backend is already online on port 4000. No need to start.");
                    return;
                }
            } catch (Throwable ignored) {
                // Not running yet, proceed with Termux launch
            }

            sendTermuxCommand(
                context,
                TERMUX_BASH,
                new String[]{
                    "-c",
                    "if [ -f ~/bin/start_winamp_backend.sh ]; then bash ~/bin/start_winamp_backend.sh; else cd ~/winamp-ytm-app/server 2>/dev/null && nohup node server.js >/dev/null 2>&1 & fi"
                }
            );
        }).start();
    }

    /**
     * Stop the Node.js backend using HTTP Graceful Shutdown + Termux pkill
     */
    public static void stopBackendStatic(Context context) {
        if (context == null) return;
        Log.i(TAG, "Executing stopBackendStatic (Dual-Tier Shutdown)...");

        // Tier 1: Graceful HTTP shutdown request
        new Thread(() -> {
            try {
                URL url = new URL("http://127.0.0.1:4000/api/shutdown");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setConnectTimeout(600);
                conn.setReadTimeout(600);
                conn.getResponseCode();
                conn.disconnect();
                Log.i(TAG, "HTTP shutdown request sent to localhost:4000");
            } catch (Throwable ignored) {}
        }).start();

        // Tier 2: Termux kill command via RUN_COMMAND intent
        sendTermuxCommand(
            context,
            TERMUX_BASH,
            new String[]{
                "-c",
                "if [ -f ~/bin/stop_winamp_backend.sh ]; then bash ~/bin/stop_winamp_backend.sh; else pkill -9 -f 'node.*server.js'; fi"
            }
        );
    }

    /**
     * Sends execution intent to Termux's RunCommandService
     */
    private static void sendTermuxCommand(Context context, String executablePath, String[] args) {
        try {
            Intent intent = new Intent();
            intent.setClassName(TERMUX_PACKAGE, TERMUX_SERVICE);
            intent.setAction(TERMUX_ACTION);
            intent.putExtra("com.termux.RUN_COMMAND_PATH", executablePath);
            intent.putExtra("com.termux.RUN_COMMAND_ARGUMENTS", args != null ? args : new String[0]);
            intent.putExtra("com.termux.RUN_COMMAND_WORKDIR", TERMUX_WORKDIR);
            intent.putExtra("com.termux.RUN_COMMAND_BACKGROUND", true);
            intent.putExtra("com.termux.RUN_COMMAND_SESSION_ACTION", "0");

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                try {
                    context.startForegroundService(intent);
                } catch (Throwable t) {
                    context.startService(intent);
                }
            } else {
                context.startService(intent);
            }
            Log.i(TAG, "Dispatched Termux RUN_COMMAND intent: " + executablePath);
        } catch (Throwable e) {
            Log.w(TAG, "Termux RUN_COMMAND intent could not be sent (Termux might not be installed or permission missing): " + e.getMessage());
        }
    }
}
