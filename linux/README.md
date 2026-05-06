# Linux Setup

This document covers setup for Linux in two roles:

- **HTPC-only** — the Linux machine being controlled. Runs `htpc-agent` so a remote Next.js host can reach it. Does not run the Next.js app.
- **Host (HTPC is the host)** — the Linux machine runs both the Next.js app and the HTPC scripts locally. No agent needed.

The tested configuration is **KDE Neon (Ubuntu 24.04 base), Plasma 6.5.3, Wayland**.

---

## Install scripts

Four scripts cover the supported combinations. Run the one that matches your setup from the `linux/` directory:

| Script | Platform | Role |
|---|---|---|
| `install-wayland-htpc-standalone.sh` | KDE Wayland | HTPC-only (agent + all scripts) |
| `install-x11-htpc-standalone.sh` | X11 | HTPC-only (agent + shared scripts) |
| `install-wayland-htpc-host.sh` | KDE Wayland | Host machine (Next.js + Caddy + all scripts) |
| `install-x11-htpc-host.sh` | X11 | Host machine (Next.js + Caddy + shared scripts) |

**HTPC-only** means your Next.js server runs on a separate machine. Copy the `linux/` folder to the HTPC, then run the appropriate standalone script:

```bash
# From the host machine
scp -r ~/WebstormProjects/htpc-remote/linux/ htpc:~/htpc-remote-linux/

# On the HTPC
cd ~/htpc-remote-linux
bash install-wayland-htpc-standalone.sh          # KDE Wayland
# or
bash install-x11-htpc-standalone.sh             # X11
```

Options available on all scripts:
```bash
--port 3001        # htpc-agent listen port (standalone scripts only)
--scripts ~/bin    # where to install shell scripts
--repo ~/path      # repo root, for htpc-remote.service (host scripts only)
```

To stop the agent and remove autostart:
```bash
systemctl --user disable --now htpc-agent
```

---

## Prerequisites

Before running any install script, install these manually.

### ydotool

HDR requires Wayland, and NutJS does not work under Wayland — ydotool replaces it as the input backend. Build from source (the apt package is often outdated):

```bash
sudo apt install build-essential cmake pkg-config libevdev-dev libudev-dev scdoc

git clone https://github.com/ReimuNotMoe/ydotool.git
cd ydotool && mkdir build && cd build
cmake .. && make -j$(nproc) && sudo make install
# Installs to /usr/local/bin/ydotool and /usr/local/bin/ydotoold
```

> `systemctl --user` cannot be run under sudo — run it as your normal user in a login session.

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

## Shell scripts

Scripts are split into two groups:

**`scripts/shared/`** — work on both Wayland and X11:

| Script | Purpose |
|---|---|
| `htpc-audio` | Switch PipeWire audio output profile via `pactl` |
| `htpc-key` | Send keystrokes via ydotool; Kodi JSON-RPC for media keys when Kodi is active |
| `htpc-launch` | Launch HTPC apps (Kodi, Plexamp, Moonlight, Qobuz) |
| `htpc-kill` | Kill HTPC apps by process name |
| `htpc-listen` | Set up audio routing and launch Plexamp or Qobuz in listen mode |
| `kodi-alsa` | Kodi launcher with `AE_SINK=ALSA` for bitstream passthrough |
| `denon-remap-init` | PipeWire 5.1 remap sink setup |
| `plexamp` | Native Plexamp AppImage launcher |
| `plexamp-wine` | Plexamp (Windows) via Wine |
| `qobuz-wine` | Qobuz (Windows) via Wine |
| `qobuzapp-wine-url` | URL handler for Qobuz deep links via Wine |

**`scripts/wayland/`** — KDE Wayland only:

| Script | Purpose |
|---|---|
| `htpc-res` | Switch display resolution and HDR mode via `kscreen-doctor` |
| `kwin-close-window.sh` | Close the active KWin window via qdbus (used by `htpc-key`) |

