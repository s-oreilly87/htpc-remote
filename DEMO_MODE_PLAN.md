# Demo Mode — Implementation Plan

A "demo" build of the HTPC remote that runs without real device IPs. The remote panels work as normal, but every device call is intercepted and routed to an in-process simulator. A side panel renders a schematic view of the virtual home theater plus a scrolling event log so a viewer can watch the remote drive virtual state changes.

## Decisions (locked)

| Topic | Choice |
|---|---|
| Activation | Env var only: `NEXT_PUBLIC_DEMO_MODE=true` |
| Target viewport | Desktop showcase (≥ `lg` / 1024px). Hidden below that. |
| Visual style | Schematic flow with styled SVG device boxes |
| Event log | User-issued commands only (not state deltas, not internal queries) |
| Devices in scope | Denon AVR, Roku TV, HTPC, TP-Link smart-home lights |
| Cleanup | Address code smells as encountered, don't refactor speculatively |

## Architectural summary

One env var: `NEXT_PUBLIC_DEMO_MODE=true`. When true, every exported function in `src/utilities/http.ts` short-circuits to a singleton simulator at `src/demo/simulator.ts` instead of calling `fetch()`. The simulator owns four sub-stores (one per device), exposes a `subscribe()` for React consumers, and produces structured `EventLogEntry` records.

Because `denon-query.ts` and `roku-query.ts` already route exclusively through `http.ts`, those files don't need changes — the existing React Query contexts (`denon`, `roku`) hydrate from simulated data with no awareness that it's fake. The optimistic-update path (`updateDenonState`) keeps working.

TP-Link is the exception: `src/context/tplink.tsx` has a direct `fetch()` for `api/tp-link/info/...`, and `LightswitchToggle.tsx` likely does too. Phase 2 includes a small cleanup pass to route TP-Link through `http.ts` (was always a smell; the demo work forces us to fix it).

`NEXT_PUBLIC_*` env vars are inlined at build time, so the demo branch becomes a compile-time constant and dead-code-eliminates in the non-demo build. Bundle bloat from the simulator and demo UI only happens in demo builds.

## Phases

### Phase 1 — Simulator core

New folder: `src/demo/`. Pure TS, no React imports.

**Files to create:**

- `src/demo/types.ts` — `EventLogEntry`, `VirtualState`, `DeviceTarget` enum.
- `src/demo/initialState.ts` — sensible defaults (TV off, AVR off, no app running, lights off).
- `src/demo/simulator.ts` — `VirtualHomeTheater` singleton. Methods:
  - `subscribe(fn): () => void`
  - `getState(): VirtualState` — returns the immutable snapshot
  - `getEvents(): EventLogEntry[]`
  - `reset(): void`
  - `denon`, `roku`, `htpc`, `tplink` — sub-simulator handles, each exposing typed command methods
  - Internal: snapshot-based, every mutation produces a new top-level `VirtualState` so React subscribers see referential changes. Event log is a ring buffer capped at ~100 entries.
- `src/demo/devices/denon.ts` — Denon sub-simulator.
  - State mirrors `DenonState` from `src/types/remote.ts`
  - Handles every `DenonKeystroke` value: VOL_UP/DOWN increment `MV` by 0.5, input switches set `input`, MENU_ON/OFF, power toggle, mute toggle, sound-mode cycling, `PSDIL`/`PSREFLEV`/`PSDYNVOL` value setters
  - Synthesizes the XML-parsed shape returned by `fetchMainZoneData` and the telnet-array shape returned by `sendDenonQuery`
- `src/demo/devices/roku.ts` — Roku sub-simulator.
  - State: `{powerOn, currentApp, navigationFocus}` plus a static fake `apps` list and fake `device-info` payload
  - Handles keypress/keydown/keyup/launch/search
  - Synthesizes return shapes for `fetchRokuChannels` and `fetchRokuDeviceInfo`
- `src/demo/devices/htpc.ts` — HTPC sub-simulator.
  - State: `{activeApp, displayMode, audioMode}`
  - Handles `launchLinuxApp`, `killLinuxApp`, `setLinuxDisplayMode`, `setLinuxAudioMode`, the EventGhost commands (htpc + gamestream), keystrokes, and robot clicks
  - Keystrokes/clicks/robot-disable don't change state — just emit log entries
