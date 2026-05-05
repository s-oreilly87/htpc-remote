# Windows Setup

On Windows, HTPC control is handled via [EventGhost](http://www.eventghost.net/) — a free automation tool that exposes an HTTP(S) event server. The Next.js app sends HTTP events to EventGhost, which maps them to keystrokes, display switching, audio output changes, and app launches.

Set `NEXT_PUBLIC_HTPC_PLATFORM=PC` in `.env.local`.

---

## Prerequisites

- **[EventGhost 0.5 RC7](https://github.com/EventGhost/EventGhost/releases/tag/v0.5.0-rc7)** — the specific version matters. Do not use the old 0.4.x stable release.
- Node.js 18+ (for the Next.js app)

---

## Install

### 1. Install EventGhost 0.5 RC7

Download and install from the link above. Default install path: `C:\Program Files (x86)\EventGhost\`.

### 2. Apply the modified plugins

Two stock EG plugins have been modified to add functionality. Copy them into EventGhost's plugins directory, overwriting the originals:

```
windows/htpc-agent/EventGhost/htpc-remote/Modified DenonTCPIP EG plugin/
  → C:\Program Files (x86)\EventGhost\plugins\DenonTCPIP\__init__.py

windows/htpc-agent/EventGhost/htpc-remote/Modified Window Plugin to Add Media Keys/Window/
  → C:\Program Files (x86)\EventGhost\plugins\Window\
    (copy all files: __init__.py, FindWindow.py, SendKeys.py, win32_ctrls.py, icon.png, icons/)
```

**What was modified:**
- `DenonTCPIP` — adds Denon AVR TCP/IP control actions used for quick-select sound modes
- `Window` — adds media key support (`{MediaPlayPause}`, `{MediaNextTrack}`, etc.) to the SendKeys action

### 3. Copy the htpc-remote folder into EventGhost

Copy the entire `htpc-remote` folder into the EventGhost directory:

```
windows/htpc-agent/EventGhost/htpc-remote/
  → C:\Program Files (x86)\EventGhost\htpc-remote\
```

The utilities, egtree, webserver certs, and keepalive script must all stay in their relative positions inside this folder. The egtrees reference paths under `htpc-remote\utilities\` — **do not rename or restructure the folder**.

> ⚠️ **Hardcoded paths:** The `.egtree` file contains absolute paths built against the original machine (`Sean\utilities\...`). On a clean install, these paths will break. After loading the egtree, search for `Sean` in EventGhost's macro list and update any broken paths to point to your `htpc-remote\utilities\` folder. A find/replace in the raw `.egtree` XML (it's a text file) before loading is the fastest approach.

### 4. Load the egtree

In EventGhost: **File → Open** → select:
```
C:\Program Files (x86)\EventGhost\htpc-remote\HTTPS Event Server for Remote-next.egtree
```

The egtree sets up the HTTPS event server on port 4005 and maps all incoming HTTP events to audio, display, keystroke, and app launch macros.

### 5. Configure the HTTPS event server

The egtree includes self-signed SSL certs (`webserver/eventghost-cert.pem` / `eventghost-key.pem`). These are machine-generated and **must be regenerated on a new system** — see [Regenerating SSL certs](#regenerating-ssl-certs) below.

Set `NEXT_PUBLIC_HTPC_IP` in `.env.local` to the Windows HTPC's LAN IP. The Next.js app sends events to `https://{HTPC_IP}:4005`.

### 6. Configure autostart via keepalive script

Do **not** add `EventGhost.exe` directly to Windows Startup — if EG crashes, it won't recover. Instead, add the VBScript keepalive to Startup:

1. Copy the shortcut or create a new one pointing to:
   ```
   C:\Program Files (x86)\EventGhost\htpc-remote\KEEPALIVE SCRIPT - ADD THIS TO STARTUP INSTEAD OF EventGhost.exe\keepEGRunning.vbs
   ```
2. Press `Win+R` → `shell:startup` → paste the shortcut there.

The script polls for `EventGhost.exe` every 5 seconds and relaunches it minimized if it's not running.

---

## Hardware-specific presets (must rebuild on new system)

The following files contain hardware identifiers from the original machine. They will not work on a different system without being rebuilt using the included tools.

### Display presets — MultiMonitorTool

`utilities/multimonitortool/*.cfg` files contain monitor hardware IDs (`MONITOR\ACR062C\...`, `MONITOR\TCL0000\...`) and positions that are unique to the original display setup.

To rebuild for a new system:
1. Open `MultiMonitorTool.exe`
2. Configure each display preset (PC-only, TV 4K60, TV 1440p120, etc.) using the GUI
3. Save each preset as a `.cfg` file with the corresponding name
4. Update any egtree macros that reference old monitor IDs

### Audio presets — SoundVolumeView

`utilities/soundvolumeviewGUI/*.dat` and `*.spr` files contain audio device identifiers specific to the original machine's sound hardware.

To rebuild:
1. Open `SoundVolumeView.exe`
2. Find your DENON output device and configure the desired format/spatial settings
3. Save as a new `.spr` profile file for each audio mode (Stereo, 5.1, Atmos)
4. Update the `.bat` files in `soundvolumeviewGUI/` to reference your new profiles

For CLI-style automation, `utilities/soundvolumeviewCLI/svcl.exe` (SoundVolumeCommandLine) can also be used — the `.bat` files there match by device name string ("DENON-AVR") and may work as-is if your device name matches.

### SSL certificates — HTTPS event server

The included `.pem` files were generated for the original machine. Regenerate them with OpenSSL:

```bash
openssl req -x509 -newkey rsa:2048 -keyout eventghost-key.pem -out eventghost-cert.pem \
  -days 3650 -nodes -subj "/CN=htpc-eventghost"
```

Place the new files in `htpc-remote\webserver\` and reconfigure the EventGhost HTTPS server plugin to point to them.

---

## Utilities reference

All utilities are bundled in `utilities/` and are freeware from [NirSoft](https://www.nirsoft.net/) or other credited sources. No installation required — they run from the folder as-is.

| Tool | Source | Purpose |
|---|---|---|
| `MultiMonitorTool.exe` | [NirSoft](https://www.nirsoft.net/utils/multi_monitor_tool.html) | Display preset switching (enable/disable monitors, set resolution/refresh) |
| `SoundVolumeView.exe` | [NirSoft](https://www.nirsoft.net/utils/sound_volume_view.html) | Audio output preset switching via GUI profiles |
| `svcl.exe` (SoundVolumeCommandLine) | [NirSoft](https://www.nirsoft.net/utils/sound_volume_command_line.html) | Audio output switching via command line |
| `ControlMyMonitor.exe` | [NirSoft](https://www.nirsoft.net/utils/control_my_monitor.html) | DDC/CI monitor input switching and power control |
| `DisplaySwitch.exe` | Windows built-in | Basic display topology switching (extend/clone/internal/external) |
| `SoundKeeper64.exe` | [GitHub](https://github.com/vrubleg/soundkeeper) | Keeps HDMI audio device awake to prevent dropout when idle |

---

## windows/ folder structure

```
windows/
  README.md
  htpc-agent/
    EventGhost/
      htpc-remote/                        ← copy this entire folder into C:\Program Files (x86)\EventGhost\
        HTTPS Event Server for Remote-next.egtree   ← load this in EventGhost
        Modified DenonTCPIP EG plugin/              ← copy contents to EG plugins\DenonTCPIP\
        Modified Window Plugin to Add Media Keys/   ← copy contents to EG plugins\Window\
        KEEPALIVE SCRIPT .../
          keepEGRunning.vbs               ← add to Windows Startup
        utilities/
          multimonitortool/               ← display preset switching (NirSoft)
          soundvolumeviewGUI/             ← audio preset switching GUI (NirSoft)
          soundvolumeviewCLI/             ← audio switching CLI / svcl.exe (NirSoft)
          soundkeeper/                    ← HDMI audio keepalive
          ControlMyMonitor.exe            ← DDC/CI monitor control (NirSoft)
          DisplaySwitch.exe               ← Windows display topology helper
        webserver/
          eventghost-cert.pem             ← SSL cert (regenerate for new machine)
          eventghost-key.pem              ← SSL key (regenerate for new machine)
          index.html                      ← EG web server status page
```
