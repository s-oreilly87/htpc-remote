import { useMemo } from "react";

const LOCAL_ADDRESSES = new Set(["", "localhost", "127.0.0.1"]);

export interface PlatformInfo {
  platform: string;
  isLinux: boolean;
  isLinuxX11: boolean;
  isLinuxWayland: boolean;
  isMac: boolean;
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
   * LINUX_WAYLAND and PC have full support. LINUX_X11 and MACOS only support
   * keystroke/mouse control — script-dependent features are hidden when false.
   */
  hasFullHtpcControl: boolean;
}

const getNormalizedPlatform = (): string =>
  (process.env.NEXT_PUBLIC_HTPC_PLATFORM ?? "").toUpperCase();

export const getPlatformInfo = (): PlatformInfo => {
  const platform = getNormalizedPlatform();
  const isLinuxWayland = platform === "LINUX_WAYLAND";
  const isLinuxX11 = platform === "LINUX_X11";
  const isLinux = isLinuxWayland || isLinuxX11;
  const isPc = platform === "PC";
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
    isPc,
    isRemoteHtpc,
    hasFullHtpcControl: isLinuxWayland || isPc,
  };
};

export const usePlatform = (): PlatformInfo =>
  useMemo(() => getPlatformInfo(), []);
