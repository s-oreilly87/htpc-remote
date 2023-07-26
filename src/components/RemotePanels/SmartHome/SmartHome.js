import {Dialog, Transition} from "@headlessui/react";
import {Fragment, useState} from 'react'

const SmartHome = ({isOpen, setIsOpen}) => {

    const [brightness, setBrightness] = useState(50)

    function closeModal() {
        setIsOpen(false)
    }

    function openModal() {
        setIsOpen(true)
    }

    const handleToggle = (event) => {
        fetch('api/tp-link/toggle/' + event.currentTarget.value).then((response) => console.log(response))
    }

    const handleBrightness = (event) => {
        setBrightness(event.currentTarget.value)
        fetch(`api/tp-link/brightness/basement/${event.target.value}`)
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
                                    <div className="flex flex-col justify-between flex-grow pb-[15%]">
                                        <span className="text-amber-400 text-center text-2xl">Stairway Light</span>
                                        <div className="flex justify-center gap-0.5 mb-5">
                                            <button className="btn btn-secondary rounded-r-none rounded-l-2xl w-1/6" value="stairway/off" onClick={handleToggle}>
                                                Off
                                            </button>
                                            <button className="btn btn-secondary rounded-l-none rounded-r-2xl w-1/6" value="stairway/on" onClick={handleToggle}>
                                                On
                                            </button>
                                        </div>
                                        <span className="text-amber-400 text-center text-2xl">Bedroom Light</span>
                                        <div className="flex justify-center gap-0.5 mb-5">
                                            <button className="btn btn-secondary rounded-r-none rounded-l-2xl w-1/6" value="bedroom/off" onClick={handleToggle}>
                                               Off
                                            </button>
                                            <button className="btn btn-secondary rounded-l-none rounded-r-2xl w-1/6" value="bedroom/on" onClick={handleToggle}>
                                               On
                                            </button>
                                        </div>
                                        <span className="text-amber-400 text-center text-2xl">Basement Lights</span>
                                        <div className="flex justify-center gap-0.5 mb-2">
                                            <button className="btn btn-secondary rounded-r-none rounded-l-2xl w-1/6" value="basement/off" onClick={handleToggle}>
                                                Off
                                            </button>
                                            <button className="btn btn-secondary rounded-l-none rounded-r-2xl w-1/6" value="basement/on" onClick={handleToggle}>
                                                On
                                            </button>
                                        </div>
                                        <div className="flex justify-center gap-0.5 mb-2">
                                            <button className="btn bg-amber-800 rounded-full w-1/8" value="25" onClick={handleBrightness}>
                                                25%
                                            </button>
                                            <button className="btn bg-amber-600 rounded-full w-1/8" value="35" onClick={handleBrightness}>
                                                35%
                                            </button>
                                            <button className="btn bg-amber-500 rounded-full w-1/8" value="50" onClick={handleBrightness}>
                                                50%
                                            </button>
                                            <button className="btn bg-amber-400 text-amber-900 rounded-full w-1/8" value="65" onClick={handleBrightness}>
                                                65%
                                            </button>
                                            <button className="btn bg-amber-300 text-amber-900 rounded-full w-1/8" value="75" onClick={handleBrightness}>
                                                75%
                                            </button>
                                            <button className="btn bg-amber-200 text-amber-900 rounded-full w-1/8" value="100" onClick={handleBrightness}>
                                                MAX
                                            </button>
                                        </div>

                                        <div className="flex gap-2 items-center justify-center text-amber-400">
                                            0
                                            <input
                                                id="default-range"
                                                type="range"
                                                value={brightness}
                                                className="w-1/2 h-2 bg-gray-200 text-amber-400 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                                onChange={handleBrightness}
                                            />
                                            100
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>

    );
}

export default SmartHome;

