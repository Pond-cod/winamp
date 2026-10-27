#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Winamp YTM - One-Click Termux Environment Setup Script
# Run this once in Termux on your Android phone!
# ==============================================================================

set -e

echo "=========================================================="
echo "📻 Setting up Winamp YTM Termux Environment..."
echo "=========================================================="

# 1. Update Termux packages
echo "📦 1/5: Updating package lists..."
pkg update -y || apt-get update -y

# 2. Install Node.js LTS, Git, and Process tools
echo "⚙️ 2/5: Installing Node.js LTS, Git, psmisc, and procps..."
pkg install -y nodejs-lts git psmisc procps || apt-get install -y nodejs git psmisc procps

# 3. Configure Termux properties to allow external apps (RUN_COMMAND)
echo "🔑 3/5: Enabling RUN_COMMAND external app permission in Termux..."
mkdir -p "$HOME/.termux"
PROP_FILE="$HOME/.termux/termux.properties"
if [ ! -f "$PROP_FILE" ]; then
    touch "$PROP_FILE"
fi

if grep -q "allow-external-apps" "$PROP_FILE"; then
    sed -i 's/.*allow-external-apps.*/allow-external-apps = true/' "$PROP_FILE"
else
    echo "allow-external-apps = true" >> "$PROP_FILE"
fi

# Reload Termux configuration
if command -v termux-reload-settings >/dev/null 2>&1; then
    termux-reload-settings
fi

# 4. Setup ~/bin directory and copy scripts
echo "📁 4/5: Installing start/stop scripts to ~/bin/..."
mkdir -p "$HOME/bin"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/start_winamp_backend.sh" ]; then
    cp "$SCRIPT_DIR/start_winamp_backend.sh" "$HOME/bin/"
    cp "$SCRIPT_DIR/stop_winamp_backend.sh" "$HOME/bin/"
    chmod +x "$HOME/bin/start_winamp_backend.sh" "$HOME/bin/stop_winamp_backend.sh"
else
    echo "⚠️ Script directory not found, downloading or linking..."
fi

# 5. Install backend dependencies
echo "📦 5/5: Installing server dependencies (express, ytdl-core, etc.)..."
SERVER_DIR=""
POSSIBLE_DIRS=(
    "$HOME/winamp-ytm-app/server"
    "$SCRIPT_DIR/../server"
    "$HOME/winamp/server"
)

for dir in "${POSSIBLE_DIRS[@]}"; do
    if [ -f "$dir/package.json" ]; then
        SERVER_DIR="$dir"
        break
    fi
done

if [ -n "$SERVER_DIR" ]; then
    cd "$SERVER_DIR"
    npm install --omit=dev
    echo "✅ Dependencies installed in $SERVER_DIR"
fi

echo "=========================================================="
echo "🎉 Setup Complete! Winamp YTM is ready to run with Termux."
echo "👉 Now open the Winamp YTM app on your phone."
echo "   It will auto-start the server on launch and stop on exit!"
echo "=========================================================="
