import Image from "next/image";
import {REMOTE} from "@/utilities/constants";
import {useState} from "react";
import {buttonPress} from "@/utilities/utils";
import QRCode from "@/components/UI/QRCode.js";
import SmartHomeModal from "@/components/RemotePanels/SmartHome/SmartHomeModal.js";
import {TplinkProvider} from "@/context/tplink.js";

function Navbar({ className, selectedRemote, onClickHandler }) {
  const [buttonPressTimer, setButtonPressTimer] = useState();

  const [qrModalOpen, setQrModalOpen] = useState(false);

  const [smartHomeModalOpen, setSmartHomeModalOpen] = useState(false);

  const handleClick = (event) => {
    onClickHandler(event);
    buttonPress(event.currentTarget, buttonPressTimer, setButtonPressTimer);
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
      {/*<TplinkProvider>*/}
      {/*  <SmartHomeModal*/}
      {/*    isOpen={smartHomeModalOpen}*/}
      {/*    setIsOpen={setSmartHomeModalOpen}*/}
      {/*  />*/}
      {/*</TplinkProvider>*/}
      <nav className={className}>
        <div className="max-w-7xl h-16 w-full mx-auto px-3 z-10 flex relative justify-center">
          <div className="py-1 absolute left-0 top-0 z-20 aspect-video">
            <Image
              src={"/icons/app-icon.png"}
              alt="Remote"
              width={60}
              height={50}
              onClick={handleIconClick}
            />
          </div>
          <div className="flex w-3/4 max-w-[550px] min-w-[270px] justify-center">
            <div className="w-full flex items-end">
              <button
                  onClick={handleClick}
                  className={
                    selectedRemote === REMOTE.DENON
                        ? "nav-tab-active btn-primary-denon"
                        : "nav-tab-inactive"
                  }
                  value={REMOTE.DENON}
              >
                Denon
              </button>
              <button
                  onClick={handleClick}
                  className={
                    selectedRemote === REMOTE.ROKU
                        ? "nav-tab-active btn-primary-roku"
                        : "nav-tab-inactive"
                  }
                  value={REMOTE.ROKU}
              >
                Roku
              </button>
              <button
                  onClick={handleClick}
                  className={
                    selectedRemote === REMOTE.PC
                        ? "nav-tab-active btn-primary-pc"
                        : "nav-tab-inactive"
                  }
                  value={REMOTE.PC}
              >
                HTPC
              </button>
            </div>
            {/*<div className="py-1 absolute right-2 top-3 z-20 hover:cursor-pointer">*/}
            {/*  <Image*/}
            {/*      src={"/icons/lightbulb.png"}*/}
            {/*      alt="Lightbulb"*/}
            {/*      width={50}*/}
            {/*      height={50}*/}
            {/*      onClick={handleLightClick}*/}
            {/*  />*/}
            {/*</div>*/}
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
