import Image from "next/image";
import React, { useState } from "react";

import { RemoteType, REMOTE_ORDER, REMOTE_LABEL } from "@/constants/remotes";
import QRCode from "@/components/UI/QRCode";
import SmartHomeModal from "@/components/RemotePanels/SmartHome/SmartHomeModal";
import { buttonPress } from "@/utilities/utils";
import { HAS_TPLINK_DEVICES } from "@/constants/smartHome";

interface Props {
  isDesktop?: boolean;
  className?: string;
  selectedRemote: RemoteType;
  onClickHandler: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const REMOTE_TAB_ACCENT: Record<RemoteType, string> = {
  [RemoteType.DENON]: "btn-primary-denon",
  [RemoteType.ROKU]: "btn-primary-roku",
  [RemoteType.PC]: "btn-primary-pc",
};

function Navbar({
  className,
  selectedRemote,
  onClickHandler,
  isDesktop = false,
}: Props) {
  const [buttonPressTimerId, setButtonPressTimerId] = useState<
    number | undefined
  >();
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [smartHomeModalOpen, setSmartHomeModalOpen] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClickHandler(event);
    buttonPress(event.currentTarget, buttonPressTimerId ?? null, (timerId) =>
      setButtonPressTimerId(timerId),
    );
  };

  const handleIconClick = () => {
    setQrModalOpen(true);
  };

  const handleLightClick = () => {
    setSmartHomeModalOpen(true);
  };

  return (
    <>
      <QRCode isOpen={qrModalOpen} setIsOpen={setQrModalOpen} />
      {HAS_TPLINK_DEVICES && (
        <SmartHomeModal
          isOpen={smartHomeModalOpen}
          setIsOpen={setSmartHomeModalOpen}
        />
      )}
      <nav className={className}>
        <div className="max-w-7xl h-16 w-full mx-auto px-3 z-10 flex relative justify-center">
          <div className="py-1 absolute left-0 top-0 z-20 aspect-video">
            <Image
              src={"/icons/app-icon-512.png"}
              alt="Remote"
              width={60}
              height={60}
              className="w-auto ml-1"
              onClick={handleIconClick}
            />
          </div>
          {HAS_TPLINK_DEVICES && (
            <div className="py-1 absolute right-2 top-3 z-20 hover:cursor-pointer">
              <Image
                src={"/icons/lightbulb.png"}
                alt="Lights"
                width={40}
                height={40}
                onClick={handleLightClick}
              />
            </div>
          )}
          {isDesktop ? (
            <span className="self-center text-sm tracking-[0.2em] uppercase text-slate-400">
              Home theater
            </span>
          ) : (
            <div className="flex w-3/4 max-w-[550px] min-w-[270px] justify-center">
              <div
                className="w-full flex items-end"
                aria-label="Remote selection"
              >
                {REMOTE_ORDER.map((remote) => (
                  <button
                    key={remote}
                    onClick={handleClick}
                    className={
                      selectedRemote === remote
                        ? `nav-tab-active ${REMOTE_TAB_ACCENT[remote]}`
                        : "nav-tab-inactive"
                    }
                    value={remote}
                    aria-pressed={selectedRemote === remote}
                  >
                    {REMOTE_LABEL[remote]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}

export default Navbar;
