#!/usr/bin/env bash
# Install user-session services for an existing KDE Wayland desktop preview.
#
# This script only writes files below ${XDG_CONFIG_HOME:-~/.config}/systemd/user.
# It does not install packages, create credentials, edit firewall rules, or
# touch app environment files. Run it as the desktop user, not with sudo.

set -euo pipefail

# KDE Neon on the connected HTPC provides KRFB; the strict w0vncserver path
# remains available explicitly for hosts that install a TigerVNC Wayland build.
BACKEND="${DESKTOP_VNC_BACKEND:-krfb}"
VNC_PORT="${DESKTOP_VNC_PORT:-5900}"
WEBSOCKIFY_PORT="${DESKTOP_WEBSOCKIFY_PORT:-6080}"
ENABLE_SERVICES=0
ALLOW_KRFB_EXTERNAL_BIND=0

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
SERVICE_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"

usage() {
  cat <<'USAGE'
Usage: setup-wayland-desktop-sharing.sh [options]

Install authenticated existing-desktop VNC and loopback websockify user units.

Options:
  --backend NAME       krfb (default) or w0vncserver
  --vnc-port PORT      RFB port (default: 5900)
  --websockify-port P  WebSocket bridge port (default: 6080)
  --enable             daemon-reload and enable --now both user units
  --allow-krfb-external-bind
                       Explicitly acknowledge KRFB's all-interface RFB bind
  -h, --help           Show this help

The explicit w0vncserver backend requires TigerVNC's Wayland server (1.16+
upstream) and a password file at ~/.config/tigervnc/passwd. Create that file
with vncpasswd before enabling the units. KRFB requires one-time KDE Desktop
Sharing configuration and a host firewall rule; see README.md.
USAGE
}

die() {
  echo "setup-wayland-desktop-sharing: $*" >&2
  exit 1
}

is_port() {
  [[ "$1" =~ ^[0-9]+$ ]] && (( 1 <= 10#$1 && 10#$1 <= 65535 ))
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backend)
      [[ $# -ge 2 ]] || die "--backend needs a value"
      BACKEND="$2"
      shift 2
      ;;
    --vnc-port)
      [[ $# -ge 2 ]] || die "--vnc-port needs a value"
      VNC_PORT="$2"
      shift 2
      ;;
    --websockify-port)
      [[ $# -ge 2 ]] || die "--websockify-port needs a value"
      WEBSOCKIFY_PORT="$2"
      shift 2
      ;;
    --enable)
      ENABLE_SERVICES=1
      shift
      ;;
    --allow-krfb-external-bind)
      ALLOW_KRFB_EXTERNAL_BIND=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "unknown option: $1"
      ;;
  esac
done

case "$BACKEND" in
  w0vncserver|krfb) ;;
  *) die "unsupported backend '$BACKEND' (use w0vncserver or krfb)" ;;
esac

is_port "$VNC_PORT" || die "invalid VNC port: $VNC_PORT"
is_port "$WEBSOCKIFY_PORT" || die "invalid websockify port: $WEBSOCKIFY_PORT"
[[ "$VNC_PORT" != "$WEBSOCKIFY_PORT" ]] || die "VNC and websockify ports must differ"

[[ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]] || \
  echo "warning: no display variables are present; run this as the logged-in KDE user" >&2

command -v systemctl >/dev/null 2>&1 || die "systemctl is required"
WEBSOCKIFY_BIN="$(command -v websockify || true)"
[[ -n "$WEBSOCKIFY_BIN" ]] || \
  die "websockify is missing; install Ubuntu's python3-websockify package first"

mkdir -p "$SERVICE_DIR"

case "$BACKEND" in
  w0vncserver)
    VNC_BIN="$(command -v w0vncserver || true)"
    [[ -n "$VNC_BIN" ]] || die "w0vncserver is missing; install TigerVNC 1.16+ with Wayland support"
    PASSWORD_FILE="${XDG_CONFIG_HOME:-$HOME/.config}/tigervnc/passwd"
    [[ -r "$PASSWORD_FILE" ]] || die "missing $PASSWORD_FILE; create it interactively with vncpasswd"
    VNC_UNIT="$SERVICE_DIR/htpc-desktop-vnc.service"
    cat > "$VNC_UNIT" <<UNIT
[Unit]
Description=HTPC existing KDE Wayland desktop over authenticated VNC
After=pipewire.service wireplumber.service
Wants=pipewire.service wireplumber.service
PartOf=graphical-session.target

[Service]
Type=simple
ExecStart=$VNC_BIN -localhost -rfbport=$VNC_PORT -PasswordFile=$PASSWORD_FILE -QueryConnect=0 -RememberDisplayChoice=Always
Restart=on-failure
RestartSec=3
PassEnvironment=WAYLAND_DISPLAY XDG_RUNTIME_DIR DBUS_SESSION_BUS_ADDRESS DISPLAY XAUTHORITY

[Install]
WantedBy=graphical-session.target
UNIT
    ;;
  krfb)
    [[ "$VNC_PORT" == 5900 ]] || die \
      "KRFB's port is configured in its KDE settings; keep --vnc-port at 5900 and change the KRFB setting separately if needed"
    [[ "$ALLOW_KRFB_EXTERNAL_BIND" == 1 ]] || die \
      "KRFB currently binds RFB on all interfaces; add --allow-krfb-external-bind only after restricting TCP $VNC_PORT with the host firewall"
    VNC_BIN="$(command -v krfb || true)"
    [[ -n "$VNC_BIN" ]] || die "krfb is missing; install Ubuntu's krfb package first"
    VNC_UNIT="$SERVICE_DIR/htpc-desktop-vnc.service"
    cat > "$VNC_UNIT" <<UNIT
