import { useEffect, useState } from "react";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { sendDenonCommand } from "@/utilities/http";
import { DENON_SOUND_MODES } from "@/constants/denon";
import LoadingSpinner from "@/components/UI/LoadingSpinner";

import { dot_matrix } from "@/styles/fonts";
import { useDenonContext } from "@/context/denon";

const SelectSoundMode = ({ cycleTimeout }) => {
  const { denonState, isLoading, updateDenonState, invalidateDenonState } = useDenonContext();

  //TODO: update this component to use a similar pattern to AudioModeSelect and DisplayModeSelect

  const [selectedSoundMode, setSelectedSoundMode] = useState(
    denonState.soundMode,
  );

  useEffect(() => {
    if (denonState.soundMode) {
      setSelectedSoundMode(denonState.soundMode);
    }
  }, [denonState.soundMode]);

  const handleListBoxSelect = async (soundMode) => {
    updateDenonState({ soundMode: soundMode });
    const response = await sendDenonCommand({ value: soundMode.value });
    if (response.error) {
      return console.error(response.error);
    }
    invalidateDenonState();
  };

  return (
    <div className="flex w-4/5 mx-auto">
      <Listbox
        value={selectedSoundMode}
        by="value"
        onChange={handleListBoxSelect}
      >
        <div className="relative w-full">
          <ListboxButton className="relative w-full h-10 cursor-default rounded-lg bg-slate-800 pt-1 pb-2 pl-3 pr-10 text-center shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
            {!isLoading && (
              <span
                className={`block truncate text-teal-400 text-xl ${
                  dot_matrix.className
                } ${cycleTimeout ? "animate-pulse" : ""}`}
              >
                {selectedSoundMode.label}
              </span>
            )}
            {isLoading && <LoadingSpinner color={"teal-500"} />}
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <FontAwesomeIcon
                icon={faChevronDown}
                className="h-5 w-5 text-teal-500"
                aria-hidden="true"
              />
            </span>
          </ListboxButton>
            <ListboxOptions
              transition
              className="absolute z-40 mt-1 max-h-72 w-full overflow-auto rounded-md bg-slate-700 py-1 text-base text-center shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm
                transition ease-in duration-100 data-[closed]:opacity-0"
            >
              {Object.values(DENON_SOUND_MODES).map((soundMode) => (
                <ListboxOption
                  key={soundMode.label}
                  value={soundMode}
                  disabled={soundMode.value === "placeholder"}
                  className={({
                    active,
                  }) => `relative w-full cursor-default select-none py-2 pl-10 pr-4
                                    ${
                                      active
                                        ? "bg-teal-600 text-white"
                                        : soundMode.value === "placeholder"
                                          ? "text-gray-400"
                                          : "text-teal-200"
                                    }`}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? "font-medium" : "font-normal"
                        }`}
                      >
                        {soundMode.label}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-300">
                          <FontAwesomeIcon
                            icon={faCheck}
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        </span>
                      ) : null}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
        </div>
      </Listbox>
    </div>
  );
};

export default SelectSoundMode;
