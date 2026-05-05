import type { RokuState } from "@/types/remote";
import { fetchRokuDeviceInfo } from "@/utilities/http";

export const ROKU_QUERY_KEY = ["roku-state"] as const;

export async function fetchRokuState(): Promise<RokuState> {
  const response = await fetchRokuDeviceInfo();
  if (response.error) {
    throw new Error("Roku: failed to fetch device info — keeping previous state");
  }
  return {
    powerOn: response.data["powerMode"] === "PowerOn",
  };
}