[Unit]
Description=HTPC existing KDE Wayland desktop over authenticated KRFB
After=pipewire.service wireplumber.service
Wants=pipewire.service wireplumber.service
PartOf=graphical-session.target

[Service]
Type=simple
ExecStart=$VNC_BIN --nodialog
Restart=on-failure
RestartSec=3
PassEnvironment=WAYLAND_DISPLAY XDG_RUNTIME_DIR DBUS_SESSION_BUS_ADDRESS DISPLAY XAUTHORITY

[Install]
WantedBy=graphical-session.target
UNIT
    echo "warning: KRFB's RFB listener is not loopback-only; enforce a firewall rule for TCP $VNC_PORT" >&2
    ;;
esac

WEBSOCKIFY_UNIT="$SERVICE_DIR/htpc-desktop-websockify.service"
cat > "$WEBSOCKIFY_UNIT" <<UNIT
[Unit]
Description=HTPC desktop VNC to WebSocket bridge
Requires=htpc-desktop-vnc.service
After=htpc-desktop-vnc.service
PartOf=graphical-session.target

[Service]
Type=simple
ExecStart=$WEBSOCKIFY_BIN 127.0.0.1:$WEBSOCKIFY_PORT 127.0.0.1:$VNC_PORT
Restart=on-failure
RestartSec=3

[Install]
WantedBy=graphical-session.target
UNIT

echo "Installed user units in $SERVICE_DIR"
echo "  $VNC_UNIT"
echo "  $WEBSOCKIFY_UNIT"

systemctl --user daemon-reload
if (( ENABLE_SERVICES )); then
  if [[ "$BACKEND" == krfb ]] && ! systemctl is-active --quiet htpc-desktop-firewall.service; then
    die "KRFB services require active htpc-desktop-firewall.service; install and verify the dedicated TCP 5900 guard first"
  fi
  systemctl --user enable --now htpc-desktop-vnc.service
  systemctl --user enable --now htpc-desktop-websockify.service
else
  echo "Services are installed but stopped. Review them, then run:"
  echo "  systemctl --user enable --now htpc-desktop-vnc.service htpc-desktop-websockify.service"
fi

echo "Caddy route: /desktop/websockify -> 127.0.0.1:$WEBSOCKIFY_PORT"
echo "Repo Caddyfile: $REPO_DIR/linux/host/caddy/Caddyfile"
