import {Dialog, Transition} from "@headlessui/react";
import {Fragment, useEffect} from 'react'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faXmark} from "@fortawesome/free-solid-svg-icons";
import {useTplinkContext} from "@/context/tplink.js";
import {LIGHTSWITCHES} from "@/utilities/constants.js";
import LightswitchToggle from "@/components/RemotePanels/SmartHome/LightswitchToggle.js";
import LoadingSpinner from "@/components/UI/LoadingSpinner.js";

const brightnessButtons = [
    { value: 1, label: ' 1%', color: 'amber-800', textColor: 'amber-400' },
    { value: 25, label: '25%', color: 'amber-600', textColor: 'amber-300' },
    { value: 40, label: '40%', color: 'amber-500', textColor: 'amber-200' },
    { value: 60, label: '60%', color: 'amber-400', textColor: 'amber-900' },
    { value: 75, label: '75%', color: 'amber-300', textColor: 'amber-800' },
    { value: 100, label: 'MAX', color: 'amber-200', textColor: 'amber-700' },
]

const SmartHomeModal = ({isOpen, setIsOpen}) => {

    const [tplinkState, updateTplinkState, refreshSwitchInfo] = useTplinkContext()

    useEffect(() => {
        if (isOpen) {
            refreshSwitchInfo('all')
        }

    }, [isOpen])

    function closeModal() {
        setIsOpen(false)
    }

    function openModal() {
        setIsOpen(true)
    }

    const handleToggle = (event) => {
        updateTplinkState({ [event.currentTarget.value.split('/')[0]] : { powerState: event.currentTarget.value.split('/')[1] === 'on' } })
        fetch('api/tp-link/toggle/' + event.currentTarget.value).then((response) => console.log(response))
    }

    const handleChangeBasementBrightness = (event) => {
        const brightness = event.currentTarget.value
        if (brightness < 1 || brightness > 100) {
            return console.error('Invalid Brightness value')
        }
        updateTplinkState({ basement: { powerState: tplinkState.basement.powerState, brightness: brightness } })
        fetch(`api/tp-link/brightness/basement/${brightness}`)
    }

    return (
        <>
            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-50" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md relative transform overflow-visible rounded-2xl bg-slate-800 p-6 text-left align-middle shadow-xl transition-all -top-3">
                                    <div className="mt-1 flex justify-end">
                                        <button
                                            type="button"
                                            className="absolute -right-3 -top-4 z-50 shadow-2xl inline-flex justify-center rounded-md border border-transparent bg-red-700 px-5 py-3 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                            onClick={closeModal}
                                        >
                                            <FontAwesomeIcon icon={faXmark} color={'white'} />
                                        </button>
                                    </div>

                                    {!tplinkState.loading && (
                                        <div className="flex flex-col justify-between flex-grow pb-[15%]">
                                            {Object.values(LIGHTSWITCHES).map(lightSwitch => (
                                                <LightswitchToggle key={lightSwitch.id} lightSwitch={lightSwitch} handleToggle={handleToggle} />
                                            ))}
                                            <div className="flex justify-center gap-0.5 mb-2">
                                                {brightnessButtons.map(button => (
                                                    <button key={button.label} className={`btn bg-${button.color} text-${button.textColor} rounded-full w-1/8"`} value={button.value} onClick={handleChangeBasementBrightness}>
                                                        <span className="min-w-12">{button.label}</span>
                                                    </button>
                                                    ))
                                                }
                                            </div>

                                            <div className="flex gap-2 items-center justify-center text-amber-400">
                                                1
                                                <input
                                                    type="range"
                                                    min={1}
                                                    max={100}
                                                    value={tplinkState.basement.brightness}
                                                    className="w-1/2 h-2 bg-gray-200 accent-amber-400 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                                    onChange={handleChangeBasementBrightness}
                                                />
                                                100
                                            </div>
                                        </div>
                                        )}
                                    {tplinkState.loading && (
                                        <div className="flex justify-center items-center text-amber-400 my-16">
                                            <div>
                                                Connecting to lights . . .
                                                <LoadingSpinner color="amber-400" size={32}/>
                                            </div>
                                        </div>
                                        )}
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
}

export default SmartHomeModal;

