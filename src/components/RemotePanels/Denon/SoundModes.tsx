import { useState } from "react";
import SoundModeSelect from "@/components/RemotePanels/Denon/SoundModeSelect";
import CycleSoundModes from "@/components/RemotePanels/Denon/CycleSoundModeButtons";

function SoundModes() {
  const [cycleTimeout, setCycleTimeout] = useState(null);

  return (
    <div className="flex flex-col gap-2">
      <SoundModeSelect cycleTimeout={cycleTimeout} />
      <CycleSoundModes
        cycleTimeout={cycleTimeout}
        setCycleTimeout={setCycleTimeout}
      />
    </div>
  );
}

export default SoundModes;
