import { useMemo } from "react";

const LOCAL_ADDRESSES = new Set(["", "localhost", "127.0.0.1"]);

export type HtpcPlatform = "WINDOWS" | "LINUX_WAYLAND" | "LINUX_X11" | "MACOS" | "";

export interface PlatformInfo {
  platform: HtpcPlatform;
  isLinux: boolean;
  isLinuxX11: boolean;
  isLinuxWayland: boolean;
  isMac: boolean;
  isWindows: boolean;
  /** @deprecated Use isWindows. PC remains as a legacy env alias only. */
  isPc: boolean;
  /**
   * True when the Next.js server is running on a different machine from the HTPC.
   * Determined by comparing NEXT_PUBLIC_HOST_IP and NEXT_PUBLIC_HTPC_IP.
   */
  isRemoteHtpc: boolean;
  /**
   * True when the HTPC has full script-based control available:
   * display/audio mode switching, app launching, and scene presets.
   *
   * WINDOWS and LINUX_WAYLAND have full support. LINUX_X11 and MACOS only support
   * keystroke/mouse control — script-dependent features are hidden when false.
   */
  hasFullHtpcControl: boolean;
}

const getNormalizedPlatform = (): HtpcPlatform => {
  const platform = (process.env.NEXT_PUBLIC_HTPC_PLATFORM ?? "").toUpperCase();
  if (platform === "PC") return "WINDOWS";
  if (
    platform === "WINDOWS" ||
    platform === "LINUX_WAYLAND" ||
    platform === "LINUX_X11" ||
    platform === "MACOS"
  ) {
    return platform;
  }

  return "";
};

export const getPlatformInfo = (): PlatformInfo => {
  const platform = getNormalizedPlatform();
  const isLinuxWayland = platform === "LINUX_WAYLAND";
  const isLinuxX11 = platform === "LINUX_X11";
  const isLinux = isLinuxWayland || isLinuxX11;
  const isWindows = platform === "WINDOWS";
  const isMac = platform === "MACOS";

  const hostIp = process.env.NEXT_PUBLIC_HOST_IP ?? "";
  const htpcIp = process.env.NEXT_PUBLIC_HTPC_IP ?? "";
  const isRemoteHtpc = !LOCAL_ADDRESSES.has(htpcIp) && htpcIp !== hostIp;

  return {
    platform,
    isLinux,
    isLinuxX11,
    isLinuxWayland,
    isMac,
    isWindows,
    isPc: isWindows,
    isRemoteHtpc,
    hasFullHtpcControl: isLinuxWayland || isWindows,
  };
};

export const usePlatform = (): PlatformInfo =>
  useMemo(() => getPlatformInfo(), []);
