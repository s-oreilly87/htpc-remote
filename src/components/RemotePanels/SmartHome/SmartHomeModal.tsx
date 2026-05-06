import { Dialog, DialogPanel } from "@headlessui/react";
import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { useTplinkContext } from "@/context/tplink";
import { PLUGS } from "@/constants/smartHome";
import LightswitchToggle from "@/components/RemotePanels/SmartHome/LightswitchToggle";
import LoadingSpinner from "@/components/UI/LoadingSpinner";

// const brightnessButtons = [
//   { value: 1, label: " 1%", color: "amber-800", textColor: "amber-400" },
//   { value: 25, label: "25%", color: "amber-600", textColor: "amber-300" },
//   { value: 40, label: "40%", color: "amber-500", textColor: "amber-200" },
//   { value: 60, label: "60%", color: "amber-400", textColor: "amber-900" },
//   { value: 75, label: "75%", color: "amber-300", textColor: "amber-800" },
//   { value: 100, label: "MAX", color: "amber-200", textColor: "amber-700" },
// ];

interface SmartHomeModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SmartHomeModal = ({ isOpen, setIsOpen }: SmartHomeModalProps) => {
  const [tplinkState, updateTplinkState, refreshSwitchInfo] =
    useTplinkContext();

  useEffect(() => {
    if (isOpen) {
      refreshSwitchInfo("yard-dining"); // not "all" right now
    }
  }, [isOpen, refreshSwitchInfo]);

  function closeModal() {
    setIsOpen(false);
  }

  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    updateTplinkState({
      [event.currentTarget.value.split("/")[0]]: {
        powerState: event.currentTarget.value.split("/")[1] === "on",
      },
    });
    fetch("api/tp-link/toggle/" + event.currentTarget.value).then((response) =>
      console.log(response),
    );
  };

  // const handleChangeBasementBrightness = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const brightness = Number(event.currentTarget.value);
  //   if (!(brightness >= 0 && brightness <= 100)) {
  //     return console.error("Invalid Brightness value");
  //   }
  //
  //   // if (tplinkState.basement.powerState === false) {
  //   //   sendSetPowerState('')
  //   // }
  //   // Just need to update the state immediately, request will get sent by useThrottleFn
  //   updateTplinkState({
  //     basement: {
  //       powerState: tplinkState.basement.powerState,
  //       brightness: brightness,
  //     },
  //   });
  // };

  // const sendSetBrightness = (brightness) => {
  //   fetch(`api/tp-link/brightness/basement/${brightness}`);
  // };
  // useThrottleFn(sendSetBrightness, 500, [tplinkState.basement.brightness]);

  return (
    <>
      <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
        <div className="fixed inset-0 z-50 bg-black/50" />

        <div className="fixed inset-0 z-50 overflow-y-auto">
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
                      <div className="flex flex-col gap-3 grow pb-[10%] items-center">
                        <span className="mb-2 text-2xl text-center text-amber-400">Smart Light Control</span>
                        <div className="flex w-full space-x-6 items-center justify-center">
                          {Object.values(PLUGS).map((plug) => (
                              <LightswitchToggle
                                  key={plug.id}
                                  lightSwitch={plug}
                                  handleToggle={handleToggle}
                              />
                          ))}
                        </div>

                        {/*<div className="flex w-full space-x-6 items-center justify-center">*/}
                        {/*  {Object.values(LIGHTSWITCHES).map((lightSwitch) => {*/}
                        {/*        if (lightSwitch.id !== 'basement') {*/}
                        {/*          return (*/}
                        {/*              <LightswitchToggle*/}
                        {/*                  key={lightSwitch.id}*/}
                        {/*                  lightSwitch={lightSwitch}*/}
                        {/*                  handleToggle={handleToggle}*/}
                        {/*              />*/}
                        {/*          );*/}
                        {/*        }*/}
                        {/*      }*/}
                        {/*  )}*/}
                        {/*</div>*/}
                        {/*<div id="basement-controls" className="flex flex-col items-center">*/}
                        {/*  <LightswitchToggle*/}
                        {/*      lightSwitch={LIGHTSWITCHES.BASEMENT}*/}
                        {/*      handleToggle={handleToggle}*/}
                        {/*  />*/}
                        {/*  <div className="flex gap-2 items-center justify-center text-amber-400 mb-2">*/}
                        {/*    1*/}
                        {/*    <input*/}
                        {/*        type="range"*/}
                        {/*        min={1}*/}
                        {/*        max={100}*/}
                        {/*        value={tplinkState.basement.brightness}*/}
                        {/*        className="w-full h-2 bg-gray-200 accent-amber-400 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"*/}
                        {/*        onChange={handleChangeBasementBrightness}*/}
                        {/*    />*/}
                        {/*    100*/}
                        {/*  </div>*/}
                        {/*  /!*<div className="flex justify-center gap-0.5">*!/*/}
                        {/*  /!*  {brightnessButtons.map((button) => (*!/*/}
                        {/*  /!*    <button*!/*/}
                        {/*  /!*      key={button.label}*!/*/}
                        {/*  /!*      className={`btn bg-${button.color} text-${button.textColor} rounded-full w-1/8"`}*!/*/}
                        {/*  /!*      value={button.value}*!/*/}
                        {/*  /!*      onClick={handleChangeBasementBrightness}*!/*/}
                        {/*  /!*    >*!/*/}
                        {/*  /!*      <span className="min-w-12">{button.label}</span>*!/*/}
                        {/*  /!*    </button>*!/*/}
                        {/*  /!*  ))}*!/*/}
                        {/*  /!*</div>*!/*/}
                        {/*</div>*/}
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
