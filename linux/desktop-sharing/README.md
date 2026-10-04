# Existing KDE Wayland desktop preview

This setup shares the logged-in KDE Plasma Wayland desktop that is already
driving the HTPC. It does not create a second X11/VNC desktop. The browser
connects to noVNC over the app's HTTPS origin, Caddy upgrades the WebSocket to
the local websockify bridge, and websockify forwards RFB to the local desktop
server:

```text
browser (wss://remote.sean.home/desktop/websockify)
    -> Caddy :443
    -> websockify 127.0.0.1:6080
    -> authenticated VNC 127.0.0.1:5900
    -> existing KDE Wayland session
```

The checked-in Caddy route is in `linux/host/caddy/Caddyfile`. It must appear
on the same HTTPS site as the Next.js app. Caddy's reverse proxy handles the
WebSocket upgrade; no second public TLS listener is needed.

## Backend choice

The practical backend on the connected KDE Neon host is KDE KRFB. The setup
script defaults to KRFB but requires an explicit `--allow-krfb-external-bind`
acknowledgement after the dedicated firewall is active. Current TigerVNC documents `w0vncserver`
as a server for Wayland compositors that share an existing display and expose
either the RemoteDesktop portal or the wlroots protocol. Its `-localhost`
parameter restricts RFB to local interfaces, and `-PasswordFile` reads the
credential created by `vncpasswd`.

Ubuntu 24.04/KDE Neon does not ship `w0vncserver` in its TigerVNC packages;
the packaged scraping server is X11-only. The host therefore needs an
existing TigerVNC build containing `w0vncserver` (the upstream 1.16+ line) or
another host-managed install. This repository does not build TigerVNC during
app deployment.

KDE KRFB is the practical backend on this KDE Neon host, but the confirmed
26.08.0 and 26.08.1 releases have a listener regression: the process can
remain active while never opening its RFB socket. KDE Bug 524610 documents
the regression and the verified 26.04.3 workaround. The checked-in source
targets the official Neon build
`4:26.04.3-0zneon+24.04+noble+release+build53`; the connected host runs the
local `+htpc1` logical-input rebuild described below and holds it until both
the listener and logical-coordinate fixes are covered by a later official
candidate. Both releases select the PipeWire framebuffer plugin on Wayland and
use the same portal persistence path, so the pinned-package rollback preserves
the browser protocol and portal model.

## Logical input scaling backport

The connected host captures 3840x2160 physical pixels while KWin exposes a
1280x720 logical desktop (300% scaling). The physical cursor can cover the
whole HTPC screen while the client pointer remains near the upper-left; the
measured mismatch is 3x. The repository records the compiled KRFB 26.04.3
backport in `patches/krfb-26.04.3-logical-input.patch`. It maps pointer
coordinates through the PipeWire stream's logical size, keeps an identity
fallback when metadata is absent, and sends the changed button's current state.

