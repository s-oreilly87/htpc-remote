import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

import AudioModeSelect from "./AudioModeSelect";
import DisplayModeSelect from "./DisplayModeSelect";
import type { AudioMode, DisplayMode } from "@/types/remote";

interface CustomModesCollapseProps {
  selectedAudioMode: AudioMode;
  setSelectedAudioMode: (mode: AudioMode) => void;
  selectedDisplayMode: DisplayMode;
  setSelectedDisplayMode: (mode: DisplayMode) => void;
}

function CustomModesCollapse({
  selectedAudioMode,
  setSelectedAudioMode,
  selectedDisplayMode,
  setSelectedDisplayMode,
}: CustomModesCollapseProps) {
  return (
    <div>
      <Popover className="relative">
        {({ open }) => (
          <>
            <PopoverButton
              className="btn btn-secondary w-full flex relative justify-center items-center"
              type="button"
            >
              Custom Audio/Video Modes
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`absolute right-6 ${open ? "rotate-180 transform" : ""}`}
              />
            </PopoverButton>

              <PopoverPanel
                transition
                className="absolute left-1/2 z-50 mt-3 w-screen max-w-[525px] -translate-x-1/2 transform px-3 remote:px-0
                  transition ease-out duration-200 data-[closed]:opacity-0 data-[closed]:-translate-y-2
                  data-[enter]:duration-200 data-[leave]:duration-150 data-[leave]:ease-in"
              >
                <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black/5 bg-gray-500 py-4 space-y-3">
                  <AudioModeSelect
                    selectedAudioMode={selectedAudioMode}
                    setSelectedAudioMode={setSelectedAudioMode}
                  />
                  <DisplayModeSelect
                    selectedDisplayMode={selectedDisplayMode}
                    setSelectedDisplayMode={setSelectedDisplayMode}
                  />
                </div>
              </PopoverPanel>
          </>
        )}
      </Popover>
    </div>
  );
}

export default CustomModesCollapse;
