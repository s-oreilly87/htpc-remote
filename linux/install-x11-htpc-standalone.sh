#!/usr/bin/env bash
# install-x11-htpc-standalone.sh
#
# Installs the htpc-agent on an X11 HTPC that is NOT the Next.js host.
# Run this on the HTPC itself. The Next.js server runs on a separate machine.
#
# Installs:
#   - htpc-agent (Node HTTP/Socket.io bridge) → ~/htpc-agent/
#   - Shared scripts (no KDE/Wayland-specific ones) → ~/bin/
#   - systemd user services: htpc-agent, ydotoold
#
# Not installed (X11 limitations):
#   - htpc-res (kscreen-doctor display switching — Wayland/KDE only)
#   - kwin-close-window.sh (KDE qdbus — not available on X11)
#   - denon-remap.service (PipeWire remap sink — install manually if using PipeWire)
#
# Prerequisites (install manually before running this script):
#   - Node.js 18+
#   - ydotool (build from source — see linux/README.md)
#
# Usage:
#   bash install-x11-htpc-standalone.sh [--port 3001] [--scripts ~/bin]

set -euo pipefail

# ── Defaults ──────────────────────────────────────────────────────────────────
AGENT_PORT="${AGENT_PORT:-3001}"
SCRIPT_PREFIX="${SCRIPT_PREFIX:-$HOME/bin}"
AGENT_INSTALL_DIR="$HOME/htpc-agent"
SERVICE_DIR="$HOME/.config/systemd/user"

# ── Parse args ────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --port)    AGENT_PORT="$2";    shift 2 ;;
    --scripts) SCRIPT_PREFIX="$2"; shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> htpc-agent (X11 standalone)"
echo "    Agent dir  : $AGENT_INSTALL_DIR"
echo "    Port       : $AGENT_PORT"
echo "    Scripts    : $SCRIPT_PREFIX"
echo ""

# ── 1. Copy agent files ───────────────────────────────────────────────────────
echo "==> Installing agent..."
mkdir -p "$AGENT_INSTALL_DIR"
cp "$SCRIPT_DIR/agent/index.mjs"    "$AGENT_INSTALL_DIR/index.mjs"
cp "$SCRIPT_DIR/agent/package.json" "$AGENT_INSTALL_DIR/package.json"

cd "$AGENT_INSTALL_DIR"
npm install --omit=dev
cd - > /dev/null
echo "    Done"

# ── 2. Copy shared scripts ────────────────────────────────────────────────────
echo "==> Installing shared scripts to $SCRIPT_PREFIX..."
mkdir -p "$SCRIPT_PREFIX"

cp "$SCRIPT_DIR/scripts/shared/htpc-audio"        "$SCRIPT_PREFIX/"
cp "$SCRIPT_DIR/scripts/shared/htpc-key"          "$SCRIPT_PREFIX/"
cp "$SCRIPT_DIR/scripts/shared/htpc-kill"         "$SCRIPT_PREFIX/"
cp "$SCRIPT_DIR/scripts/shared/htpc-launch"       "$SCRIPT_PREFIX/"
cp "$SCRIPT_DIR/scripts/shared/htpc-listen"       "$SCRIPT_PREFIX/"
cp "$SCRIPT_DIR/scripts/shared/kodi-alsa"         "$SCRIPT_PREFIX/"
cp "$SCRIPT_DIR/scripts/shared/denon-remap-init"  "$SCRIPT_PREFIX/"
cp "$SCRIPT_DIR/scripts/shared/plexamp"           "$SCRIPT_PREFIX/"
cp "$SCRIPT_DIR/scripts/shared/plexamp-wine"      "$SCRIPT_PREFIX/"
cp "$SCRIPT_DIR/scripts/shared/qobuz-wine"        "$SCRIPT_PREFIX/"
cp "$SCRIPT_DIR/scripts/shared/qobuzapp-wine-url" "$SCRIPT_PREFIX/"

chmod +x "$SCRIPT_PREFIX"/htpc-* "$SCRIPT_PREFIX"/kodi-alsa \
          "$SCRIPT_PREFIX"/plexamp* "$SCRIPT_PREFIX"/qobuz* \
          "$SCRIPT_PREFIX"/denon-remap-init
echo "    Done (display-switching and KDE scripts skipped)"

# ── 3. EDID firmware ──────────────────────────────────────────────────────────
echo ""
echo "==> EDID setup (requires sudo):"
echo "    sudo mkdir -p /lib/firmware/edid"
echo "    sudo cp '$SCRIPT_DIR/edid/denon-1440p120.edid' /lib/firmware/edid/"
echo "    Then add to /etc/default/grub:"
echo "      GRUB_CMDLINE_LINUX_DEFAULT=\"... drm.edid_firmware=HDMI-A-1:edid/denon-1440p120.edid\""
echo "    sudo update-grub"
echo "    (Reboot for EDID change to take effect)"
echo ""

# ── 4. Systemd user services ──────────────────────────────────────────────────
echo "==> Writing systemd user services..."
mkdir -p "$SERVICE_DIR"

# htpc-agent.service
cat > "$SERVICE_DIR/htpc-agent.service" <<EOF
[Unit]
Description=HTPC Agent (htpc-remote script bridge)
After=network.target

[Service]
ExecStart=/usr/bin/node ${AGENT_INSTALL_DIR}/index.mjs
WorkingDirectory=${AGENT_INSTALL_DIR}
Environment=LINUX_HTPC_AGENT_PORT=${AGENT_PORT}
Environment=SHELL_SCRIPT_PREFIX=${SCRIPT_PREFIX}
Restart=on-failure

[Install]
WantedBy=default.target
EOF

# ydotoold.service
cat > "$SERVICE_DIR/ydotoold.service" <<EOF
[Unit]
Description=ydotool daemon for input automation
After=graphical-session.target

[Service]
ExecStart=/usr/local/bin/ydotoold
Restart=always

[Install]
WantedBy=default.target
EOF

echo "    Written htpc-agent.service, ydotoold.service"

# ── 5. Enable services ────────────────────────────────────────────────────────
echo "==> Enabling services..."
systemctl --user daemon-reload
systemctl --user enable --now htpc-agent
systemctl --user enable --now ydotoold

echo ""
echo "✓  Install complete"
echo ""
echo "   htpc-agent running on port $AGENT_PORT"
echo "   Logs: journalctl --user -u htpc-agent -f"
echo ""
echo "   Note: Display-switching (htpc-res) is not available on X11."
echo "   The host's HTPC panel will show keystroke and media controls only."
