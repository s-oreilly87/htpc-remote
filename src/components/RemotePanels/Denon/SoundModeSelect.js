import {Fragment, useEffect, useState} from 'react'
import {Listbox, Transition} from '@headlessui/react'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheck, faChevronDown} from "@fortawesome/free-solid-svg-icons";
import {sendDenonCommand} from "@/utilities/http";
import {DENON_SOUND_MODES} from "@/utilities/constants.js";
import LoadingSpinner from "@/components/UI/LoadingSpinner.js";

import {dot_matrix} from "@/styles/fonts.js";
import {useDenonContext} from "@/context/denon.js";

const SelectSoundMode = ({ cycleTimeout }) => {
    const [denonState, setDenonState, refreshDenonState] = useDenonContext();

    //TODO: update this component to use a similar pattern to AudioModeSelect and DisplayModeSelect

    const [selectedSoundMode, setSelectedSoundMode] = useState(denonState.soundMode)

    useEffect(() => {
        if (denonState.soundMode) {
            setSelectedSoundMode(denonState.soundMode)
        }
    }, [denonState.soundMode])

    const handleListBoxSelect = async (soundMode) => {
        setDenonState({ soundMode: soundMode })
        const response = await sendDenonCommand({ value: soundMode.value })
        if (response.error) {
            return console.error(response.error)
        }
        refreshDenonState()
    }

    return (
        <div className="flex w-4/5 mx-auto">
            <Listbox value={ selectedSoundMode }
                     by="value"
                     onChange={handleListBoxSelect}>
                <div className="relative mt-1 w-full ">
                    <Listbox.Button className="relative w-full h-[40px] cursor-default rounded-lg bg-slate-800 pt-1 pb-2 pl-3 pr-10 text-center shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
                        { !denonState.loading &&
                            <span className={`block truncate text-teal-400 text-xl ${dot_matrix.className} ${ cycleTimeout ? 'animate-pulse' : '' }`}>
                                { selectedSoundMode.label}
                            </span>
                        }
                        { denonState.loading &&
                            <LoadingSpinner color={"teal-500"} size={"7"} />
                        }
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <FontAwesomeIcon
                              icon={ faChevronDown }
                              className="h-5 w-5 text-teal-500"
                              aria-hidden="true"
                          />
                        </span>
                    </Listbox.Button>
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0">
                        <Listbox.Options className="absolute z-40 mt-1 max-h-72 w-full overflow-auto rounded-md bg-slate-700 py-1 text-base text-center shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {Object.values(DENON_SOUND_MODES).map((soundMode) => (
                                <Listbox.Option
                                    key={ soundMode.label }
                                    value={ soundMode }
                                    disabled={ soundMode.value === "placeholder" }
                                    className={({ active }) => `relative w-full cursor-default select-none py-2 pl-10 pr-4
                                    ${active ? 'bg-teal-600 text-white' : (soundMode.value === "placeholder" ? 'text-gray-400' : 'text-teal-200')}`}>
                                    {({ selected }) => (
                                        <>
                                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                            { soundMode.label }
                                          </span>
                                            {selected ? (
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-300">
                                                    <FontAwesomeIcon icon={ faCheck } className="h-5 w-5" aria-hidden="true" />
                                                </span>
                                            ) : null
                                            }
                                        </>
                                    )}
                                </Listbox.Option>
                            ))}
                        </Listbox.Options>
                    </Transition>
                </div>
            </Listbox>
        </div>
    )
}

export default SelectSoundMode;