- `src/demo/devices/tplink.ts` — TP-Link sub-simulator.
  - State: a map of `deviceId → {powerState, brightness, error?}`, seeded with `yard-fence`, `yard-dining`, and `basement` to match `TplinkState`
  - Handles toggle (POST `/toggle/...`), brightness set (POST `/brightness/...`), info fetch (GET `/info/...`)

**Verification:** must compile under `tsc --noEmit`. No tests required.

**Hand-off prompt:**
> Build a non-React virtual device simulator for the htpc-remote app at `src/demo/`. Follow the spec in `DEMO_MODE_PLAN.md` Phase 1. The simulator must be entirely self-contained and importable from anywhere — pure TS, no React, no fetch. Don't touch `http.ts` yet — that's Phase 2. Verify with `tsc --noEmit`. The state shapes returned by simulator methods must exactly match the shapes that the corresponding `http.ts` functions return today (check `src/types/remote.ts` and the relevant `fetch*` / `send*` functions in `src/utilities/http.ts` for the contracts).

### Phase 2 — http.ts shim + TP-Link cleanup

**Primary edit:** `src/utilities/http.ts`.

Add at the top:
```ts
import { simulator } from "@/demo/simulator";
const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
```

Every exported function gets a demo branch. To keep `http.ts` readable, route the demo branches to a thin `src/demo/http-bridge.ts` module that owns the dispatch (one function per `http.ts` export), so each function in `http.ts` becomes:

```ts
export async function sendDenonCommand(...): Promise<FetchResult<string[]>> {
  if (IS_DEMO) return demoBridge.sendDenonCommand(...);
  // ...existing code unchanged
}
```

Per-function notes:

- `sendDenonCommand`: dispatch by `button.value`. The current `DENON_HTTP_COMMANDS.includes(...)` branch is irrelevant in demo — both paths land in the same simulator method.
- `fetchMainZoneData`, `fetchRokuDeviceInfo`, `fetchRokuChannels`: bypass XML parsing entirely; synthesize the parsed object directly from simulator state.
- `sendRokuKeypress` / `sendRokuKeydown` / `sendRokuKeyup` / `sendRokuLaunchCommand` / `sendRokuSearchQuery`: fire-and-forget, sync dispatch.
- `sendEventToHTPCEventGhost` / `sendEventToGameStreamEventGhost` / `sendClickToRobot` / `sendKeystrokeToHtpc` / `sendDisableCommandToRobot`: dispatch to HTPC simulator, emit log entry.
- `launchLinuxApp` / `killLinuxApp` / `setLinuxDisplayMode` / `setLinuxAudioMode`: dispatch to HTPC simulator, return `{ ok: true }`.

**Secondary edit: TP-Link cleanup.**

Two files have direct `fetch()` calls that bypass `http.ts`:
- `src/context/tplink.tsx` — line 51, `fetch(\`api/tp-link/info/${switchName}\`)`
- `src/components/RemotePanels/SmartHome/LightswitchToggle.tsx` — verify and migrate

Add new exports to `http.ts`:
- `fetchTplinkInfo(deviceId): Promise<FetchResult<TplinkDeviceState>>`
- `toggleTplinkSwitch(deviceId, on): Promise<ApiResponse>`
- `setTplinkBrightness(deviceId, brightness): Promise<ApiResponse>`

Migrate the two callers to use these. Confirms TP-Link works in non-demo mode unchanged, and gives Phase 2 the same chokepoint it has for the other devices.

**Verification:** with `NEXT_PUBLIC_DEMO_MODE=true npm run dev`, the app loads, no network calls go out to device IPs (DevTools network tab — only static asset requests should appear), and the Denon/Roku/TP-Link contexts hydrate from simulator state without errors.

