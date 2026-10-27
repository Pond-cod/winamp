package com.winamp.ytm;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.util.Log;

/**
 * CleanupService monitors app removal from the Android Recent Apps task list.
 * When the user swipes away the Winamp app, onTaskRemoved is triggered by Android OS,
 * allowing us to stop the Termux backend and ensure no background process is left running.
 */
public class CleanupService extends Service {
    private static final String TAG = "WinampCleanupService";

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_NOT_STICKY;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        Log.i(TAG, "Winamp app removed from recents. Terminating Termux backend...");
        MainActivity.stopBackendStatic(this);
        stopSelf();
        super.onTaskRemoved(rootIntent);
    }
}
