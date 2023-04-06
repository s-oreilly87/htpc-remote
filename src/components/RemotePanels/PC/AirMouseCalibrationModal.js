import {Dialog, Transition} from '@headlessui/react'
import {Fragment, useState} from 'react'

export default function AirMouseCalibrationModal({ showCalibration, setShowCalibration, handleSetTopLeft, handleSetBottomRight, orientation}) {
    const [isTopLeftSet, setIsTopLeftSet] = useState(false)

    function closeModal() {
        setIsTopLeftSet(false)
        setShowCalibration(false)
    }

    const handleClick = () => {
        if (!isTopLeftSet) {
            handleSetTopLeft()
            setIsTopLeftSet(true)
        } else {
            handleSetBottomRight()
            closeModal()
        }
    }

    return (
        <>
            <Transition appear show={showCalibration} as={Fragment}>
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
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-gray-900"
                                    >
                                        AirMouse Calibration
                                        <div>
                                            <button classname={"fixed right-0"}>X</button>
                                        </div>
                                    </Dialog.Title>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            This will calibrate your phone to the mouse pointer for your current position.
                                            If you move and things seem off, run this again.
                                        </p>
                                        <p>
                                            { isTopLeftSet ? "Point at the BOTTOM-RIGHT corner of your screen and press OK"
                                            : "Point at the TOP-LEFT corner of your screen and press OK" }
                                        </p>
                                    </div>

                                    <div className="mt-4 mx-auto">
                                        <button
                                            type="button"
                                            className="inline-flex w-2/3  justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                            onClick={handleClick}
                                        >
                                            OK
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    )
}
