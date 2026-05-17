import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import ModalCloseButton from "@/components/UI/ModalCloseButton";
import { MODAL_INSET } from "@/utilities/modalClasses";

interface AirMouseDemoInfoModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function AirMouseDemoInfoModal({
  isOpen,
  setIsOpen,
}: AirMouseDemoInfoModalProps) {
  function closeModal() {
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
      <div className={`${MODAL_INSET} z-50 bg-black/65`} />

      <div className={`${MODAL_INSET} z-50 overflow-y-auto`}>
        <div className="flex min-h-full items-center justify-center p-4 text-left">
          <DialogPanel
            transition
            className="relative w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-900 p-6 text-slate-200 shadow-2xl
              transition duration-300 ease-out data-closed:opacity-0 data-closed:scale-95
              data-enter:duration-300 data-leave:duration-200 data-leave:ease-in"
          >
            <ModalCloseButton
              onClick={closeModal}
              ariaLabel="Close Air Mouse demo information"
            />

            <DialogTitle
              as="h3"
              className="pr-8 text-xl font-semibold tracking-wide text-slate-50"
            >
              Air Mouse
            </DialogTitle>

            <div className="mt-4 space-y-4 text-sm leading-6 text-slate-300">
              <p>
                Air Mouse turns your phone into a motion controller for the HTPC
                cursor. In a self-hosted setup, the phone&apos;s orientation sensor
                streams movement to the local server, which relays it to robotjs or
                the Linux HTPC agent for real cursor movement and click control.
              </p>

              <div className="rounded-xl border border-amber-400/40 bg-amber-950/40 p-4 text-amber-100">
                <p className="font-semibold text-amber-200">Demo mode limitation</p>
                <p className="mt-1">
                  Air Mouse is not active in demo mode because it requires a real
                  desktop session and local input permissions. The rest of the remote
                  remains fully interactive, but this feature is disabled for the
                  public simulator.
                </p>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
