import { Dialog, DialogPanel } from "@headlessui/react";
import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { useTplinkContext, TplinkState, TplinkDeviceState } from "@/context/tplink";
import { LIGHTSWITCHES, PLUGS } from "@/constants/smartHome";
import LightswitchToggle from "@/components/RemotePanels/SmartHome/LightswitchToggle";
import LoadingSpinner from "@/components/UI/LoadingSpinner";
import { toggleTplinkSwitch, setTplinkBrightness } from "@/utilities/http";
import { MODAL_INSET } from "@/utilities/modalClasses";

interface SmartHomeModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SmartHomeModal = ({ isOpen, setIsOpen }: SmartHomeModalProps) => {
  const [tplinkState, updateTplinkState, refreshSwitchInfo] =
    useTplinkContext();

  // Throttle brightness API calls: send at most once per 300 ms while slider is moving.
  const brightnessThrottleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      refreshSwitchInfo("all");
    }
  }, [isOpen, refreshSwitchInfo]);

  function closeModal() {
    setIsOpen(false);
  }

  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const [deviceId, onOff] = event.currentTarget.value.split("/");
    const on = onOff === "on";
    const existing = tplinkState[deviceId as keyof TplinkState];
    const current: TplinkDeviceState = existing && typeof existing === "object" ? existing as TplinkDeviceState : { powerState: false };
    updateTplinkState({ [deviceId]: { ...current, powerState: on } });
    toggleTplinkSwitch(deviceId, on);
  };

  const handleChangeBasementBrightness = (event: React.ChangeEvent<HTMLInputElement>) => {
    const brightness = Number(event.currentTarget.value);
    if (!(brightness >= 1 && brightness <= 100)) return;
    updateTplinkState({ basement: { powerState: tplinkState.basement.powerState, brightness } });
    if (brightnessThrottleTimer.current) clearTimeout(brightnessThrottleTimer.current);
    brightnessThrottleTimer.current = setTimeout(() => setTplinkBrightness("basement", brightness), 300);
  };

  return (
    <>
      <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
        <div className={`${MODAL_INSET} z-50 bg-black/50`} />

        <div className={`${MODAL_INSET} z-50 overflow-y-auto`}>
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <DialogPanel
              transition
              className="w-full max-w-md relative transform overflow-visible rounded-2xl bg-slate-800 p-6 text-left align-middle shadow-xl -top-3
                transition duration-300 ease-out data-closed:opacity-0 data-closed:scale-95
                data-enter:duration-300 data-leave:duration-200 data-leave:ease-in"
            >
                  <div className="mt-1 flex justify-end">
                    <button
                      type="button"
                      className="absolute -right-3 -top-4 z-50 shadow-2xl inline-flex justify-center rounded-md border border-transparent bg-red-700 px-5 py-3 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={closeModal}
                    >
                      <FontAwesomeIcon icon={faXmark} color={"white"} />
                    </button>
                  </div>
                  {!tplinkState.loading && (
                    <div className="flex flex-col gap-4 items-center">
                      <span className="text-2xl text-center text-amber-400">Smart Light Control</span>

                      {/* Outdoor plugs: Yard (fence) + Yard (dining) */}
                      <div className="flex w-full gap-4 items-start justify-center">
                        {Object.values(PLUGS).map((plug) => (
                          <LightswitchToggle
                            key={plug.id}
                            lightSwitch={plug}
                            handleToggle={handleToggle}
                          />
                        ))}
                      </div>

                      {/* Indoor switches: Bedroom + Stairway */}
                      <div className="flex w-full gap-4 items-start justify-center">
                        {[LIGHTSWITCHES.BEDROOM, LIGHTSWITCHES.STAIRWAY].map((ls) => (
                          <LightswitchToggle
                            key={ls.id}
                            lightSwitch={ls}
                            handleToggle={handleToggle}
                          />
                        ))}
                      </div>

                      {/* Basement dimmer */}
                      <div className="flex flex-col items-center w-full">
                        <LightswitchToggle
                          lightSwitch={LIGHTSWITCHES.BASEMENT}
                          handleToggle={handleToggle}
                        />
                        <div className="flex gap-2 items-center justify-center text-amber-400 w-3/4 -mt-3">
                          <span className="text-sm">1</span>
                          <input
                            type="range"
                            min={1}
                            max={100}
                            value={tplinkState.basement.brightness ?? 50}
                            className="w-full h-2 bg-gray-700 accent-amber-400 rounded-lg appearance-none cursor-pointer"
                            onChange={handleChangeBasementBrightness}
                          />
                          <span className="text-sm">100</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {tplinkState.loading && (
                      <div className="flex flex-col justify-center items-center text-amber-400 h-106.25 gap-3">
                      Connecting to lights . . .
                      <LoadingSpinner color="amber-400" size={32} />
                    </div>
                  )}
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default SmartHomeModal;
