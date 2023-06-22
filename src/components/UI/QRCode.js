import Image from "next/image";
import {Dialog, Transition} from "@headlessui/react";
import {Fragment} from 'react'


const QRCode = ({isOpen, setIsOpen}) => {
    function closeModal() {
        setIsOpen(false)
    }

    function openModal() {
        setIsOpen(true)
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
                                    <div className="w-full flex flex-col items-center justify-center gap-4">
                                        <Image width="300" height="300" src="/Remote App QR Code.png" alt="QR Code" />
                                        <div className="w-75 text-white text-center">
                                            For best experience, open app in Chrome browser.
                                        </div>
                                        <div className="w-75 text-white text-center">
                                            Download and install &nbsp;<a download className="text-teal-500" href="rootCA.pem">rootCA.pem</a>&nbsp; to your device to remove security warning
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

export default QRCode;

