import { RemoteType } from "@/constants/remotes";
import { DENON_INPUTS } from "@/constants/denon";
import { ROKU_APPS } from "@/constants/roku";
import KeypressButton from "@/components/UI/KeypressButton";
import { sendDenonCommand, sendRokuLaunchCommand } from "@/utilities/http";
import { useRokuContext } from "@/context/roku";

interface HDMIInputsProps {
  setSelectedRemote: (remote: RemoteType) => void;
}

function HDMIInputs({ setSelectedRemote }: HDMIInputsProps) {
  const { updateRokuState } = useRokuContext();

  const handleClick = (event) => {
    sendRokuLaunchCommand(event.currentTarget);
    updateRokuState({ powerOn: true });
  };

  const handlePCInputClickWithDenonCommandAndRemoteSwitch = (event, remote: RemoteType) => {
    sendRokuLaunchCommand(event.currentTarget);
    sendDenonCommand({ value: DENON_INPUTS.PC.value });
    updateRokuState({ powerOn: true });
    setSelectedRemote(remote);
  };

  return (
    <div id="hdmi-inputs" className="w-full max-h-10 flex gap-2">
      <div className="flex w-full place-content-center gap-2">
        <KeypressButton
          remote={RemoteType.ROKU}
          id="computer"
          className="btn btn-primary-roku w-1/2 z-50"
          value={ROKU_APPS.HDMI.HDMI2.id}
          onClick={handleClick}
        >
          {ROKU_APPS.HDMI.HDMI2.label}
        </KeypressButton>
        <KeypressButton
          remote={RemoteType.ROKU}
          id="receiver"
          className="btn btn-primary-roku w-1/2 z-50"
          value={ROKU_APPS.HDMI.HDMI4.id}
          onClick={(e) => handlePCInputClickWithDenonCommandAndRemoteSwitch(e, RemoteType.PC)}
        >
          {ROKU_APPS.HDMI.HDMI4.label}
        </KeypressButton>
      </div>
    </div>
  );
}

export default HDMIInputs;