Review each script for machine-specific values before using:
- `htpc-audio`: ALSA card ID (`CARD=alsa_card.pci-...`) — find yours with `pactl list cards short`
- `htpc-listen`: sink names and card ID
- `plexamp-wine` / `qobuz-wine`: Wine prefix paths (see [App launchers](#app-launchers) below)

The install scripts copy all relevant scripts to `~/bin/` and chmod them automatically.

---

## Display configuration and EDID override

To reliably expose 4K60 HDR and 1440p120 modes through an AVR (which can strip EDID capabilities), inject a custom EDID at the kernel level. A reference EDID binary is in `linux/edid/`.

```bash
sudo mkdir -p /lib/firmware/edid
sudo cp linux/edid/denon-1440p120.edid /lib/firmware/edid/
```

Edit `/etc/default/grub` (reference in `linux/config/grub`):
```
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash drm.edid_firmware=HDMI-A-1:edid/denon-1440p120.edid video=HDMI-A-1:e"
```

```bash
sudo update-grub
```

`/lib/firmware` persists across kernel updates and is automatically included in the initramfs — no per-kernel copying needed. The install scripts print the EDID commands but don't run them automatically (they require a reboot).

`htpc-res` uses `kscreen-doctor` to switch modes at runtime. It hardcodes the supported presets (4k60, 4k60SDR, 1440p120, 1440p120SDR) — no kscreen profile files are needed.

> `kscreen-doctor` output includes ANSI escape codes. The script handles this internally.

---

## Audio

Two separate audio paths are in use:

**Kodi → ALSA → HDMI → Denon** (bitstream HD audio / passthrough). Kodi must be launched with `AE_SINK=ALSA` — use the `kodi-alsa` wrapper script in `scripts/shared/` rather than launching Kodi directly. Passthrough only works if the AVR is powered on at Kodi startup.

**Everything else (Plexamp, Qobuz) → PipeWire → Denon/TV.** Plexamp uses a remapped 5.1 PipeWire sink (`denon51_remap`) to correct the channel ordering for the Denon AVR. The `denon-remap-init` script and `denon-remap.service` set this up at login.

The `denon-remap.service` systemd unit hardcodes an ALSA card ID (`alsa_card.pci-0000_00_1f.3`). The install scripts warn about this. Check yours with:
```bash
pactl list cards short
```

Install required PipeWire packages for 5.1 output:
```bash
sudo apt install pipewire pipewire-pulse pipewire-audio-client-libraries alsa-utils libavcodec-extra
```

---

## App launchers

Plexamp and Qobuz run via Wine. Wine prefixes must be configured before the launch scripts will work:

- `plexamp-wine`: uses `~/.wine-plexamp` — install Plexamp for Windows into this prefix
- `qobuz-wine`: uses `~/.wine-qobuz` — install Qobuz for Windows into this prefix

A native Plexamp AppImage launcher (`plexamp`) is also included if you prefer the native build, but the Wine version is what `htpc-launch` and `htpc-listen` use.

---

## HTTPS / PWA — Caddy

PWA installation and the AirMouse gyroscope API both require HTTPS with a valid certificate. Caddy is used as a reverse proxy.

The reference `Caddyfile` is in `linux/host/caddy/`. It uses a custom local domain with manually provisioned certificates stored at `/etc/ssl/localcerts/`. Adjust the domain and cert paths for your setup.

```bash
sudo cp linux/host/caddy/Caddyfile /etc/caddy/Caddyfile
# Edit domain name and cert paths, then:
sudo systemctl enable --now caddy
```

Caddy runs as a system service (not a user service) because it needs to bind port 443. The `linux/systemd/caddy.service` file is the standard upstream Caddy service, included here for reference only; it is normally installed by the Caddy apt package.

---

## Systemd services

All service files are in `linux/systemd/`. The install scripts generate and enable the appropriate ones automatically. For manual installation:

```bash
# User services (run as your login user)
cp linux/systemd/htpc-agent.service    ~/.config/systemd/user/   # HTPC-only
cp linux/systemd/htpc-remote.service   ~/.config/systemd/user/   # Host
cp linux/systemd/htpc-remote-update.service   ~/.config/systemd/user/   # Host
cp linux/systemd/htpc-remote-update.timer     ~/.config/systemd/user/   # Host
cp linux/systemd/ydotoold.service      ~/.config/systemd/user/
cp linux/systemd/denon-remap.service   ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now htpc-agent           # or htpc-remote
systemctl --user enable --now ydotoold
systemctl --user enable --now denon-remap
systemctl --user enable --now htpc-remote-update.timer

# System service (requires sudo — normally installed by Caddy apt package)
sudo systemctl enable --now caddy
```

> `htpc-agent.service` and `htpc-remote.service` in `linux/systemd/` are reference files — the install scripts generate versions with correct absolute paths substituted in.

### Auto-update timer

`htpc-remote-update.timer` fires `htpc-remote-update.service` at 2am daily. The service runs `git pull origin master && npm install --omit=dev`, then restarts `htpc-remote`. `Persistent=true` means if the machine was off at 2am, the update runs on next boot.

```bash
# Check next scheduled run
systemctl --user list-timers htpc-remote-update

# Trigger manually (e.g. to apply a fix without waiting for 2am)
systemctl --user start htpc-remote-update
journalctl --user -u htpc-remote-update -f
```

---

## linux/ folder structure

```
linux/
  agent/                        # Standalone agent files (deployed to ~/htpc-agent/)
    index.mjs
    package.json
  scripts/
    shared/                     # Scripts that work on Wayland and X11
      htpc-audio                # PipeWire audio profile switching
      htpc-key                  # Keystroke dispatch (ydotool + Kodi JSON-RPC)
      htpc-launch               # App launching
      htpc-kill                 # App process kill
      htpc-listen               # Audio routing + app launch for listen modes
      kodi-alsa                 # Kodi launcher with AE_SINK=ALSA
      denon-remap-init          # PipeWire 5.1 remap sink setup
      plexamp                   # Native Plexamp AppImage launcher
      plexamp-wine              # Plexamp (Windows) via Wine
      qobuz-wine                # Qobuz (Windows) via Wine
      qobuzapp-wine-url         # URL handler for Qobuz deep links via Wine
    wayland/                    # KDE Wayland-specific scripts
      htpc-res                  # Display mode switching (kscreen-doctor)
      kwin-close-window.sh      # KWin close-window via qdbus
  host/
    caddy/
      Caddyfile                 # Reference Caddyfile for Caddy reverse proxy
  systemd/                      # Reference systemd unit files
    htpc-agent.service          # Agent service (install scripts generate from this)
    htpc-remote.service         # Next.js app service (install scripts generate from this)
    htpc-remote-update.service         # Oneshot: git pull + npm install + restart htpc-remote
    htpc-remote-update.timer           # Triggers htpc-remote-update.service daily at 2am
    ydotoold.service            # ydotool daemon
    denon-remap.service         # PipeWire remap sink setup at login
    caddy.service               # Caddy system service reference
  config/
    grub                        # Reference /etc/default/grub with EDID kernel parameter
  edid/
    denon-1440p120.edid         # Custom EDID binary for AVR passthrough
  install-wayland-htpc-standalone.sh   # KDE Wayland HTPC-only installer
  install-x11-htpc-standalone.sh       # X11 HTPC-only installer
  install-wayland-htpc-host.sh         # KDE Wayland host installer
  install-x11-htpc-host.sh             # X11 host installer
```
