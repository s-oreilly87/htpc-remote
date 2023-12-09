import { sendDenonCommand, sendEventToEventGhost } from "@/utilities/http";
import { Listbox, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { AUDIO_MODES_FOR_SELECT } from "@/utilities/constants.js";

function AudioModeSelect({ selectedAudioMode, setSelectedAudioMode }) {
  const handleSelect = (selectedAudioMode) => {
    setSelectedAudioMode(selectedAudioMode);
    sendEventToEventGhost({ value: selectedAudioMode.value });
    sendDenonCommand({ value: selectedAudioMode.denonCmd });
  };

  return (
    <div className="flex w-4/5 mx-auto">
      <Listbox value={selectedAudioMode} by="key" onChange={handleSelect}>
        <div className="relative mt-1 w-full">
          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-gray-700 py-2 pl-3 pr-10 text-center shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300">
            <span className="block truncate text-white">
              {selectedAudioMode.label}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <FontAwesomeIcon
                icon={faChevronDown}
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="fixed z-40 mt-1 max-h-100 left-[12%] right-[12%] max-w-[440px] overflow-auto rounded-md bg-gray-700 py-1 text-base text-center shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              {Object.values(AUDIO_MODES_FOR_SELECT).map((mode) => (
                <Listbox.Option
                  key={mode.key}
                  value={mode}
                  disabled={mode.disabled}
                  className={({
                    active,
                  }) => `relative w-full cursor-default select-none py-2 pl-10 pr-4 
                                    ${
                                      active
                                        ? "bg-blue-600 text-white"
                                        : mode.disabled
                                          ? "text-gray-400"
                                          : "text-blue-300"
                                    }`}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? "font-medium" : "font-normal"
                        }`}
                      >
                        {mode.label}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-900">
                          <FontAwesomeIcon
                            icon={faCheck}
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}

export default AudioModeSelect;
