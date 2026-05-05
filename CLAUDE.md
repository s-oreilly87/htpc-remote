# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

## Commands

```bash
npm run dev      # Start development server (always use this — never build/start)
npm run lint     # ESLint via Next.js
tsc --noEmit     # Type-check without emitting
```

**Never run** `next build`, `next start`, or generate production artifacts.

## Architecture

Next.js 13 (Pages Router) TypeScript PWA. The app is a mobile web remote control for a home theater PC setup. It runs on a local server and is accessed from a phone browser.

### Three remote panels

Each panel lives under `src/components/RemotePanels/`:
- **Denon** — AVR receiver control via Telnet (`src/api-modules/denon/`) and HTTP rewrites in `next.config.js`
- **Roku** — TV control via Roku ECP (HTTP), proxied through Next.js rewrites
- **PC** — HTPC control via EventGhost (Windows) or ydotool/shell scripts (Linux), plus NutJS for mouse/keyboard automation

Shared panel primitives (Dpad, VolumeControls, MediaButtons, KeyboardGroup, BottomSection) live in `RemotePanels/Shared/`.

Panel switching uses swipe gestures and a navbar. `RemotePanelSlideScroll` handles animated transitions between panels. `KeepAlive` preserves each panel's state across switches.

### Platform routing

`NEXT_PUBLIC_HTPC_PLATFORM` env var determines HTPC backend:
- `PC` → EventGhost HTTP events
- `LINUX_WAYLAND` → ydotool + shell scripts (full control)
- `LINUX_X11` → NutJS + shell scripts (keystroke/mouse only when remote)
- `MACOS` → NutJS (keystroke/mouse only, must run on HTPC itself)

`NEXT_PUBLIC_HOST_IP` vs `NEXT_PUBLIC_HTPC_IP` determines local vs remote execution. When they differ, Linux commands are proxied to `linux/htpc-agent` on the HTPC.

`src/hooks/usePlatform.ts` exports `usePlatform()` (hook) and `getPlatformInfo()` (non-hook, safe to call at module level). Key flags: `isRemoteHtpc`, `hasFullHtpcControl`.

### API layer

`src/utilities/http.ts` is the single client-side HTTP utility — all fetch calls go through typed functions here. API routes in `src/pages/api/` map to device backends. Roku and Denon HTTP commands are proxied directly via `next.config.js` rewrites (no API handler needed).

### State management

- `src/context/denon.tsx` — React context for Denon AVR state (`DenonState`), with a refresh API
- `src/context/tplink.tsx` — TP-Link smart home device state
- Roku state lives in `index.tsx` and is passed down as props

### Types and constants

- `src/types/remote.ts` — shared domain types (`DenonState`, `AudioMode`, `DisplayMode`, `RokuChannel`, etc.)
- `src/types/api.ts` — API response types
- `src/constants/remotes.ts` — `RemoteType` enum, keystroke enums for all three remotes (`PcKeystroke`, `RokuKeystroke`, `DenonKeystroke`), unified `KEYSTROKE` map
- `src/constants/htpcControls.ts` — Linux-specific command enums with VALID_* arrays used for API route validation
- `src/constants/denon.ts`, `pc.ts`, `roku.ts` — device-specific config and mode definitions

### Tailwind notes

Custom screen sizes: `xs: 420px`, `remote: 550px`. Viewport height uses a CSS variable `--vh` (recalculated on resize) to handle mobile browser chrome — use `viewport-height`, `panel-height`, `panel-width` utility classes instead of `h-screen`.

The hidden divs at the top of `index.tsx` (e.g. `#dynamically-named-classes`) exist to force Tailwind to include classes that are only referenced at runtime via string interpolation. Do not remove them.

Button theming: `.btn-primary-denon`, `.btn-primary-roku`, `.btn-primary-pc` are defined in `globals.css` and applied dynamically. `.btn-secondary` is theme-neutral.

### Vendored dependency

`@nut-tree/nut-js` is not on the public npm registry — it's vendored at `vendor/@nut-tree/nut-js` and referenced via a `file:` path in `package.json`. Do not `npm install @nut-tree/nut-js` from the registry.

### Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_DENON_IP` | Denon AVR IP (default: `192.168.1.252`) |
| `NEXT_PUBLIC_ROKU_IP` | Roku device IP (default: `192.168.1.222`) |
| `NEXT_PUBLIC_PLATFORM` | HTPC backend: `PC`, `LINUX`, or `LINUX_WAYLAND` |

### Component conventions

- Functional components with hooks only
- Props interfaces: `Props` if local-only, `{ComponentName}Props` if exported
- New files in `.ts` / `.tsx` only; convert `.js`/`.jsx` to TS when touching them
- Fix type errors rather than suppressing with `any` (except unavoidable external-library cases)
