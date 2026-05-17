/**
 * Roku TV sub-simulator.
 *
 * Returns shapes matching the real http.ts functions:
 * fetchRokuChannels    → FetchResult<{id: string; label: string}[]>
 * fetchRokuDeviceInfo  → FetchResult<Record<string, string>>
 * handleKeypress / handleKeydown / handleKeyup / handleLaunch / handleSearch
 *   → void (fire-and-forget in real code)
 */

import { ROKU_APPS } from "@/constants/roku";
import type { FetchResult, ValueButton } from "@/utilities/http";
import type { RokuSimState } from "@/demo/types";

// Static fake app list built from the real ROKU_APPS constant so channel IDs match.
// Numeric IDs (real Roku channels) load icons from the Roku device; non-numeric
// IDs render as plain text labels — used here for demo-only placeholder entries.
const FAKE_APPS: { id: string; label: string }[] = [
  ...Object.values(ROKU_APPS.CHANNELS),
  ...Object.values(ROKU_APPS.HDMI),
  { id: "demo-all",     label: "All" },
  { id: "demo-other",     label: "Other" },
  { id: "demo-installed", label: "Installed" },
  { id: "demo-channels",  label: "Channels" },
  { id: "demo-queried",  label: "Queried" },
  { id: "demo-from",  label: "From" },
  { id: "demo-roku",  label: "Roku" },
  { id: "demo-api",  label: "API" },

];

// Flat lookup for launch commands: id → label
const APP_BY_ID: Record<string, string> = Object.fromEntries(
  FAKE_APPS.map(({ id, label }) => [id, label]),
);

export class RokuSimulator {
  private state: RokuSimState;
  private readonly onMutate: (command: string, detail?: string) => void;

  constructor(initial: RokuSimState, onMutate: (command: string, detail?: string) => void) {
    this.state = { ...initial };
    this.onMutate = onMutate;
  }

  getState(): RokuSimState {
    return this.state;
  }

  reset(initial: RokuSimState): void {
    this.state = { ...initial };
  }

  // ── Shapes returned by http.ts fetchers ───────────────────────────────────

  fetchChannels(): FetchResult<{ id: string; label: string }[]> {
    return { data: FAKE_APPS };
  }

  fetchDeviceInfo(): FetchResult<Record<string, string>> {
    return {
      data: {
        udn: "uuid:demo-roku-0000-0000-0000-000000000001",
        serialNumber: "X00000DEMO01",
        deviceId: "AA:BB:CC:DD:EE:FF",
        advertisingId: "00000000-0000-0000-0000-000000000000",
        headersVersion: "7.0.0.0",
        firmwareVersion: "11.0.0 build 4200-demo",
        friendlyDeviceName: "Demo Roku TV",
        friendlyModelName: "Roku TV (Demo)",
        modelName: "Demo-TC2000",
        modelNumber: "DEMO-TC2000X",
        modelRegion: "US",
        isTv: "true",
        isStick: "false",
        mobileHasLiveTv: "false",
        uiResolution: "FHD",
        supportsEthernet: "true",
        wifiMac: "AA:BB:CC:DD:EE:FF",
        wifiDriver: "realtek",
        ethernetMac: "AA:BB:CC:DD:EE:FE",
        networkType: "ethernet",
        networkName: "Demo Network",
        softwareBuild: "4200",
        softwareVersion: "11.0.0",
        country: "US",
        locale: "en_US",
        timeZoneAuto: "true",
        timeZone: "US/Eastern",
        timeZoneName: "United States/Eastern",
        timeZoneTz: "America/New_York",
        timeZoneOffset: "-300",
        clockFormat: "12-hour",
        uptime: "86400",
        powerMode: this.state.powerOn ? "PowerOn" : "DisplayOff",
        supportsEcsTextEdit: "true",
        supportsSuspend: "false",
        supportsEcsMicrophone: "false",
        developerEnabled: "false",
        keyedDeveloperId: "",
        searchEnabled: "true",
        searchChannelsEnabled: "true",
        notificationsEnabled: "true",
        notificationsFirstUse: "true",
        supportsPrivateListening: "false",
        headphonesConnected: "false",
        supportsEcsTextEditFw: "true",
        grandcentralVersion: "2.1.218",
        trcVersion: "3.0",
        trcChannelVersion: "4.1.218",
        davinciVersion: "2.7.0.1",
        avSyncCalibrationEnabled: "true",
      },
    };
  }

  // ── Command handlers (fire-and-forget in real code) ───────────────────────

  handleKeypress(button: ValueButton): void {
    const key = button.value;
    if (key === "Power") {
      this.state = { ...this.state, powerOn: !this.state.powerOn };
    }

    const volumeDetail =
      key === "VolumeUp" || key === "VolumeDown" || key === "VolumeMute"
        ? "Denon AVR updated via HDMI CEC — app syncs state on next poll"
        : undefined;

    this.onMutate(`keypress:${key}`, volumeDetail);
  }

  handleKeydown(button: ValueButton): void {
    this.onMutate(`keydown:${button.value}`);
  }

  handleKeyup(button: ValueButton): void {
    this.onMutate(`keyup:${button.value}`);
  }

  handleLaunch(button: ValueButton): void {
    const appId = button.value;
    const label = APP_BY_ID[appId] ?? appId;
    this.state = {
      ...this.state,
      powerOn: true,
      currentApp: { id: appId, label },
    };
    this.onMutate(`launch:${appId}`, label);
  }

  handleSearch(query: string): void {
    this.onMutate("search", query);
  }
}
