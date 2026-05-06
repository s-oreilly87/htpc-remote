import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faChevronDown } from "@fortawesome/free-solid-svg-icons";

import { sendDenonCommand, sendEventToHTPCEventGhost, setLinuxAudioMode } from "@/utilities/http";
import { AUDIO_MODES, audioModeValue } from "@/constants/pc";
import { usePlatform } from "@/hooks/usePlatform";
import type { AudioMode } from "@/types/remote";
import type { LinuxAudioModeCommand } from "@/constants/htpcControls";

export interface AudioModeSelectProps {
  selectedAudioMode: AudioMode;
  setSelectedAudioMode: (mode: AudioMode) => void;
}

function AudioModeSelect({ selectedAudioMode, setSelectedAudioMode }: AudioModeSelectProps) {
  const { isLinux } = usePlatform();

  const modes = Object.values(AUDIO_MODES).filter(
    (m) => m.disabled || audioModeValue(m, isLinux) !== "",
  );

  const handleSelect = (mode: AudioMode) => {
    setSelectedAudioMode(mode);

    const value = audioModeValue(mode, isLinux);
    if (isLinux) {
      setLinuxAudioMode(value as LinuxAudioModeCommand);
    } else {
      sendEventToHTPCEventGhost({ value });
    }

    if (mode.denonCmd) {
      sendDenonCommand({ value: mode.denonCmd });
    }
  };

  return (
    <div className="flex w-4/5 mx-auto">
      <Listbox value={selectedAudioMode} by="key" onChange={handleSelect}>
        <div className="relative mt-1 w-full">
          <ListboxButton className="relative w-full cursor-default rounded-lg bg-gray-700 py-2 pl-3 pr-10 text-center shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300">
            <span className="block truncate text-white">{selectedAudioMode.label}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <FontAwesomeIcon icon={faChevronDown} className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </ListboxButton>
            <ListboxOptions
              transition
              className="fixed z-40 mt-1 max-h-100 left-[12%] right-[12%] max-w-[440px] overflow-auto rounded-md bg-gray-700 py-1 text-base text-center shadow-lg ring-1 ring-black/5 focus:outline-none
                transition ease-in duration-100 data-[closed]:opacity-0"
            >
              {modes.map((mode) => (
                <ListboxOption
                  key={mode.key}
                  value={mode}
                  disabled={mode.disabled}
                  className={({ active }) =>
                    `relative w-full cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? "bg-blue-600 text-white" : mode.disabled ? "text-gray-400" : "text-blue-300"
                    }`
                  }
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                        {mode.label}
                      </span>
                      {selected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-900">
                          <FontAwesomeIcon icon={faCheck} className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
        </div>
      </Listbox>
    </div>
  );
}

export default AudioModeSelect;
