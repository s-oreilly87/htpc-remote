import { useMemo } from "react";

export interface PlatformInfo {
  platform: string;
  isLinux: boolean;
  isLinuxX11: boolean;
  isLinuxWayland: boolean;
  isMac: boolean;
  isPc: boolean;
}

const getNormalizedPlatform = (): string =>
  (process.env.NEXT_PUBLIC_PLATFORM ?? "").toUpperCase();

export const getPlatformInfo = (): PlatformInfo => {
  const platform = getNormalizedPlatform();
  const isLinuxWayland = platform === "LINUX_WAYLAND";
  const isLinuxX11 = platform === "LINUX";
  const isLinux = isLinuxWayland || isLinuxX11;

  return {
    platform,
    isLinux,
    isLinuxX11,
    isLinuxWayland,
    isMac: platform === "MACOS",
    isPc: platform === "PC",
  };
};

export const usePlatform = (): PlatformInfo =>
  useMemo(() => getPlatformInfo(), []);
