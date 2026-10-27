#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Winamp YTM - Start Backend Server in Termux
# Automatically called by Winamp Android App on launch
# ==============================================================================

# Search possible locations of the server
SERVER_DIR=""
POSSIBLE_DIRS=(
    "$HOME/winamp-ytm-app/server"
    "$HOME/winamp/server"
    "/sdcard/winamp-ytm-app/server"
    "/sdcard/winamp/server"
    "$HOME/server"
)

for dir in "${POSSIBLE_DIRS[@]}"; do
    if [ -f "$dir/server.js" ]; then
        SERVER_DIR="$dir"
        break
    fi
done

if [ -z "$SERVER_DIR" ]; then
    echo "⚠️ [ERROR] Cannot find server.js in expected directories."
    exit 1
fi

# Check if port 4000 is already active
if command -v fuser >/dev/null 2>&1; then
    if fuser 4000/tcp >/dev/null 2>&1; then
        echo "✅ [INFO] Winamp Backend is already running on port 4000."
        exit 0
    fi
fi

# Also check with pgrep
if pgrep -f "node.*server\.js" >/dev/null 2>&1; then
    echo "✅ [INFO] Node process is already running."
    exit 0
fi

echo "🚀 [STARTING] Launching Winamp Backend from $SERVER_DIR..."
cd "$SERVER_DIR" || exit 1

# Start in background with nohup, logging to ~/winamp_backend.log
LOG_FILE="$HOME/winamp_backend.log"
nohup node server.js > "$LOG_FILE" 2>&1 &
PID=$!

echo $PID > "$HOME/.winamp_backend.pid"
echo "🎵 [OK] Winamp Backend started with PID $PID on port 4000."
