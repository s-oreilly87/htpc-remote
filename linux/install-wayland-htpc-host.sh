#!/usr/bin/env bash
# install-wayland-htpc-host.sh
#
# Installs htpc-remote as a KDE Wayland host — the machine running the Next.js
# server AND acting as the HTPC (NEXT_PUBLIC_HOST_IP == NEXT_PUBLIC_HTPC_IP).
#
# Installs:
#   - All scripts (shared + KDE/Wayland-specific) → ~/bin/
#   - Caddy reverse-proxy config → /etc/caddy/Caddyfile  (requires sudo)
#   - systemd user services: htpc-remote, ydotoold, denon-remap
#   - systemd system service: caddy (requires sudo)
#
# Prerequisites (install manually before running this script):
#   - Node.js 18+  (npm install already run in the repo)
#   - ydotool (build from source — see linux/README.md)
#   - Caddy installed as a system service (see linux/README.md)
#   - PipeWire + PipeWire-pulse running
#   - SSL certs at /etc/ssl/localcerts/ (see linux/README.md)
#   - Set NEXT_PUBLIC_HTPC_PLATFORM=LINUX_WAYLAND in .env.local
#
# Usage:
#   bash install-wayland-htpc-host.sh [--repo ~/WebstormProjects/htpc-remote] [--scripts ~/bin]

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

echo "==> htpc-remote host (Wayland)"
echo "    Repo       : $REPO_DIR"
echo "    Scripts    : $SCRIPT_PREFIX"
echo ""

# ── 1. Copy scripts ───────────────────────────────────────────────────────────
echo "==> Installing scripts to $SCRIPT_PREFIX..."
mkdir -p "$SCRIPT_PREFIX"

# Shared scripts
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

# Wayland/KDE-specific scripts
cp "$SCRIPT_DIR/scripts/wayland/htpc-res"             "$SCRIPT_PREFIX/"
cp "$SCRIPT_DIR/scripts/wayland/kwin-close-window.sh" "$SCRIPT_PREFIX/"

chmod +x "$SCRIPT_PREFIX"/htpc-* "$SCRIPT_PREFIX"/kodi-alsa \
          "$SCRIPT_PREFIX"/plexamp* "$SCRIPT_PREFIX"/qobuz* \
          "$SCRIPT_PREFIX"/denon-remap-init "$SCRIPT_PREFIX"/kwin-close-window.sh
echo "    Done"

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

# htpc-remote.service
cat > "$SERVICE_DIR/htpc-remote.service" <<EOF
[Unit]
Description=HTPC Remote Next.js app
After=import-plasma-env.service graphical-session.target network-online.target pipewire.service wireplumber.service
Wants=import-plasma-env.service graphical-session.target network-online.target

[Service]
Type=simple
WorkingDirectory=${REPO_DIR}
Environment=NODE_ENV=production
PassEnvironment=DISPLAY WAYLAND_DISPLAY XAUTHORITY XDG_RUNTIME_DIR DBUS_SESSION_BUS_ADDRESS

ExecStartPre=/usr/bin/bash -lc '\
  for i in {1..120}; do \
    /usr/bin/kscreen-doctor -o >/dev/null 2>&1 || { sleep 0.25; continue; }; \
    [[ -n "\${DISPLAY:-}" && -S "/tmp/.X11-unix/X\${DISPLAY#:}" ]] || { sleep 0.25; continue; }; \
    [[ -z "\${XAUTHORITY:-}" || -r "\${XAUTHORITY}" ]] || { sleep 0.25; continue; }; \
    exit 0; \
  done; \
  echo "HTPC remote start blocked: KScreen/XWayland not ready" >&2; \
  exit 1'

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
Description=ydotool daemon for Wayland automation
After=graphical-session.target

[Service]
ExecStart=/usr/local/bin/ydotoold
Restart=always

[Install]
WantedBy=default.target
EOF

# denon-remap.service
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

echo "    Written htpc-remote.service, ydotoold.service, denon-remap.service"

# ── 5. Copy update timer units ────────────────────────────────────────────────
cp "$SCRIPT_DIR/systemd/htpc-update.service" "$SERVICE_DIR/"
cp "$SCRIPT_DIR/systemd/htpc-update.timer"   "$SERVICE_DIR/"
echo "    Copied htpc-update.service, htpc-update.timer"

# ── 6. Enable user services ───────────────────────────────────────────────────
echo "==> Enabling user services..."
systemctl --user daemon-reload
systemctl --user enable --now ydotoold
systemctl --user enable --now denon-remap
systemctl --user enable htpc-remote         # don't start now — requires graphical session
systemctl --user enable --now htpc-update.timer

# ── 7. Enable Caddy system service (requires sudo) ────────────────────────────
echo "==> Enabling Caddy (requires sudo)..."
sudo systemctl daemon-reload
sudo systemctl enable --now caddy

echo ""
echo "✓  Install complete"
echo ""
echo "   htpc-remote.service will start automatically on next graphical login."
echo "   Start manually:  systemctl --user start htpc-remote"
echo "   Logs:            journalctl --user -u htpc-remote -f"
echo ""
echo "   htpc-update.timer will pull master and restart the app at 2am daily."
echo "   Trigger manually: systemctl --user start htpc-update"
echo "   Logs:             journalctl --user -u htpc-update -f"
echo ""
echo "   ⚠  denon-remap.service hardcodes ALSA card ID 'alsa_card.pci-0000_00_1f.3'."
echo "      Verify with: pactl list cards short"
echo "      Edit $SERVICE_DIR/denon-remap.service if yours differs, then:"
echo "      systemctl --user daemon-reload && systemctl --user restart denon-remap"
echo ""
echo "   ⚠  Edit /etc/caddy/Caddyfile to set your local domain and SSL cert paths."
echo "      Then: sudo systemctl reload caddy"
