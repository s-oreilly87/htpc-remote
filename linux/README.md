# Linux Setup

This document covers setup for Linux in two roles:

- **HTPC-only** — the Linux machine being controlled. Runs `htpc-agent` so a remote Next.js host can reach it. Does not run the Next.js app.
- **Host (HTPC is the host)** — the Linux machine runs both the Next.js app and the HTPC scripts locally. No agent needed.

The tested configuration is **KDE Neon (Ubuntu 24.04 base), Plasma 6.5.3, Wayland**.

---

## HTPC-only install (remote control target)

Use this when your Next.js server runs on a separate machine (e.g. a Mac for development, or a dedicated server box). The HTPC just needs the agent.

Copy the `linux/` folder to the HTPC and run the install script:

```bash
# From the host machine
scp -r ~/WebstormProjects/htpc-remote/linux/ htpc:~/htpc-remote-linux/

# On the HTPC
bash ~/htpc-remote-linux/install-agent.sh
```

Options:
```bash
bash install-agent.sh --port 3001 --scripts ~/bin
```

The script installs the agent to `~/htpc-agent/`, installs its dependencies (`socket.io`), writes a systemd user service, and enables it. Logs: `journalctl --user -u htpc-agent -f`.

To stop the agent and remove autostart:
```bash
systemctl --user disable --now htpc-agent
```

### Shell scripts

The agent dispatches to six shell scripts that must be present and executable in `~/bin/` (or the prefix configured via `--scripts`). Reference implementations are in `linux/bin/` — copy them and adjust any machine-specific values (ALSA card ID, Wine prefix paths, etc.):

| Script | Purpose |
|---|---|
| `htpc-res` | Switch display resolution and HDR mode via `kscreen-doctor` |
| `htpc-audio` | Switch PipeWire audio output profile via `pactl` |
| `htpc-key` | Send keystrokes via ydotool; Kodi JSON-RPC for media keys when Kodi is active |
| `htpc-launch` | Launch HTPC apps (Kodi, Plexamp, Moonlight, Qobuz) |
| `htpc-kill` | Kill HTPC apps by process name |
| `htpc-listen` | Set up audio routing and launch Plexamp or Qobuz in listen mode |

```bash
cp linux/bin/* ~/bin/
chmod +x ~/bin/htpc-*
```

