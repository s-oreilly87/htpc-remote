export interface PlugConfig {
  id: string;
  ip: string;
  childId: string;
  label: string;
}

export interface LightSwitchConfig {
  id: string;
  ip: string;
  label: string;
}

export const PLUGS: Record<string, PlugConfig> = {
  YARD_FENCE: {
    id: "yard-fence",
    ip: "192.168.1.248",
    childId: "80064F5AB2335073A704D002FDBECB8B21CA02D200",
    label: "Yard (fence)",
  },
  YARD_DINING: {
    id: "yard-dining",
    ip: "192.168.1.248",
    childId: "80064F5AB2335073A704D002FDBECB8B21CA02D201",
    label: "Yard (dining)",
  },
};

export const LIGHTSWITCHES: Record<string, LightSwitchConfig> = {
  BEDROOM: { id: "bedroom", ip: "192.168.1.200", label: "Bedroom" },
  STAIRWAY: { id: "stairway", ip: "192.168.1.201", label: "Stairway" },
  BASEMENT: { id: "basement", ip: "192.168.1.202", label: "Basement" },
};
