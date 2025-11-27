import { Switch } from "@headlessui/react";
import React from "react";

interface ToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  label: string;
  labelColor?: string;
  labelPos?: "above" | "side" | string;
  color: string;
  disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({
  enabled,
  onToggle,
  label,
  labelColor = "white",
  labelPos,
  color,
  disabled,
}) => {
  return (
    <Switch.Group>
      <div
        className={`flex ${labelPos === "above" ? "flex-col" : ""} gap-3 items-center justify-center`}
      >
        <Switch.Label className={`text-${labelColor}`}>{label}</Switch.Label>
        <Switch
          checked={enabled}
          onChange={onToggle}
          className={`${enabled ? `bg-${color}` : "bg-slate-800"} \
                        relative inline-flex h-6 w-11 items-center rounded-full`}
          disabled={disabled}
        >
          <span className="sr-only">Air Mouse</span>
          <span
            className={`${
              enabled
                ? "translate-x-6 bg-white"
                : `translate-x-1 ${disabled ? "bg-gray-600" : `bg-${color}`}`
            } \
                        inline-block h-4 w-4 transform rounded-full transition`}
          />
        </Switch>
      </div>
    </Switch.Group>
  );
};

export default Toggle;
