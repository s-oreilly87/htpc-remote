/**
 * Thin wrapper around the vendored libnut-macos.node binary.
 *
 * Why this exists:
 *   robotjs injects keyboard events via CGEventPost(kCGSessionEventTap, …), which is
 *   filtered by macOS Secure Input Mode (SIM). Any window that enables SIM — most
 *   notably Spotlight — silently drops those events.
 *
 *   libnut posts via CGEventPost(kCGHIDEventTap, …), which inserts events at the HID
 *   level *before* the Secure Input Mode filter runs, so they reach Spotlight (and any
 *   other SIM-protected field) correctly.
 *
 *   The pre-compiled universal binary (x86_64 + arm64) is vendored at
 *   native/libnut-macos.node.  It was built with NAPI so it is ABI-stable across
 *   Node.js versions.  Only typeString is used here — everything else (special keys,
 *   media keys) continues to go through robotjs which works fine for those.
 */

import path from "path";

interface LibnutNative {
  typeString(text: string): void;
  typeStringDelayed(text: string, delayMs: number): void;
}

// Loaded lazily so the module doesn't explode on non-macOS platforms.
let _libnut: LibnutNative | null = null;

function getLibnut(): LibnutNative {
  if (_libnut) return _libnut;
  // process.cwd() is the project root in both `next dev` and `next start`.
  const binaryPath = path.join(process.cwd(), "native", "libnut-macos.node");
  // Use process.dlopen() instead of require() so Turbopack doesn't try to statically
  // resolve the path at build time (it can't — the path contains process.cwd()).
  // dlopen() loads the binary directly via the OS dynamic linker, bypassing the
  // module bundler's resolver entirely.
  const mod = { exports: {} } as NodeModule;
  process.dlopen(mod, binaryPath);
  _libnut = mod.exports as LibnutNative;
  return _libnut;
}

/** Type a string using kCGHIDEventTap — works in Spotlight and other SIM-protected fields. */
export function libnutTypeString(text: string): void {
  getLibnut().typeString(text);
}
