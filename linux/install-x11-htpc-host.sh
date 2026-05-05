#!/usr/bin/env bash
# install-x11-htpc-host.sh
#
# Installs htpc-remote as an X11 host — the machine running the Next.js server
# AND acting as the HTPC (NEXT_PUBLIC_HOST_IP == NEXT_PUBLIC_HTPC_IP).
#
# Installs:
#   - Shared scripts (no KDE/Wayland-specific ones) → ~/bin/
#   - Caddy reverse-proxy config → /etc/caddy/Caddyfile  (requires sudo)
#   - systemd user service: htpc-remote, ydotoold
#   - systemd system service: caddy (requires sudo)
#
# Not installed (X11 limitations):
#   - htpc-res (kscreen-doctor display switching — Wayland/KDE only)
#   - kwin-close-window.sh (KDE qdbus — not available on X11)
#   - denon-remap.service (install manually if using PipeWire on X11)
#
# Prerequisites (install manually before running this script):
#   - Node.js 18+  (npm install already run in the repo)
#   - ydotool (build from source — see linux/README.md)
#   - Caddy installed as a system service (see linux/README.md)
#   - SSL certs at /etc/ssl/localcerts/ (see linux/README.md)
#   - Set NEXT_PUBLIC_HTPC_PLATFORM=LINUX_X11 in .env.local
#
# Usage:
#   bash install-x11-htpc-host.sh [--repo ~/WebstormProjects/htpc-remote] [--scripts ~/bin]

set -euo pipefail

# ── Defaults ──────────────────────────────────────────────────────────────────
SCRIPT_PREFIX="${SCRIPT_PREFIX:-$HOME/bin}"
REPO_DIR="${REPO_DIR:-$HOME/WebstormProjects/htpc-remote}"
SERVICE_DIR="$HOME/.config/systemd/user"

# ── Parse args ────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --scripts) SCRIPT_PREFIX="$2"; shift 2 ;;
    --repo)    REPO_DIR="$2";      shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> htpc-remote host (X11)"
echo "    Repo       : $REPO_DIR"
echo "    Scripts    : $SCRIPT_PREFIX"
echo ""

# ── 1. Copy shared scripts ────────────────────────────────────────────────────
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

# ── 2. EDID firmware ──────────────────────────────────────────────────────────
echo ""
echo "==> EDID setup (requires sudo):"
echo "    sudo mkdir -p /lib/firmware/edid"
echo "    sudo cp '$SCRIPT_DIR/edid/denon-1440p120.edid' /lib/firmware/edid/"
echo "    Then add to /etc/default/grub:"
echo "      GRUB_CMDLINE_LINUX_DEFAULT=\"... drm.edid_firmware=HDMI-A-1:edid/denon-1440p120.edid\""
echo "    sudo update-grub"
echo "    (Reboot for EDID change to take effect)"
echo ""

# ── 3. Caddy config (requires sudo) ──────────────────────────────────────────
echo "==> Installing Caddy config (requires sudo)..."
sudo cp "$SCRIPT_DIR/host/caddy/Caddyfile" /etc/caddy/Caddyfile
echo "    Copied Caddyfile to /etc/caddy/"
echo "    (Edit /etc/caddy/Caddyfile to set your domain and cert paths)"

# ── 4. Systemd user services ──────────────────────────────────────────────────
echo "==> Writing systemd user services..."
mkdir -p "$SERVICE_DIR"

# htpc-remote.service (X11 variant — no KScreen ExecStartPre)
cat > "$SERVICE_DIR/htpc-remote.service" <<EOF
[Unit]
Description=HTPC Remote Next.js app
After=graphical-session.target network-online.target
Wants=graphical-session.target network-online.target

[Service]
Type=simple
WorkingDirectory=${REPO_DIR}
Environment=NODE_ENV=production
PassEnvironment=DISPLAY XAUTHORITY XDG_RUNTIME_DIR DBUS_SESSION_BUS_ADDRESS

ExecStart=/usr/bin/bash -lc 'npm run deploy'
Restart=on-failure
RestartSec=5
KillMode=mixed

[Install]
WantedBy=graphical-session.target
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

echo "    Written htpc-remote.service, ydotoold.service"

# ── 5. Enable user services ───────────────────────────────────────────────────
echo "==> Enabling user services..."
systemctl --user daemon-reload
systemctl --user enable --now ydotoold
systemctl --user enable htpc-remote    # don't start now — requires graphical session

# ── 6. Enable Caddy system service (requires sudo) ────────────────────────────
echo "==> Enabling Caddy (requires sudo)..."
sudo systemctl daemon-reload
sudo systemctl enable --now caddy

echo ""
echo "✓  Install complete"
echo ""
echo "   htpc-remote.service will start automatically on next graphical login."
echo "   Start manually: systemctl --user start htpc-remote"
echo "   Logs:           journalctl --user -u htpc-remote -f"
echo ""
echo "   Note: Display-switching (htpc-res) is not available on X11."
echo "   Set NEXT_PUBLIC_HTPC_PLATFORM=LINUX_X11 in .env.local."
echo ""
echo "   ⚠  Edit /etc/caddy/Caddyfile to set your local domain and SSL cert paths."
echo "      Then: sudo systemctl reload caddy"
