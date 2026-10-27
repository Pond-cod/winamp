#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Winamp YTM - Stop Backend Server in Termux
# Automatically called by Winamp Android App on exit/destroy
# ==============================================================================

echo "🛑 [STOPPING] Terminating Winamp Backend Server..."

# 1. Kill by PID file if exists
PID_FILE="$HOME/.winamp_backend.pid"
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE" 2>/dev/null)
    if [ -n "$PID" ]; then
        kill "$PID" 2>/dev/null
        sleep 0.2
        kill -9 "$PID" 2>/dev/null
    fi
    rm -f "$PID_FILE"
fi

# 2. Force kill any remaining node server.js processes
pkill -9 -f "node.*server\.js" 2>/dev/null

# 3. Release TCP port 4000 if fuser is installed
if command -v fuser >/dev/null 2>&1; then
    fuser -k -9 4000/tcp 2>/dev/null
fi

echo "✅ [STOPPED] Winamp Backend stopped and port 4000 released. No background processes remaining."
