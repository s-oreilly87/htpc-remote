# Windows Setup

This document covers setup for a Windows HTPC using EventGhost for keystroke and app control.

> **TODO:** This section is a stub. EventGhost configuration files and downstream dependencies are pending collection.

---

## Overview

On Windows, HTPC control is handled via [EventGhost](http://www.eventghost.net/) — a free automation tool that exposes an HTTP server plugin. The Next.js app sends HTTP events to EventGhost, which maps them to keystrokes, application launches, and display/audio changes.

Set `NEXT_PUBLIC_HTPC_PLATFORM=PC` in `.env.local`.

---

## EventGhost setup

*TODO: Document EventGhost installation, HTTP server plugin configuration, and import of the provided `.egtree` configuration file.*

Key things to cover:
- Install EventGhost
- Enable the HTTP server plugin on the expected port
- Import the provided configuration file (to be added to `windows/` once collected)
- Configure the port to match `NEXT_PUBLIC_HTPC_IP` / EventGhost URL in the app

---

## Display and audio switching

On Windows, display and audio mode switching uses EventGhost event names (`egValue` fields in `src/constants/pc.ts`) rather than shell scripts. The events map to whatever automation EventGhost is configured to perform (e.g. NirCmd, resolution switcher utilities, etc.).

*TODO: Document specific tools and EventGhost actions used for display resolution and audio output switching.*

---

## windows/ folder structure

```
windows/
  README.md              # This file
  # TODO: EventGhost configuration files (.egtree)
  # TODO: Any helper utilities or scripts
```
