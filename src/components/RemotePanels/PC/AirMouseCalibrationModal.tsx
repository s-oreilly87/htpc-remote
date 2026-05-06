import { Dialog, DialogPanel, DialogTitle, Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestion, faXmark } from "@fortawesome/free-solid-svg-icons";

interface AirMouseCalibrationModalProps {
  showCalibration: boolean;
  setShowCalibration: (show: boolean) => void;
  handleSetTopLeft: () => void;
  handleSetBottomRight: () => void;
}

export default function AirMouseCalibrationModal({
  showCalibration,
  setShowCalibration,
  handleSetTopLeft,
  handleSetBottomRight,
}: AirMouseCalibrationModalProps) {
  const [isTopLeftSet, setIsTopLeftSet] = useState(false);

  function closeModal() {
    setIsTopLeftSet(false);
    setShowCalibration(false);
  }

  const handleClick = () => {
    if (!isTopLeftSet) {
      handleSetTopLeft();
      setIsTopLeftSet(true);
    } else {
      handleSetBottomRight();
      closeModal();
    }
  };

  return (
    <>
      <Dialog open={showCalibration} onClose={closeModal} className="relative z-50">
        <div className="fixed inset-0 z-50 bg-black/75" />

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <DialogPanel
              transition
              className="w-full max-w-md transform rounded-2xl bg-slate-800 p-6 text-left align-middle shadow-xl
                transition duration-300 ease-out data-[closed]:opacity-0 data-[closed]:scale-95
                data-[enter]:duration-300 data-[leave]:duration-200 data-[leave]:ease-in"
            >
                  <div className="mt-1 flex justify-start w-full">
                    <Popover className="relative w-full">
                      <PopoverButton className="absolute -left-3 -top-4 z-50 shadow-2xl inline-flex justify-center rounded-full border border-transparent bg-blue-500 px-4 py-3 text-sm font-medium text-blue-900 focus:outline-none">
                        <FontAwesomeIcon icon={faQuestion} color={"white"} />
                      </PopoverButton>
                      <PopoverPanel className="absolute z-30 bg-slate-900 text-blue-200 rounded-2xl px-5 py-5">
                        This will calibrate your phone to the mouse pointer on
                        your screen from your seated position.
                        <br />
                        - Point your phone at the physical corners of your
                        screen.
                        <br />- If you change positions or things seem off, run
                        this again.
                      </PopoverPanel>
                    </Popover>
                  </div>

                  <div className="mt-1 flex justify-end">
                    <button
                      type="button"
                      className="absolute -right-3 -top-4 z-50 shadow-2xl inline-flex justify-center rounded-md border border-transparent bg-red-700 px-5 py-3 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-offset-2"
                      onClick={closeModal}
                    >
                      <FontAwesomeIcon icon={faXmark} color={"white"} />
                    </button>
                  </div>
                  <DialogTitle
                    as="h3"
                    className="text-xl text-center font-medium text-blue-400"
                  >
                    Airmouse Calibration
                  </DialogTitle>
                  <div className="mt-2">
                    <p className="text-md text-blue-200">
                      {isTopLeftSet
                        ? "Point at the BOTTOM-RIGHT corner of your screen and press button"
                        : "Point at the TOP-LEFT corner of your screen and press button"}
                    </p>
                  </div>

                  <div
                    className={`mt-4 h-24 flex ${
                      isTopLeftSet
                        ? "justify-end items-end"
                        : "items-start justify-start"
                    }`}
                  >
                    <button
                      type="button"
                      className="inline-flex w-1/2 h-1/2 justify-center btn-primary-pc rounded-md border border-transparent px-4 py-2 text-lg font-medium focus:outline-none "
                      onClick={handleClick}
                    >
                      {isTopLeftSet ? "Bottom Right" : "Top Left"}
                    </button>
                  </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
}
