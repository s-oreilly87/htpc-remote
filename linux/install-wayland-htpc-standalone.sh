#!/usr/bin/env bash
# install-wayland-htpc-standalone.sh
#
# Installs the htpc-agent on a KDE Wayland HTPC that is NOT the Next.js host.
# Run this on the HTPC itself. The Next.js server runs on a separate machine.
#
# Installs:
#   - htpc-agent (Node HTTP/Socket.io bridge) → ~/htpc-agent/
#   - All scripts (shared + KDE/Wayland-specific) → ~/bin/
#   - systemd user services: htpc-agent, ydotoold, denon-remap
#
# Prerequisites (install manually before running this script):
#   - Node.js 18+
#   - ydotool (build from source — see linux/README.md)
#   - PipeWire + PipeWire-pulse running
#
# Usage:
#   bash install-wayland-htpc-standalone.sh [--port 3001] [--scripts ~/bin] [--repo /path/to/repo]

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

echo "==> htpc-agent (Wayland standalone)"
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

# ── 2. Copy scripts ───────────────────────────────────────────────────────────
echo "==> Installing scripts to $SCRIPT_PREFIX..."
mkdir -p "$SCRIPT_PREFIX"

# Shared scripts (work on Wayland and X11)
cp "$SCRIPT_DIR/scripts/shared/htpc-audio"      "$SCRIPT_PREFIX/"
cp "$SCRIPT_DIR/scripts/shared/htpc-key"        "$SCRIPT_PREFIX/"
cp "$SCRIPT_DIR/scripts/shared/htpc-kill"       "$SCRIPT_PREFIX/"
cp "$SCRIPT_DIR/scripts/shared/htpc-launch"     "$SCRIPT_PREFIX/"
cp "$SCRIPT_DIR/scripts/shared/htpc-listen"     "$SCRIPT_PREFIX/"
cp "$SCRIPT_DIR/scripts/shared/kodi-alsa"       "$SCRIPT_PREFIX/"
cp "$SCRIPT_DIR/scripts/shared/denon-remap-init" "$SCRIPT_PREFIX/"
cp "$SCRIPT_DIR/scripts/shared/plexamp"         "$SCRIPT_PREFIX/"
cp "$SCRIPT_DIR/scripts/shared/plexamp-wine"    "$SCRIPT_PREFIX/"
cp "$SCRIPT_DIR/scripts/shared/qobuz-wine"      "$SCRIPT_PREFIX/"
cp "$SCRIPT_DIR/scripts/shared/qobuzapp-wine-url" "$SCRIPT_PREFIX/"

# Wayland/KDE-specific scripts
cp "$SCRIPT_DIR/scripts/wayland/htpc-res"            "$SCRIPT_PREFIX/"
cp "$SCRIPT_DIR/scripts/wayland/kwin-close-window.sh" "$SCRIPT_PREFIX/"

chmod +x "$SCRIPT_PREFIX"/htpc-* "$SCRIPT_PREFIX"/kodi-alsa \
          "$SCRIPT_PREFIX"/plexamp* "$SCRIPT_PREFIX"/qobuz* \
          "$SCRIPT_PREFIX"/denon-remap-init "$SCRIPT_PREFIX"/kwin-close-window.sh
echo "    Done"

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
Description=ydotool daemon for Wayland automation
After=graphical-session.target

[Service]
ExecStart=/usr/local/bin/ydotoold
Restart=always

[Install]
WantedBy=default.target
EOF

# denon-remap.service (PipeWire 5.1 remap sink)
# NOTE: The ALSA card ID (alsa_card.pci-0000_00_1f.3) is hardware-specific.
# Find yours with: pactl list cards short
cat > "$SERVICE_DIR/denon-remap.service" <<'EOF'
[Unit]
Description=Load DENON 5.1 remap sink and HDMI profile
After=pipewire-pulse.service
Wants=pipewire-pulse.service

[Service]
Type=oneshot
ExecStart=/usr/bin/bash -lc '\
  pactl set-card-profile alsa_card.pci-0000_00_1f.3 output:hdmi-surround && \
  pactl load-module module-remap-sink \
    sink_name=denon51_remap \
    master=alsa_output.pci-0000_00_1f.3.hdmi-surround \
    channels=6 \
    master_channel_map=front-left,front-right,rear-left,rear-right,front-center,lfe \
    channel_map=front-left,front-right,front-center,lfe,rear-left,rear-right \
    remix=yes \
'

[Install]
WantedBy=default.target
EOF

echo "    Written htpc-agent.service, ydotoold.service, denon-remap.service"

# ── 5. Enable services ────────────────────────────────────────────────────────
echo "==> Enabling services..."
systemctl --user daemon-reload
systemctl --user enable --now htpc-agent
systemctl --user enable --now ydotoold
systemctl --user enable --now denon-remap

echo ""
echo "✓  Install complete"
echo ""
echo "   htpc-agent running on port $AGENT_PORT"
echo "   Logs: journalctl --user -u htpc-agent -f"
echo ""
echo "   ⚠  denon-remap.service hardcodes ALSA card ID 'alsa_card.pci-0000_00_1f.3'."
echo "      Verify with: pactl list cards short"
echo "      Edit $SERVICE_DIR/denon-remap.service if yours differs, then:"
echo "      systemctl --user daemon-reload && systemctl --user restart denon-remap"
