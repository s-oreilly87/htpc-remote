# Interactive HTPC desktop preview

An interactive noVNC viewer can let a phone operate the HTPC desktop without
switching the TV to the HTPC input. The app integration is straightforward;
the prerequisite is a VNC server sharing the same desktop that runs the HTPC
applications.

## Current host path

The connected HTPC reports KDE Neon with Plasma 6.7.5 on Wayland. Before this
setup, `krfb`, `websockify`, and TigerVNC's `w0vncserver` were absent. The
available Neon/Ubuntu packages are `krfb` (Neon's current KDE build) and
`python3-websockify`; Ubuntu's packaged TigerVNC scraping server is for X11
and does not provide the existing Wayland desktop server needed here.

KRFB is the practical backend for this host, with one version constraint. KDE
Bug 524610 affects the confirmed KRFB 26.08.0 and 26.08.1 releases: the
process can be active while its RFB listener is never created. The connected
host is therefore running the
official Neon build `4:26.04.3-0zneon+24.04+noble+release+build53`, with
`krfb` held at that version until a fixed release is verified. Its Wayland
entry point selects the PipeWire framebuffer plugin, which uses the XDG
Desktop Portal for screen capture and remote keyboard, pointer, and touch
control. The 26.04.3 and 26.08.1 PipeWire sources use the same
`persist_mode=2` and restore-token flow, so this rollback preserves the
portal permission model while restoring the listener.
The host setup files are under `linux/desktop-sharing/` and generate user
services for the logged-in graphical session.

## KRFB logical input scaling backport

The host's capture stream is observed at 3840x2160 physical pixels while KWin
exposes a 1280x720 logical desktop (300% scaling). The physical cursor can cover
the whole HTPC screen while the client pointer remains near the upper-left of the
image; the measured mismatch is 3x, not 2x. KDE Bug
[524406](https://bugs.kde.org/show_bug.cgi?id=524406) tracks this
physical/logical coordinate mismatch.

The repository records the narrow source backport at
`linux/desktop-sharing/patches/krfb-26.04.3-logical-input.patch`. It exposes the
PipeWire stream's logical size, maps absolute pointer coordinates from frame
pixels to that logical size, falls back to the original coordinates when
metadata is absent, and reports each changed button with its current button
state. A matching official Neon 26.04.3 source tree compiled successfully into
this unsigned package:

```text
krfb_26.04.3-0zneon+24.04+noble+release+build53+htpc1_amd64.deb
SHA-256: 71e2ebaf597b8548209bfb146c9fca476972d567c82e6019a3fe917f461f34bf
```

The package contains both rebuilt plugins:
`usr/lib/x86_64-linux-gnu/qt6/plugins/krfb/events/xdp.so` and
`usr/lib/x86_64-linux-gnu/qt6/plugins/krfb/framebuffer/pw.so`.

Host activation receipt (2026-10-04): the local package
`4:26.04.3-0zneon+24.04+noble+release+build53+htpc1` with SHA-256
`71e2ebaf597b8548209bfb146c9fca476972d567c82e6019a3fe917f461f34bf` is
installed and held. The installed artifact is
`/home/sean/.local/share/htpc-desktop/recovery-20261004/krfb-logical-input-build/krfb_26.04.3-0zneon+24.04+noble+release+build53+htpc1_amd64.deb`.
The previous KRFB process was gracefully quit, both desktop user services
restarted successfully, KRFB is listening on 5900 and websockify on loopback
6080, the local app returned HTTP 200 on port 3000, and LAN connections to
5900/6080 were refused. These checks confirm activation and transport. Actual
cursor/click mapping, portal permission persistence after restart, and TV-off
behavior remain pending.

Build the exact Neon source package with Debian quilt registration and the
local `+htpc1` revision. Keep the source directory explicit so a wrapper or
build-output directory cannot be selected accidentally:

```bash
KRFB_VERSION='4:26.04.3-0zneon+24.04+noble+release+build53'
apt-cache policy krfb
apt-cache showsrc krfb | grep -E '^(Package|Version):'
apt source "krfb=${KRFB_VERSION}"
KRFB_SOURCE="$PWD/krfb-26.04.3"
test -f "$KRFB_SOURCE/debian/rules"
cd "$KRFB_SOURCE"
install -m 0644 /path/to/htpc-remote/linux/desktop-sharing/patches/krfb-26.04.3-logical-input.patch debian/patches/htpc-logical-input.patch
grep -qxF 'htpc-logical-input.patch' debian/patches/series || printf '%s\n' 'htpc-logical-input.patch' >> debian/patches/series
dch --local +htpc1 'Fix logical pointer scaling for a 300% Wayland output'
dpkg-source --before-build
dpkg-buildpackage -us -uc -b -j4
```

Verify the resulting package metadata and plugin payload before installation:

```bash
BUILT_PACKAGE="$KRFB_SOURCE/../krfb_26.04.3-0zneon+24.04+noble+release+build53+htpc1_amd64.deb"
dpkg-deb -f "$BUILT_PACKAGE" Package Version Architecture Size
sha256sum "$BUILT_PACKAGE"
dpkg-deb -c "$BUILT_PACKAGE" | grep -E '/(events/xdp|framebuffer/pw)\.so$'
```

Before compiling, verify that the 26.04.3 source retains these interfaces:
`frameBuffer()` returns a shared pointer passed as `.data()` to a helper taking
`FrameBuffer *`; `FrameBuffer::customProperty` returns `QVariant`; stream
metadata exposes a `size` decodable as `QSize` or a two-integer
`QDBusArgument` structure; and the generated RemoteDesktop proxy accepts
floating-point absolute coordinates plus an unsigned button state. The patch
uses `QSize::isEmpty()` guards and accesses `streamLogicalSize` directly inside
`PWFrameBuffer::Private`. Stop rather than forcing the patch if source paths or
APIs differ. Use the normal Neon Qt 6, KDE Frameworks, PipeWire, and XDG Desktop
Portal build dependencies.

Back up the pinned official package before installing a locally built one, and
keep its metadata and digest with the recovery copy:

```bash
RECOVERY_DIR="$HOME/.local/share/htpc-desktop/recovery-20261004"
mkdir -p "$RECOVERY_DIR"
(cd "$RECOVERY_DIR" && apt download "krfb=${KRFB_VERSION}")
dpkg-deb -f "$RECOVERY_DIR"/krfb_*.deb Package Version Architecture Size
sha256sum "$RECOVERY_DIR"/krfb_*.deb
```

Install the reviewed package only after checking its metadata. If the live
package must be restored, use the saved official `.deb`, hold that exact
version, and restart the user services:

```bash
sudo apt install "$BUILT_PACKAGE"
# rollback
sudo apt install --allow-downgrades "$RECOVERY_DIR"/krfb_*.deb
sudo apt-mark hold krfb
systemctl --user restart htpc-desktop-vnc.service htpc-desktop-websockify.service
```

Before unholding for a later official candidate, inspect its source and release
notes against Bug 524406. Treat it as fixed only after source review shows an
equivalent physical-to-logical XDP mapping, an identity fallback for absent
metadata, and changed-button notifications using the current button state.
Build or install that candidate, repeat listener, capture, authentication,
reconnect, and TV-off checks, and only then run:

```bash
sudo apt-mark unhold krfb
sudo apt install --only-upgrade krfb
systemctl --user restart htpc-desktop-vnc.service htpc-desktop-websockify.service
ss -ltnp | grep -E ':(5900|6080)\b'
```

Keep the pinned official package if the candidate lacks the fix or any runtime
check regresses.

## Connection topology

The browser connects through the existing HTTPS site to a WebSocket bridge,
which forwards VNC traffic to the current KDE desktop:

```text
browser (wss://remote.sean.home/desktop/websockify)
    -> Caddy :443
    -> websockify 127.0.0.1:6080
    -> authenticated KRFB 5900
    -> existing KDE Wayland session
```

The checked-in Caddy route is in `linux/host/caddy/Caddyfile`. Caddy's
reverse proxy handles the WebSocket upgrade; no second public TLS listener is
needed. KRFB currently binds its RFB listener to `0.0.0.0`, so this repository
also supplies a dedicated nftables table and system unit that reject TCP 5900
unless the incoming interface is `lo`. The bridge remains loopback-only.

## KRFB setup and authentication

Install the host packages and configure KRFB once from the logged-in Plasma
session:

```bash
apt-cache policy krfb
sudo apt install --allow-downgrades \
  krfb=4:26.04.3-0zneon+24.04+noble+release+build53 \
  python3-websockify
sudo apt-mark hold krfb
krfb
```

The exact version must be present in `apt-cache policy`; do not substitute an
unverified 26.08.0 or 26.08.1 build. Keep the original package in a host-local
recovery directory if a later rollback is needed. The package hold is a temporary
operational guard, not an application dependency.

When official release notes or source document a fixed KRFB release, inspect
the candidate before removing the hold:

Only remove the hold after the fixed version has been confirmed. Then install
only the KRFB candidate and restart the user services:

```bash
apt-cache policy krfb
sudo apt-mark unhold krfb
sudo apt install --only-upgrade krfb
systemctl --user restart htpc-desktop-vnc.service htpc-desktop-websockify.service
ss -ltnp | grep -E ':(5900|6080)\b'
```

This installs only the KRFB candidate. Repeat the authentication, portal, and
LAN-block checks. If the listener regresses, restore the pinned build and hold
it again:

```bash
sudo apt install --allow-downgrades \
  krfb=4:26.04.3-0zneon+24.04+noble+release+build53
sudo apt-mark hold krfb
```

In KRFB's graphical settings, enable **Allow connections without an
invitation**, set its unattended-access password, and keep **Allow remote
connections to manage the desktop** enabled. Disable **Announce the service on
the local network** because the app uses the fixed same-origin Caddy route.
The setup does not print, generate, or store a password in this repository.

KRFB first checks its unattended-access password. A matching unattended
credential auto-accepts the connection; the ordinary desktop-sharing
credential follows the invitation path and can wait for a confirmation dialog,
which is unsuitable when the TV is off. KRFB stores both credentials in the
KWallet folder `krfb`, under `desktopSharingPassword` and
`unattendedAccessPassword`, unless its no-wallet setting is selected. Configure
credentials through KRFB/KWallet rather than scripting secret-bearing config.
Close the graphical setup instance before enabling the generated `--nodialog`
user service so that the service owns the single KRFB process.

KWallet is preferable when it is available and unlocked with the session. A
host may instead use KRFB's no-wallet KConfig fallback when KWallet is absent;
KRFB obscures those fallback values in its config, but that file is still
credential-bearing and must remain user-readable only (private config
directory, mode `0700`; config file, mode `0600`). The live host uses the
default `~/.config/krfbrc` fallback config with mode `0600`; its host-only
provisioning material is kept under `~/.config/htpc-desktop` (directory mode
`0700`, password file mode `0600`). The separate desktop and unattended
credentials remain host-local and are never copied into the repository. This
avoids an unlock prompt at service start while providing weaker secret
isolation than KWallet.

Install the narrow guard and verify it before starting the generated KRFB
service:

```bash
sudo bash linux/desktop-sharing/install-krfb-firewall.sh
sudo nft -c -f /etc/htpc-desktop-firewall.nft
sudo systemctl enable --now htpc-desktop-firewall.service

bash linux/desktop-sharing/setup-wayland-desktop-sharing.sh \
  --backend krfb --allow-krfb-external-bind --enable
```

The `--enable` preflight refuses to start the KRFB user unit unless the guard
is active. Check listeners and the rule after activation:

```bash
ss -ltnp | grep -E ':(5900|6080)\b'
sudo nft list chain inet htpc_desktop_guard input
systemctl --user status htpc-desktop-vnc.service htpc-desktop-websockify.service
```

The host guard and both user units are enabled. Verify the actual listeners
after every restart; service `active` status alone is insufficient because
the 26.08.0/26.08.1 regression left KRFB active without an RFB socket:

```bash
ss -ltnp | grep -E ':(5900|6080)\b'
```

The recovered host should show KRFB on `0.0.0.0:5900` (and commonly
`[::]:5900`) and websockify on `127.0.0.1:6080`. The browser should reach the
noVNC login through `/desktop/websockify`; an incorrect unattended password
must be rejected and the host's private unattended password must complete the
RFB handshake. A successful handshake is only an authentication check: if
ServerInit reports `0x0` dimensions, the capture state is unresolved. Check
for a physical-monitor portal prompt and confirm that the chosen
monitor/output is available before assuming a new approval will fix it.
Capture, remote input, reconnect, and TV-off behavior remain pending the live
test matrix.

The dedicated guard has an `accept` policy and only rejects non-loopback TCP
5900, preserving unrelated firewall traffic. It is installed by
`linux/desktop-sharing/install-krfb-firewall.sh` as
`/etc/htpc-desktop-firewall.nft` plus
`linux/systemd/htpc-desktop-firewall.service`. The remaining host checks are a
LAN connection test plus first portal approval, capture, input, reconnect, and
TV-off validation. The service rebuilds its dedicated table as one nft
transaction and deliberately leaves the rule installed when it is stopped.
Remove it explicitly only after KRFB is stopped:

```bash
systemctl --user stop htpc-desktop-vnc.service htpc-desktop-websockify.service
sudo nft destroy table inet htpc_desktop_guard
```

## Wayland portal and TV-off limits

KRFB's PipeWire backend requests remote desktop device types `7` (keyboard,
pointer, and touchscreen), asks the portal to persist permission until
revoked, and saves the returned restore token in its KDE state config. The
portal still needs an initial screen/source selection and approval in the
active session; choose the physical monitor and the keyboard/pointer/touch
permissions, then choose the persistent approval option when offered. The
portal permission is separate from the KRFB unattended VNC password. The
26.04.3 downgrade normally reuses the same app identity and KDE state, so a
previous persisted approval should survive a restart/package change. The
portal may still ask again if its restore token is missing or invalid, the
permission was revoked, or the physical output is unavailable. If a monitor
disappears, the portal specification explicitly allows a restore token to be
ignored. A TV-off test must therefore confirm both capture and reconnect
behavior on this host; the repository's EDID assets are not proof that this
works.

The repository's EDID override preserves display modes where the HDMI chain
supports it, but it does not prove that KWin continues to expose a
captureable output when the TV or AVR is powered off. Verify with the actual
HTPC that frames update and input works with the TV off, the AVR off, and both
off, and that reconnecting does not require a dialog on the unavailable TV.

## App scope

The browser can use noVNC's `RFB` client with the same-origin WebSocket URL.
The fixed `/desktop/websockify` route requires no frontend or deployment
application environment variables:

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

Load the client only when the Desktop modal opens. The preview container must
own pointer and touch events while active (`touch-action: none` and stopped
propagation) so the ancestor `SwipeDetector` does not turn desktop drags into
panel swipes. Keep keyboard focus on the RFB target and provide a visible
disconnect action for phone layouts. noVNC supplies touch and keyboard input;
the usable viewport and keyboard behavior still require testing on the target
mobile browsers.

## Future host backends

KDE KRdp is an RDP server and cannot be used as the RFB target for noVNC.
TigerVNC's `Xvnc` creates a separate virtual X11 session and would not control
the existing HTPC applications. A future X11 path can use an existing-display
server such as `x0vncserver`; a Windows path needs a maintained console-session
VNC server with its login, lock-screen, elevated-window, and display-off
behavior verified. These backends can reuse the browser contract once their
host prerequisites meet it.

## Official references

- [KDE KRFB current Wayland entry point](https://raw.githubusercontent.com/KDE/krfb/master/krfb/main.cpp)
- [KDE KRFB PipeWire and portal backend](https://raw.githubusercontent.com/KDE/krfb/master/framebuffers/pipewire/pw_framebuffer.cpp)
- [KDE KRFB listener and KWallet credentials](https://raw.githubusercontent.com/KDE/krfb/master/krfb/invitationsrfbserver.cpp)
- [KDE KRFB consent and unattended access](https://raw.githubusercontent.com/KDE/krfb/master/krfb/invitationsrfbclient.cpp)
- [KDE KRFB settings schema](https://raw.githubusercontent.com/KDE/krfb/master/krfb/krfb.kcfg)
- [KDE Bug 524610: KRFB 26.08.0/26.08.1 have no VNC listener](https://bugs.kde.org/show_bug.cgi?id=524610)
- [KDE KRFB 26.04.3 PipeWire source](https://raw.githubusercontent.com/KDE/krfb/v26.04.3/framebuffers/pipewire/pw_framebuffer.cpp)
- [KDE KRFB 26.08.1 PipeWire source](https://raw.githubusercontent.com/KDE/krfb/v26.08.1/framebuffers/pipewire/pw_framebuffer.cpp)
- [KDE KRFB 26.04.3 listener source](https://raw.githubusercontent.com/KDE/krfb/v26.04.3/krfb/rfbserver.cpp)
- [KDE KWallet API](https://api.kde.org/kwallet-wallet.html)
- [XDG Desktop Portal RemoteDesktop API](https://github.com/flatpak/xdg-desktop-portal/blob/main/data/org.freedesktop.portal.RemoteDesktop.xml)
- [TigerVNC `x0vncserver` manual](https://github.com/TigerVNC/tigervnc/blob/master/unix/x0vncserver/x0vncserver.man)
- [TigerVNC `Xvnc` manual](https://github.com/TigerVNC/tigervnc/blob/master/unix/xserver/hw/vnc/Xvnc.man)
- [noVNC websockify](https://github.com/novnc/websockify)
- [Caddy reverse proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)
- [systemd network resource controls](https://github.com/systemd/systemd/blob/main/man/systemd.resource-control.xml)
