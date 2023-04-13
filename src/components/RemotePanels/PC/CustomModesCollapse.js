import {Fragment} from "react";
import {Popover, Transition} from '@headlessui/react'
import AudioModeSelect from "./AudioModeSelect";
import DisplayModeSelect from "./DisplayModeSelect";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronDown} from "@fortawesome/free-solid-svg-icons";

function CustomModesCollapse({ selectedDisplayMode, setSelectedDisplayMode, selectedAudioMode, setSelectedAudioMode }) {
    return (
        <div>
            <Popover className="relative">
                {({ open }) => (
                    <>
                        <Popover.Button  className="btn btn-secondary w-full flex relative justify-center items-center" type="button">
                            Custom Audio/Video Modes
                            <FontAwesomeIcon icon={ faChevronDown } className={`absolute right-6 ${(open ? 'rotate-180 transform' : '')}`} />
                        </Popover.Button>

                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-200"
                            enterFrom="opacity-0 -translate-y-10 h-1/4"
                            enterTo="opacity-100 translate-y-0 h-full"
                            leave="transition ease-in duration-150"
                            leaveFrom="opacity-100 translate-y-0 h-full"
                            leaveTo="opacity-0 -translate-y-10 h-1/4"
                        >
                            <Popover.Panel className="absolute left-1/2 z-50 mt-3 w-screen max-w-[525px] -translate-x-1/2 transform px-3 remote:px-0">
                                <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-gray-500 py-4 space-y-3">
                                    <AudioModeSelect selectedAudioMode={ selectedAudioMode } setSelectedAudioMode={ setSelectedAudioMode } />
                                    <DisplayModeSelect selectedDisplayMode={ selectedDisplayMode } setSelectedDisplayMode={ setSelectedDisplayMode } />
                                </div>
                            </Popover.Panel>
                        </Transition>
                    </>
                )}
            </Popover>
        </div>
    );
}

export default CustomModesCollapse;