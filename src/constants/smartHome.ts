import type {
  LightSwitchConfig,
  PlugConfig,
  SmartHomeDeviceConfig,
  SmartHomeDeviceKind,
} from "@/types/remote";

const VALID_DEVICE_KINDS = new Set<SmartHomeDeviceKind>(["plug", "switch", "dimmer"]);
const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const DEMO_TPLINK_DEVICES: SmartHomeDeviceConfig[] = [
  {
    id: "yard-fence",
    ip: "demo",
    childId: "demo-yard-fence",
    label: "Yard (fence)",
    kind: "plug",
  },
  {
    id: "yard-dining",
    ip: "demo",
    childId: "demo-yard-dining",
    label: "Yard (dining)",
    kind: "plug",
  },
  { id: "bedroom", ip: "demo", label: "Bedroom", kind: "switch" },
  { id: "stairway", ip: "demo", label: "Stairway", kind: "switch" },
  { id: "basement", ip: "demo", label: "Basement", kind: "dimmer" },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDeviceKind(value: unknown): value is SmartHomeDeviceKind {
  return typeof value === "string" && VALID_DEVICE_KINDS.has(value as SmartHomeDeviceKind);
}

function isSmartHomeDeviceConfig(value: unknown): value is SmartHomeDeviceConfig {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.ip === "string" &&
    value.ip.length > 0 &&
    typeof value.label === "string" &&
    value.label.length > 0 &&
    isDeviceKind(value.kind) &&
    (value.childId === undefined || typeof value.childId === "string")
  );
}

function parseTplinkDevices(): SmartHomeDeviceConfig[] {
  const rawConfig = process.env.NEXT_PUBLIC_TPLINK_DEVICES;
  if (!rawConfig) return IS_DEMO ? DEMO_TPLINK_DEVICES : [];

  try {
    const parsed = JSON.parse(rawConfig) as unknown;
    if (!Array.isArray(parsed)) {
      console.warn("NEXT_PUBLIC_TPLINK_DEVICES must be a JSON array");
      return [];
    }

    return parsed.filter(isSmartHomeDeviceConfig);
  } catch (error) {
    console.warn("Could not parse NEXT_PUBLIC_TPLINK_DEVICES", error);
    return [];
  }
}

export const TPLINK_DEVICES = parseTplinkDevices();

export const TPLINK_DEVICE_MAP = TPLINK_DEVICES.reduce<Record<string, SmartHomeDeviceConfig>>(
  (map, device) => {
    map[device.id] = device;
    return map;
  },
  {},
);

export const HAS_TPLINK_DEVICES = TPLINK_DEVICES.length > 0;
export const BASEMENT_LIGHT = TPLINK_DEVICE_MAP.basement;

export const PLUGS = TPLINK_DEVICES.filter(
  (device): device is PlugConfig => device.kind === "plug",
);

export const LIGHTSWITCHES = TPLINK_DEVICES.filter(
  (device): device is LightSwitchConfig =>
    device.kind === "switch" || device.kind === "dimmer",
);