Review each script for machine-specific values before using:
- `htpc-audio`: ALSA card ID (`CARD=alsa_card.pci-...`) — find yours with `pactl list cards short`
- `htpc-listen`: sink names and card ID
- `htpc-key`: references `kwin-close-window.sh` — included in `linux/bin/`
- `plexamp-wine` / `qobuz-wine`: Wine prefix paths (see [App launchers](#app-launchers) below)

---

## Full host install (Next.js + HTPC on same machine)

### ydotool

HDR requires Wayland, and NutJS does not work under Wayland — ydotool replaces it as the input backend. Build from source (the apt package is often outdated):

```bash
sudo apt install build-essential cmake pkg-config libevdev-dev libudev-dev scdoc

git clone https://github.com/ReimuNotMoe/ydotool.git
cd ydotool && mkdir build && cd build
cmake .. && make -j$(nproc) && sudo make install
# Installs to /usr/local/bin/ydotool and /usr/local/bin/ydotoold
```

Install the ydotoold daemon as a systemd user unit (see `linux/systemd/ydotoold.service`):

```bash
cp linux/systemd/ydotoold.service ~/.config/systemd/user/
systemctl --user enable --now ydotoold
```

> `systemctl --user` cannot be run under sudo — run it as your normal user in a login session.

### Shell scripts

Same as the HTPC-only section above — copy `linux/bin/*` to `~/bin/` and make them executable.

### Display configuration and EDID override

To reliably expose 4K60 HDR and 1440p120 modes through an AVR (which can strip EDID capabilities), inject a custom EDID at the kernel level. A reference EDID binary is in `linux/edid/`.

```bash
sudo cp linux/edid/denon-1440p120.edid /lib/firmware/edid/denon-1440p120.edid
```

Edit `/etc/default/grub` (reference in `linux/config/grub`):
```
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash drm.edid_firmware=HDMI-A-1:edid/denon-1440p120.edid video=HDMI-A-1:e"
```

```bash
sudo update-grub
```

`/lib/firmware` persists across kernel updates and is automatically included in the initramfs — no per-kernel copying needed.

`htpc-res` uses `kscreen-doctor` to switch modes at runtime. It hardcodes the supported presets (4k60, 4k60SDR, 1440p120, 1440p120SDR) — no kscreen profile files are needed.

> `kscreen-doctor` output includes ANSI escape codes. The script handles this internally.

### Audio

Two separate audio paths are in use:

**Kodi → ALSA → HDMI → Denon** (bitstream HD audio / passthrough). Kodi must be launched with `AE_SINK=ALSA` — use the `kodi-alsa` wrapper script in `linux/bin/` rather than launching Kodi directly. Passthrough only works if the AVR is powered on at Kodi startup.

**Everything else (Plexamp, Qobuz) → PipeWire → Denon/TV.** Plexamp uses a remapped 5.1 PipeWire sink (`denon51_remap`) to correct the channel ordering for the Denon AVR. The `denon-remap-init` script and `denon-remap.service` set this up at login.

```bash
cp linux/systemd/denon-remap.service ~/.config/systemd/user/
systemctl --user enable --now denon-remap
```

Install required PipeWire packages for 5.1 output:
```bash
sudo apt install pipewire pipewire-pulse pipewire-audio-client-libraries alsa-utils libavcodec-extra
```

### App launchers

Plexamp and Qobuz run via Wine. Wine prefixes must be configured before the launch scripts will work:

- `plexamp-wine`: uses `~/.wine-plexamp` — install Plexamp for Windows into this prefix
- `qobuz-wine`: uses `~/.wine-qobuz` — install Qobuz for Windows into this prefix

A native Plexamp AppImage launcher (`~/bin/plexamp`) is also included if you prefer the native build, but the Wine version is what `htpc-launch` and `htpc-listen` use.

### HTTPS / PWA — Caddy

PWA installation and the AirMouse gyroscope API both require HTTPS with a valid certificate. Caddy is used as a reverse proxy.

The reference `Caddyfile` is in `linux/caddy/`. It uses a custom local domain with manually provisioned certificates stored at `/etc/ssl/localcerts/`. Adjust the domain and cert paths for your setup.

```bash
sudo cp linux/caddy/Caddyfile /etc/caddy/Caddyfile
# Edit domain name and cert paths, then:
sudo systemctl enable --now caddy
```

Caddy runs as a system service (not a user service) because it needs to bind port 443. The service file is in `linux/systemd/caddy.service` — this is the standard upstream Caddy service, included here for reference only; it is normally installed by the Caddy apt package.

### Next.js app service

The `linux/systemd/htpc-remote.service` unit runs the Next.js app as a user service. It waits for KScreen and XWayland to be ready before starting (important on Wayland where the display stack takes a moment to come up).

```bash
cp linux/systemd/htpc-remote.service ~/.config/systemd/user/
systemctl --user enable --now htpc-remote
```

> The service calls `npm run deploy` — ensure this script is defined in `package.json` for your production start command.

### Full apt package list

```bash
sudo apt install \
  edid-decode i2c-tools \
  pipewire pipewire-pulse pipewire-audio-client-libraries \
  alsa-utils libavcodec-extra \
  kodi \
  nodejs npm \
  build-essential cmake pkg-config libevdev-dev libudev-dev scdoc \
  caddy
```

---

## linux/ folder structure

```
linux/
  bin/                      # Shell scripts — copy to ~/bin/ and make executable
    htpc-res                # Display mode switching (kscreen-doctor)
    htpc-audio              # PipeWire audio profile switching (pactl)
    htpc-key                # Keystroke dispatch (ydotool + Kodi JSON-RPC)
    htpc-launch             # App launching
    htpc-kill               # App process kill
    htpc-listen             # Audio routing + app launch for listen modes
    kodi-alsa               # Kodi launcher with AE_SINK=ALSA for passthrough
    denon-remap-init        # PipeWire 5.1 remap sink setup
    plexamp                 # Native Plexamp AppImage launcher
    plexamp-wine            # Plexamp (Windows) via Wine
    qobuz-wine              # Qobuz (Windows) via Wine
    kwin-close-window.sh    # KWin close-window via qdbus (used by htpc-key)
  systemd/                  # Systemd user units — copy to ~/.config/systemd/user/
    htpc-agent.service      # Agent service (for repo-on-HTPC case)
    htpc-remote.service     # Next.js app service
    ydotoold.service        # ydotool daemon
    denon-remap.service     # PipeWire remap sink setup at login
    caddy.service           # Caddy service reference (normally installed by apt)
  htpc-agent/               # Standalone agent (deployed to ~/htpc-agent/ on HTPC-only)
    index.mjs
    package.json
  caddy/
    Caddyfile               # Reference Caddyfile
  config/
    grub                    # Reference /etc/default/grub with EDID kernel parameter
  edid/
    denon-1440p120.edid     # Custom EDID binary for AVR passthrough
  install-agent.sh          # One-shot HTPC-only installer
```