**Hand-off prompt:**
> Wire the Phase 1 simulator into `src/utilities/http.ts` per `DEMO_MODE_PLAN.md` Phase 2. Also migrate the two TP-Link direct-`fetch` callers (`src/context/tplink.tsx` and `src/components/RemotePanels/SmartHome/LightswitchToggle.tsx`) to use new TP-Link helpers added to `http.ts`. When `NEXT_PUBLIC_DEMO_MODE=true`, every device call must short-circuit to the simulator and return the same shape it would in real mode. Don't change any callers other than the two TP-Link cleanup sites. Verify: start `NEXT_PUBLIC_DEMO_MODE=true npm run dev`, open DevTools network tab, exercise each remote panel, confirm zero network calls to device IPs.

### Phase 3 — Schematic visual + event log

New folder: `src/components/Demo/`.

**Files to create:**

- `src/hooks/useSimulator.ts` — `useSyncExternalStore` against `simulator.subscribe`. Returns `{state, events}`. Pure, no React Query involved.
- `src/components/Demo/HomeTheaterView.tsx` — the SVG schematic. Top-level layout: TV across the top, AVR centered below it, Roku and HTPC as source boxes flanking the AVR, speakers fanned around the TV, TP-Link lights along an edge. HDMI lines connect Roku→AVR, HTPC→AVR, AVR→TV. Audio lines AVR→speakers.
- `src/components/Demo/devices/RokuBox.tsx` — shows power state, current app icon/label.
- `src/components/Demo/devices/AvrBox.tsx` — shows power, volume bar, input label, sound mode badge, mute indicator.
- `src/components/Demo/devices/TvBox.tsx` — shows the "screen": current source's display (Roku app, HTPC active app, or "no signal").
- `src/components/Demo/devices/HtpcBox.tsx` — shows active app, display mode, audio mode.
- `src/components/Demo/devices/SpeakerArray.tsx` — speakers around the TV. Channels light up based on current Denon sound mode.
- `src/components/Demo/devices/LightStrip.tsx` — TP-Link bulbs, on/off state, brightness opacity.
- `src/components/Demo/EventLog.tsx` — scrolling list, newest at top. Auto-scroll-to-top on new event, unless user has scrolled up. Each entry: time (HH:MM:SS), target badge with theme color, command name. Cap at 100 entries (simulator already does this).
- `src/components/Demo/DemoPanel.tsx` — composes `HomeTheaterView` over `EventLog`, plus a "Reset" button calling `simulator.reset()`.

**Style notes:**
- Inline SVG components, sized in `viewBox` units (e.g. 0 0 800 600 for the schematic).
- Device boxes themed with existing button colors. The button classes in `globals.css` use `--denon-*`, `--roku-*`, `--pc-*` custom properties (check before assuming) — reuse those custom properties or pull the hex values into a constants file in `src/demo/`.
- Schematic lines as thin colored strokes. Cheap CSS pulse animation triggered on the connection matching the most recent event-log entry's target.
- The component renders at a natural width around 600–800px. Layout integration is Phase 4 — don't worry about it here.

**Hand-off prompt:**
> Build the demo panel UI under `src/components/Demo/` per `DEMO_MODE_PLAN.md` Phase 3. SVG-based schematic of the home theater plus a scrolling event log. State comes from the Phase 1 simulator via a `useSimulator` hook using `useSyncExternalStore`. Visual style: schematic flow lines with styled device boxes, matching the existing per-device theme colors from `globals.css`. The component renders at a natural fixed width around 600–800px — layout integration is Phase 4, don't worry about responsive behavior. Verify by temporarily mounting `<DemoPanel />` in a scratch location to eyeball it.

### Phase 4 — Layout integration

**Edit:** `src/pages/index.tsx`.

Currently the root is `bg-slate-900 viewport-height overflow-y-hidden` with the remote centered inside via `mx-auto`. In demo mode at `lg`+:

- Root becomes a flex row.
- The existing `RemotePanelSlideScroll` keeps its `max-w-[550px]` but loses `mx-auto`. Pin it to the left or center column.
- `<DemoPanel />` fills the remaining space to the right.
- Navbar stays full-width across the top as today.

Below `lg`, render exactly as today (demo panel hidden). No demo-mode UX on mobile.

Use a compile-time constant check:
```tsx
const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
```

so the demo panel doesn't even ship in the non-demo build.

**Risk:** `viewport-height` uses a `--vh` custom var. Verify the side-by-side layout doesn't break the var on resize. Both columns share the same height utility, so this should be fine, but eyeball it.

