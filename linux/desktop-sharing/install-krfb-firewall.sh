#!/usr/bin/env bash
# Install the dedicated nftables guard used when KRFB is the VNC backend.
#
# This script requires root because it writes /etc and installs a system unit.
# It does not enable or start anything unless --enable is passed.

set -euo pipefail

ENABLE=0
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RULES_SOURCE="$SCRIPT_DIR/htpc-desktop-firewall.nft"
UNIT_SOURCE="$SCRIPT_DIR/../systemd/htpc-desktop-firewall.service"

usage() {
  cat <<'USAGE'
Usage: install-krfb-firewall.sh [--enable]

Install a dedicated nftables table that rejects non-loopback TCP 5900 while
preserving all other input traffic. Without --enable, only the rules file and
systemd unit are installed.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --enable)
      ENABLE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "install-krfb-firewall: unknown option: $1" >&2
      exit 1
      ;;
  esac
done

[[ "$(id -u)" == 0 ]] || {
  echo "install-krfb-firewall: run as root (for example, sudo bash ...)" >&2
  exit 1
}
[[ -x /usr/sbin/nft ]] || {
  echo "install-krfb-firewall: /usr/sbin/nft is required" >&2
  exit 1
}
[[ -f "$RULES_SOURCE" ]] || {
  echo "install-krfb-firewall: missing $RULES_SOURCE" >&2
  exit 1
}
[[ -f "$UNIT_SOURCE" ]] || {
  echo "install-krfb-firewall: missing $UNIT_SOURCE" >&2
  exit 1
}

# Validate the checked-in source before replacing the host copy. nft -c parses
# and checks the complete idempotent transaction without changing the ruleset.
nft -c -f "$RULES_SOURCE"

install -D -m 0644 "$RULES_SOURCE" /etc/htpc-desktop-firewall.nft
install -D -m 0644 "$UNIT_SOURCE" /etc/systemd/system/htpc-desktop-firewall.service

echo "Installed /etc/htpc-desktop-firewall.nft"
echo "Installed /etc/systemd/system/htpc-desktop-firewall.service"
echo "Validated source transaction before installation"

systemctl daemon-reload
if (( ENABLE )); then
  nft -c -f /etc/htpc-desktop-firewall.nft
  systemctl enable --now htpc-desktop-firewall.service
  echo "Enabled htpc-desktop-firewall.service"
else
  echo "Not enabled. After validation, run:"
  echo "  sudo systemctl enable --now htpc-desktop-firewall.service"
fi
