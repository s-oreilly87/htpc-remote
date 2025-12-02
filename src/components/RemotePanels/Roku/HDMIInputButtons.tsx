import {DENON_INPUTS, REMOTE, ROKU_APPS} from "@/utilities/constants";
import KeypressButton from "@/components/UI/KeypressButton";
import {sendDenonCommand, sendRokuLaunchCommand} from "@/utilities/http";

function HDMIInputs({ setPowerOn, setSelectedRemote }) {
  const handleClick = (event) => {
    sendRokuLaunchCommand(event.currentTarget);
    setPowerOn(true);
  };

  const handlePCInputClickWithDenonCommandAndRemoteSwitch = (event, remote) => {
    sendRokuLaunchCommand(event.currentTarget);
    sendDenonCommand({value: DENON_INPUTS.PC.value})
    setPowerOn(true);
    setSelectedRemote(remote);
  };

  return (
    <div id="hdmi-inputs" className="w-full max-h-10 flex gap-2">
      <div className="flex w-full place-content-center gap-2">
        <KeypressButton
          remote={REMOTE.ROKU}
          id="computer"
          className="btn btn-primary-roku w-1/2 z-50"
          value={ROKU_APPS.HDMI.HDMI2.id}
          onClick={handleClick}
        >
          {ROKU_APPS.HDMI.HDMI2.label}
        </KeypressButton>
        <KeypressButton
          remote={REMOTE.ROKU}
          id="receiver"
          className="btn btn-primary-roku w-1/2 z-50"
          value={ROKU_APPS.HDMI.HDMI4.id}
          onClick={(e) => handlePCInputClickWithDenonCommandAndRemoteSwitch(e, REMOTE.PC)}
        >
          {ROKU_APPS.HDMI.HDMI4.label}
        </KeypressButton>
      </div>
    </div>
  );
}

export default HDMIInputs;
