import Image from "next/image";
import React, { useState } from "react";

import { RemoteType } from "@/constants/remotes";
import QRCode from "@/components/UI/QRCode";
import SmartHomeModal from "@/components/RemotePanels/SmartHome/SmartHomeModal";
import { buttonPress } from "@/utilities/utils";
import { HAS_TPLINK_DEVICES } from "@/constants/smartHome";

interface NavbarProps {
  className?: string;
  selectedRemote: RemoteType;
  onClickHandler: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

function Navbar({ className, selectedRemote, onClickHandler }: NavbarProps) {
  const [buttonPressTimerId, setButtonPressTimerId] = useState<number | undefined>();
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
        <SmartHomeModal isOpen={smartHomeModalOpen} setIsOpen={setSmartHomeModalOpen} />
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
          <div className="flex w-3/4 max-w-[550px] min-w-[270px] justify-center">
            <div className="w-full flex items-end">
              <button
                onClick={handleClick}
                className={
                  selectedRemote === RemoteType.DENON
                    ? "nav-tab-active btn-primary-denon"
                    : "nav-tab-inactive"
                }
                value={RemoteType.DENON}
              >
                Denon
              </button>
              <button
                onClick={handleClick}
                className={
                  selectedRemote === RemoteType.ROKU
                    ? "nav-tab-active btn-primary-roku"
                    : "nav-tab-inactive"
                }
                value={RemoteType.ROKU}
              >
                Roku
              </button>
              <button
                onClick={handleClick}
                className={
                  selectedRemote === RemoteType.PC
                    ? "nav-tab-active btn-primary-pc"
                    : "nav-tab-inactive"
                }
                value={RemoteType.PC}
              >
                HTPC
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
