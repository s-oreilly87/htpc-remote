import Image from "next/image";
import { Dialog, DialogPanel } from "@headlessui/react";
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

interface QRCodeProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const QRCode: React.FC<QRCodeProps> = ({ isOpen, setIsOpen }) => {
  function closeModal() {
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
      <div className="fixed inset-0 z-50 bg-black/50" />

      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <DialogPanel
            transition
            className="w-full max-w-md relative transform overflow-visible rounded-2xl bg-slate-800 p-6 text-left align-middle shadow-xl -top-3
              transition duration-300 ease-out data-[closed]:opacity-0 data-[closed]:scale-95
              data-[enter]:duration-300 data-[leave]:duration-200 data-[leave]:ease-in"
          >
            <div className="mt-1 flex justify-end">
              <button
                type="button"
                className="absolute -right-3 -top-4 z-50 shadow-2xl inline-flex justify-center rounded-md border border-transparent bg-red-700 px-5 py-3 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                onClick={closeModal}
              >
                <FontAwesomeIcon icon={faXmark} color={"white"} />
              </button>
            </div>
            <div className="w-full flex flex-col items-center justify-center gap-4">
              <Image
                width={300}
                height={300}
                src="/QR-remote-sean-home.png"
                alt="QR Code"
              />
              <div className="w-75 text-white text-center">
                For best experience, open app in Chrome browser and
                install as App.
              </div>
              <div className="w-75 text-white text-center">
                Download and install &nbsp;
                <a download className="text-teal-500" href="rootCA.pem">
                  rootCA.pem
                </a>
                &nbsp; to your devices certificate store to remove
                security warning
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export default QRCode;
