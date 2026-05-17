import { Dialog, DialogPanel } from "@headlessui/react";
import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { useTplinkContext, TplinkDeviceState } from "@/context/tplink";
import { TPLINK_DEVICES } from "@/constants/smartHome";
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
    const current: TplinkDeviceState = tplinkState.devices[deviceId] ?? { powerState: false };
    updateTplinkState({ [deviceId]: { ...current, powerState: on } });
    toggleTplinkSwitch(deviceId, on);
  };

  const handleChangeBrightness = (event: React.ChangeEvent<HTMLInputElement>) => {
    const deviceId = event.currentTarget.dataset.deviceId;
    if (!deviceId) return;

    const brightness = Number(event.currentTarget.value);
    if (!(brightness >= 1 && brightness <= 100)) return;
    const current = tplinkState.devices[deviceId] ?? { powerState: false };
    updateTplinkState({ [deviceId]: { ...current, brightness } });
    if (brightnessThrottleTimer.current) clearTimeout(brightnessThrottleTimer.current);
    brightnessThrottleTimer.current = setTimeout(() => setTplinkBrightness(deviceId, brightness), 300);
  };

  const dimmers = TPLINK_DEVICES.filter((device) => device.kind === "dimmer");
  const nonDimmers = TPLINK_DEVICES.filter((device) => device.kind !== "dimmer");

  return (
    <>
      <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
        <div className={`${MODAL_INSET} z-50 bg-black/50`} />

        <div className={`${MODAL_INSET} z-50 overflow-y-auto`}>
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <DialogPanel
              transition
              className="w-full max-w-md relative transform overflow-visible rounded-2xl border border-slate-700/70 bg-slate-800 p-6 text-left align-middle shadow-xl -top-3
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
                    <div className="flex flex-col items-center gap-6">
                      <span className="text-center text-xl font-semibold tracking-wide text-amber-300">
                        Smart Lights
                      </span>

                      <div className="grid w-full grid-cols-2 gap-x-5 gap-y-5">
                        {nonDimmers.map((device) => (
                          <LightswitchToggle
                            key={device.id}
                            lightSwitch={device}
                            handleToggle={handleToggle}
                          />
                        ))}
                      </div>

                      {dimmers.map((device) => (
                        <div key={device.id} className="flex w-full flex-col items-center">
                          <LightswitchToggle
                            lightSwitch={device}
                            handleToggle={handleToggle}
                          />
                          <div className="mt-4 flex w-4/5 items-center justify-center gap-3 text-amber-300">
                            <span className="w-5 text-right text-xs font-medium">1</span>
                            <input
                              type="range"
                              min={1}
                              max={100}
                              data-device-id={device.id}
                              value={tplinkState.devices[device.id]?.brightness ?? 50}
                              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-600 accent-amber-400"
                              onChange={handleChangeBrightness}
                            />
                            <span className="w-8 text-xs font-medium">100</span>
                          </div>
                        </div>
                      ))}
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