**Hand-off prompt:**
> In `src/pages/index.tsx`, when `NEXT_PUBLIC_DEMO_MODE === "true"` and viewport is `lg`+, render `<DemoPanel />` from `@/components/Demo/DemoPanel` to the right of `RemotePanelSlideScroll`. Below `lg`, render exactly as today. Use a top-level compile-time constant so the import dead-code-eliminates in non-demo builds. Verify: with the env var set, the remote and demo panel sit side by side on desktop; without it, layout is unchanged.

### Phase 5 — Polish

Optional / nice-to-have once the basics work:

- **Scene presets** — dropdown above the schematic: "Movie night" (TV on, AVR on, Plex launched, surround mode), "Music" (AVR on, music input, stereo mode), "Gaming" (HDMI 2, game mode), "Lights off" (all TP-Link off). Each preset calls a `simulator.applyScene(name)` method that batches state changes and emits one synthetic `[Scene] <name>` log entry.
- **Animated connection lines** — pulse the SVG path matching the recent event-log entry's target. CSS animation triggered via React on event change.
- **Device tooltips** — hover/click each device box to see what real commands hit it (e.g. "Denon — controlled via telnet on port 23 and HTTP commands on port 80").
- **Reset button confirmation** — small "Are you sure?" if event log has > 20 entries.

Each item is independent; pick what's worth doing after Phase 4 is in.

## Risks and gotchas

- `src/api-modules/denon/denon-telnet*.ts` runs server-side only and uses `net.Socket`. Not on the demo path; ignore.
- `denon-query.ts` and `roku-query.ts` route exclusively through `http.ts` exports — confirmed. No edits needed there.
- TP-Link bypasses `http.ts` today; Phase 2 fixes this.
- The smart-home flow uses `LightswitchToggle.tsx` and `SmartHomeModal.tsx`. Verify both are covered by the TP-Link cleanup in Phase 2.
- Bundle size: in non-demo builds the simulator and demo components should DCE because of the compile-time env-var constant. Worth verifying with a quick `npm run build` analyze pass once everything's in, even though `next build` is normally off-limits per CLAUDE.md — talk to Sean before running it.
- `globals.css` may use CSS custom properties for the per-device theme colors. If those are scoped under `.btn-primary-*` and not exposed as root-level vars, the SVG components will need their own color constants. Easy to check.

## File inventory (full)

**New files:**
- `src/demo/types.ts`
- `src/demo/initialState.ts`
- `src/demo/simulator.ts`
- `src/demo/devices/denon.ts`
- `src/demo/devices/roku.ts`
- `src/demo/devices/htpc.ts`
- `src/demo/devices/tplink.ts`
- `src/demo/http-bridge.ts`
- `src/hooks/useSimulator.ts`
- `src/components/Demo/HomeTheaterView.tsx`
- `src/components/Demo/EventLog.tsx`
- `src/components/Demo/DemoPanel.tsx`
- `src/components/Demo/devices/RokuBox.tsx`
- `src/components/Demo/devices/AvrBox.tsx`
- `src/components/Demo/devices/TvBox.tsx`
- `src/components/Demo/devices/HtpcBox.tsx`
- `src/components/Demo/devices/SpeakerArray.tsx`
- `src/components/Demo/devices/LightStrip.tsx`

**Edited files:**
- `src/utilities/http.ts` (demo shim + new TP-Link exports)
- `src/context/tplink.tsx` (route through http.ts)
- `src/components/RemotePanels/SmartHome/LightswitchToggle.tsx` (route through http.ts)
- `src/pages/index.tsx` (layout)

**Untouched (verified):**
- `src/lib/denon-query.ts`, `src/lib/roku-query.ts` — already route through http.ts
- `src/context/denon.tsx`, `src/context/roku.tsx` — React Query handles hydration via existing fetchers
- All `src/pages/api/**` — server-side, never hit in demo

## Order of work

Phase 1 and Phase 3 are independent and can run in parallel.
Phase 2 depends on Phase 1.
Phase 4 depends on Phase 3.
Phase 5 happens after Phase 4 is verified.
