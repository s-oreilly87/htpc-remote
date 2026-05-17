import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useEffect, useState } from "react";

import ModalCloseButton from "@/components/UI/ModalCloseButton";
import { MODAL_INSET } from "@/utilities/modalClasses";

interface DemoModeWelcomeInfoModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const DESKTOP_QUERY = "(min-width: 1024px)";

export function DemoModeWelcomeInfoModal({
  isOpen,
  setIsOpen,
}: DemoModeWelcomeInfoModalProps) {
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_QUERY);
    const updateViewport = () => setIsMobileViewport(!mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  function closeModal() {
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
      <div className={`${MODAL_INSET} z-50 bg-black/70`} />

      <div className={`${MODAL_INSET} z-50 overflow-y-auto`}>
        <div className="flex min-h-full items-center justify-center p-4 text-left">
          <DialogPanel
            transition
            className="relative w-full max-w-2xl overflow-visible rounded-2xl border border-slate-700/70 bg-slate-900 p-6 text-slate-200 shadow-2xl
              transition duration-300 ease-out data-closed:opacity-0 data-closed:scale-95
              data-enter:duration-300 data-leave:duration-200 data-leave:ease-in"
          >
            <ModalCloseButton
              onClick={closeModal}
              ariaLabel="Close demo information"
            />

            <DialogTitle
              as="h3"
              className="pr-10 text-2xl font-semibold tracking-wide text-slate-50"
            >
              Welcome to the HTPC Remote Demo
            </DialogTitle>

            <div className="mt-4 space-y-5 text-sm leading-6 text-slate-300">
              <p>
                This demo lets you operate the same remote interface used for a real
                home theater, without connecting to private LAN devices. Every button
                press is routed into a local simulator, so you can see how the remote
                coordinates the TV, Roku, Denon AVR, HTPC, and smart lights as a single
                system.
              </p>

              {isMobileViewport && (
                <div className="rounded-xl border border-amber-400/40 bg-amber-950/40 p-4 text-amber-100">
                  <p className="font-semibold text-amber-200">Mobile viewport note</p>
                  <p className="mt-1">
                    The remote itself is fully usable on mobile, but the demo theater
                    panel, virtual device state, and event log are displayed on desktop
                    layouts only. Feel free to try the controls on mobile, then switch
                    to a desktop-width viewport to watch the simulated system respond.
                  </p>
                </div>
              )}

              <div>
                <p className="font-semibold text-slate-100">Good things to try</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    Swipe left/right to switch to other remote panels
                  </li>
                  <li>
                    Use the HTPC presets, especially <span className="text-slate-100">Game</span>{" "}
                    and <span className="text-slate-100">Watch Kodi</span>, to see a
                    multi-device scene change.
                  </li>
                  <li>
                    Open the Roku panel and launch apps or switch HDMI inputs to watch
                    the TV and AVR state update.
                  </li>
                  <li>
                    Adjust Denon volume, sound modes, and menu navigation to see command
                    traffic appear in the event log.
                  </li>
                  <li>
                    Open the smart lights panel and toggle the virtual TP-Link devices,
                    including the basement dimmer.
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
                <p className="font-semibold text-slate-100">How it works when self-hosted</p>
                <p className="mt-2">
                  In a real deployment, this Next.js app runs on your local network and
                  talks directly to the devices you configure: Roku ECP over HTTP, Denon
                  AVR control over HTTP and Telnet, TP-Link Kasa over the LAN, and HTPC
                  automation through EventGhost, robotjs, ydotool, or the Linux HTPC
                  agent. There is no account, cloud service, or vendor hub in the
                  control path.
                </p>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