The canonical source-package recipe, Debian quilt registration, `+htpc1`
build, package metadata, rollback backup, ABI checks, and fixed-upstream
criteria are in [the desktop preview guide](../../docs/desktop-preview.md#krfb-logical-input-scaling-backport).
The matching unsigned package compiled successfully and is now installed
and held on the host at the exact `+htpc1` version. The activation receipt,
package digest, listener/bridge checks, and pinned-package rollback are in the
canonical guide. Actual cursor/click mapping, portal permission persistence
after restart, and TV-off behavior remain pending.

KRFB stores its passwords through KDE Desktop Sharing/KWallet, which requires
one-time graphical configuration. KRFB 26.04.3's VNC listener binds
`0.0.0.0`, so it is an explicit host configuration path. The setup script
refuses it unless `--allow-krfb-external-bind` is passed. This repository
supplies a dedicated nftables guard that rejects TCP 5900 unless the input
interface is `lo`, while preserving other firewall traffic. Install and
verify that guard before starting KRFB; the websockify listener remains
loopback-only.

For unattended browser access, KRFB needs its **Allow connections without an
invitation** setting enabled and the unattended-access password configured.
The desktop-control setting must also be enabled for keyboard and pointer
input. The ordinary desktop-sharing password still follows KRFB's invitation
path and can leave a connection waiting for a dialog, which is unsuitable
when the TV is off. Disable **Announce the service on the local network**;
the app uses the fixed same-origin Caddy route and does not need DNS-SD
discovery.

### Rotate the unattended password

`~/.config/htpc-desktop/unattended-password` is a provisioning record only;
KRFB does not read or watch it. Open **Desktop Sharing (KRFB)** from the logged-
in Plasma application menu, or run `krfb` in a logged-in HTPC terminal. Its
unique D-Bus service opens the running instance. Keep unattended access enabled,
choose **Change Unattended Password**, enter the new value yourself, and
reconnect with it. Use at most eight ASCII bytes because classic VNC
authentication considers only the first eight bytes. The GUI setter applies the
change immediately; an optional graceful quit/service restart is only for
verifying persisted reload. See the [canonical password rotation and reload
guide](../../docs/desktop-preview.md#rotate-the-unattended-password).

KWallet is the preferred credential store when it is available and unlocked by
the Plasma session. KRFB also has a no-wallet KConfig fallback: its source
obscures the two password values in the KRFB config, but the config remains
credential-bearing and must be user-only. The connected host uses the default
`~/.config/krfbrc` fallback config with mode `0600`; host-only provisioning
material is under `~/.config/htpc-desktop` (directory mode `0700`, password
file mode `0600`). Its separate random desktop and unattended credentials are
kept on the host; no credential is in this repository.

Do not substitute KDE's KRdp: it speaks RDP and cannot be the RFB target that
noVNC/websockify expects. Do not substitute TigerVNC's `Xvnc` standalone
server: it creates a separate virtual session and would not control the
physical HTPC desktop.

## Host setup

Run these commands as the logged-in KDE user. The script does not install
packages, write credentials, or modify firewall policy.

```bash
# Confirm the pinned build is available before applying the rollback.
apt-cache policy krfb
sudo apt install --allow-downgrades \
  krfb=4:26.04.3-0zneon+24.04+noble+release+build53 \
  python3-websockify
sudo apt-mark hold krfb

# On the connected KDE Neon host, launch KRFB once and set these graphical
# options: unattended access + its password, remote desktop control, and
# disabled local DNS-SD announcement. Enforce the host firewall rule before
# enabling the service because KRFB binds RFB on all interfaces. Close this
# setup instance before enabling the generated --nodialog user service.
krfb

# Install the dedicated TCP 5900 guard. This does not enable it yet.
sudo bash linux/desktop-sharing/install-krfb-firewall.sh
sudo nft -c -f /etc/htpc-desktop-firewall.nft
sudo systemctl enable --now htpc-desktop-firewall.service

bash linux/desktop-sharing/setup-wayland-desktop-sharing.sh \
  --backend krfb --allow-krfb-external-bind --enable
```

For the strict loopback backend on a host that already provides TigerVNC's
Wayland server:

```bash
command -v w0vncserver
command -v vncpasswd
mkdir -p "$HOME/.config/tigervnc"
vncpasswd "$HOME/.config/tigervnc/passwd"
bash linux/desktop-sharing/setup-wayland-desktop-sharing.sh --backend w0vncserver
systemctl --user enable --now htpc-desktop-vnc.service htpc-desktop-websockify.service
```

The password prompts are interactive. Password files and KWallet entries are
host-local and are not part of this repository. The default generated units
use VNC TCP 5900 and websockify TCP 6080; both are loopback-only with
`w0vncserver`.

Check listener addresses before exposing the app:

```bash
ss -ltnp | grep -E ':(5900|6080)\b'
systemctl --user status htpc-desktop-vnc.service htpc-desktop-websockify.service
```

An active service is not enough: with this KRFB build, `5900` should show
`0.0.0.0:5900` (and usually `[::]:5900`) while `6080` must show
`127.0.0.1:6080`. Verify the dedicated guard with
`sudo nft list chain inet htpc_desktop_guard input` and test that a LAN client
cannot connect. Never publish TCP 5900 directly through Caddy or the router.
The noVNC login should reject an incorrect password and accept the host's
unattended-access password. A successful password handshake proves listener
and authentication only; it does not prove that PipeWire has supplied a
framebuffer. Check the negotiated ServerInit dimensions and treat `0x0` as
an unresolved capture state: check for a physical-monitor portal prompt and
confirm that the chosen monitor/output is available before assuming a new
approval will fix it.

The firewall unit rebuilds only its dedicated table in one nft transaction and
leaves the rule installed if the unit is stopped. Stop KRFB before removing
the guard explicitly:

```bash
systemctl --user stop htpc-desktop-vnc.service htpc-desktop-websockify.service
sudo nft destroy table inet htpc_desktop_guard
```

For a fresh machine, complete the graphical setup above, then follow [the
canonical logical-input backport guide](../../docs/desktop-preview.md#krfb-logical-input-scaling-backport)
to install the reviewed local package. On the connected host, retain the held
`+htpc1` package until a later official candidate has been checked against both
KDE Bug 524610 (listener creation) and KDE Bug 524406 (logical pointer scaling).
Use the canonical guide's exact package validation, install, rollback, and
unhold steps; repeat listener, authentication, portal, LAN-block, scaling, and
TV-off checks before changing the hold.

If the Next.js/Caddy host is separate from the HTPC, run the VNC server and
websockify on the HTPC. Change only Caddy's websockify upstream to the HTPC's
LAN address and allow TCP 6080 from the app host to the HTPC firewall; keep
VNC TCP 5900 on the HTPC loopback and do not expose either port externally.

## Session and display requirements

These are user-session services. The KDE user must have a graphical Wayland
session, PipeWire, a session D-Bus, and a valid `WAYLAND_DISPLAY`/
`XDG_RUNTIME_DIR`. The setup script deliberately does not try to guess or
persist those values. If the user manager starts before Plasma exports them,
import the session environment through the existing host login setup before
enabling these units.

TV-off behavior is a host and display-chain question. The repository's EDID
override is useful for keeping modes available, but it does not prove that
KWin continues to expose a captureable output when the TV/AVR is powered off.
Validate that behavior on the actual HTPC after the service is working.

## App integration notes

The app can use noVNC's `RFB` client with a same-origin WebSocket URL. The
fixed `/desktop/websockify` route means this integration needs no frontend or
deployment application environment variables:

```ts
const rfb = new RFB(
  targetElement,
  `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/desktop/websockify`,
  { shared: true },
);
rfb.viewOnly = false;
rfb.scaleViewport = true;
rfb.clipViewport = true;
rfb.resizeSession = false;
```

The noVNC surface must own pointer and touch events while it is active. Stop
propagation at the preview container/canvas and set `touch-action: none` on
that surface so the ancestor SwipeDetector does not interpret desktop drags
as panel swipes. Keep keyboard focus on the RFB target and expose a visible
disconnect/close action for small screens; noVNC supplies touch and keyboard
controls but the usable size depends on the phone browser viewport.

## Official references

- [TigerVNC `w0vncserver` manual](https://raw.githubusercontent.com/TigerVNC/tigervnc/master/unix/w0vncserver/w0vncserver.man)
- [TigerVNC project](https://github.com/TigerVNC/tigervnc)
- [TigerVNC `x0vncserver` manual](https://github.com/TigerVNC/tigervnc/blob/master/unix/x0vncserver/x0vncserver.man)
- [TigerVNC `Xvnc` manual](https://github.com/TigerVNC/tigervnc/blob/master/unix/xserver/hw/vnc/Xvnc.man)
- [KDE KRFB source](https://github.com/KDE/krfb)
- [KDE KRFB current Wayland entry point](https://raw.githubusercontent.com/KDE/krfb/master/krfb/main.cpp)
- [KDE KRFB current listener](https://raw.githubusercontent.com/KDE/krfb/master/krfb/invitationsrfbserver.cpp)
- [KDE KRFB current client consent path](https://raw.githubusercontent.com/KDE/krfb/master/krfb/invitationsrfbclient.cpp)
- [KDE KRFB settings schema](https://github.com/KDE/krfb/blob/master/krfb/krfb.kcfg)
- [KDE Bug 524610: KRFB 26.08.0/26.08.1 have no VNC listener](https://bugs.kde.org/show_bug.cgi?id=524610)
- [KDE KRFB 26.04.3 PipeWire source](https://raw.githubusercontent.com/KDE/krfb/v26.04.3/framebuffers/pipewire/pw_framebuffer.cpp)
- [KDE KRFB 26.08.1 PipeWire source](https://raw.githubusercontent.com/KDE/krfb/v26.08.1/framebuffers/pipewire/pw_framebuffer.cpp)
- [KDE KRFB 26.04.3 listener source](https://raw.githubusercontent.com/KDE/krfb/v26.04.3/krfb/rfbserver.cpp)
- [XDG Desktop Portal RemoteDesktop API](https://github.com/flatpak/xdg-desktop-portal/blob/main/data/org.freedesktop.portal.RemoteDesktop.xml)
- [KDE KRFB virtual monitor helper](https://github.com/KDE/krfb)
- [Ubuntu Noble KRFB package](https://packages.ubuntu.com/noble/krfb)
- [Ubuntu Noble TigerVNC scraping package file list](https://packages.ubuntu.com/noble/all/tigervnc-scraping-server/filelist)
- [noVNC websockify](https://github.com/novnc/websockify)
- [Caddy reverse proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)
- [systemd execution sandboxing](https://github.com/systemd/systemd/blob/main/man/systemd.exec.xml)
- [systemd network resource controls](https://github.com/systemd/systemd/blob/main/man/systemd.resource-control.xml)
