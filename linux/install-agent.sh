#!/usr/bin/env bash
# install-agent.sh
#
# Installs the htpc-agent on a Linux HTPC that is NOT the Next.js host.
# Run this on the HTPC itself. The Next.js server runs on a separate machine.
#
# Usage:
#   bash install-agent.sh [--port 3001] [--scripts ~/bin]
#
# What it does:
#   1. Copies the agent files to ~/htpc-agent/
#   2. Installs npm dependencies (socket.io only)
#   3. Installs and enables the systemd user service

set -euo pipefail

# ── Defaults ──────────────────────────────────────────────────────────────────
AGENT_PORT="${AGENT_PORT:-3001}"
SCRIPT_PREFIX="${SCRIPT_PREFIX:-$HOME/bin}"
INSTALL_DIR="$HOME/htpc-agent"
SERVICE_NAME="htpc-agent"
SERVICE_FILE="$HOME/.config/systemd/user/${SERVICE_NAME}.service"

# ── Parse args ────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --port)    AGENT_PORT="$2"; shift 2 ;;
    --scripts) SCRIPT_PREFIX="$2"; shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

# ── Resolve script directory (works whether run directly or via scp'd copy) ──
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENT_SRC="$SCRIPT_DIR/htpc-agent"

echo "==> Installing htpc-agent"
echo "    Install dir : $INSTALL_DIR"
echo "    Port        : $AGENT_PORT"
echo "    Scripts     : $SCRIPT_PREFIX"
echo ""

# ── 1. Copy agent files ───────────────────────────────────────────────────────
mkdir -p "$INSTALL_DIR"
cp "$AGENT_SRC/index.mjs"    "$INSTALL_DIR/index.mjs"
cp "$AGENT_SRC/package.json" "$INSTALL_DIR/package.json"
echo "==> Copied agent files to $INSTALL_DIR"

# ── 2. Install dependencies ───────────────────────────────────────────────────
echo "==> Installing npm dependencies..."
cd "$INSTALL_DIR"
npm install --omit=dev
cd - > /dev/null
echo "==> Dependencies installed"

# ── 3. Write systemd service ──────────────────────────────────────────────────
mkdir -p "$(dirname "$SERVICE_FILE")"
cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=HTPC Agent (htpc-remote script bridge)
After=network.target

[Service]
ExecStart=/usr/bin/node ${INSTALL_DIR}/index.mjs
WorkingDirectory=${INSTALL_DIR}
Environment=LINUX_HTPC_AGENT_PORT=${AGENT_PORT}
Environment=SHELL_SCRIPT_PREFIX=${SCRIPT_PREFIX}
Restart=on-failure

[Install]
WantedBy=default.target
EOF
echo "==> Wrote $SERVICE_FILE"

# ── 4. Enable and start ───────────────────────────────────────────────────────
systemctl --user daemon-reload
systemctl --user enable --now "$SERVICE_NAME"
echo ""
echo "==> htpc-agent is running on port $AGENT_PORT"
echo "    Logs: journalctl --user -u $SERVICE_NAME -f"
