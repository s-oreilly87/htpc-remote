import KeypressButton from "@/components/UI/KeypressButton";
import PressAndHoldButton from "@/components/UI/PressAndHoldButton";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faVolumeHigh, faVolumeLow, faVolumeXmark,} from "@fortawesome/free-solid-svg-icons";
import { KEYSTROKE, RemoteType } from "@/constants/remotes";
import {dot_matrix} from "@/styles/fonts";
import {useDenonContext} from "@/context/denon";

function VolumeControls({ remote }: { remote: RemoteType }) {
  const { denonState, isLoading } = useDenonContext();
  return (
    <div className="flex flex-col relative h-full w-full">
      {remote === RemoteType.DENON && (
        <div
          className={
            "absolute w-3/4 -top-12 right-0 flex justify-center items-center text-center self-center bg-gray-900 rounded-lg ring-1 ring-white/10 p-1"
          }
        >
          <span
            className={`text-teal-500 text-2xl ${dot_matrix.className} ${
              isLoading ? "opacity-50 animate-pulse" : ""
            }`}
          >
            {denonState.MV}
          </span>
        </div>
      )}
      <div
        id="volume-buttons"
        className="flex flex-col w-3/4 gap-5 h-full place-self-end"
        role="group"
      >
        <div className="flex flex-col gap-0.5 h-3/4">
          <PressAndHoldButton
            remote={remote}
            className={`btn btn-primary-${remote.toLowerCase()} flex rounded-t-full w-full h-1/2`}
            value={KEYSTROKE[remote].VOL_UP}
          >
            <FontAwesomeIcon
              icon={faVolumeHigh}
              className="w-5/6 mx-auto my-auto"
            />
          </PressAndHoldButton>
          <PressAndHoldButton
            remote={remote}
            className={`btn btn-primary-${remote.toLowerCase()} flex rounded-b-full h-1/2`}
            value={KEYSTROKE[remote].VOL_DOWN}
          >
            <FontAwesomeIcon
              icon={faVolumeLow}
              className="w-5/6 mx-auto my-auto"
            />
          </PressAndHoldButton>
        </div>
        <div className="h-1/4 flex place-content-center align-bottom">
          <KeypressButton
            remote={remote}
            className="btn bg-red-600 shadow-inner shadow-red-500 rounded-full aspect-square flex w-5/6 h-2/3 justify-center items-center"
            value={KEYSTROKE[remote].MUTE}
          >
            <FontAwesomeIcon icon={faVolumeXmark} />
          </KeypressButton>
        </div>
      </div>
    </div>
  );
}

export default VolumeControls;
