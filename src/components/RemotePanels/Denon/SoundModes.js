import {useState} from "react";
import SoundModeSelect from "@/components/RemotePanels/Denon/SoundModeSelect.js";
import CycleSoundModes from "@/components/RemotePanels/Denon/CycleSoundModeButtons.js";


function SoundModes() {
    const [cycleTimeout, setCycleTimeout] = useState(null)

    return (
        <div className="flex flex-col gap-3">
            <SoundModeSelect cycleTimeout={cycleTimeout} />
            <CycleSoundModes cycleTimeout={cycleTimeout} setCycleTimeout={setCycleTimeout}/>
        </div>
    );
}

export default SoundModes;