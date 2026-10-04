import Image from "next/image";
import { useState } from "react";

import QRCode from "@/components/UI/QRCode";
import SmartHomeModal from "@/components/RemotePanels/SmartHome/SmartHomeModal";
import { HAS_TPLINK_DEVICES } from "@/constants/smartHome";

interface Props {
  className?: string;
}

function Navbar({ className }: Props) {
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [smartHomeModalOpen, setSmartHomeModalOpen] = useState(false);

  return (
    <>
      <QRCode isOpen={qrModalOpen} setIsOpen={setQrModalOpen} />
      {HAS_TPLINK_DEVICES && (
        <SmartHomeModal
          isOpen={smartHomeModalOpen}
          setIsOpen={setSmartHomeModalOpen}
        />
      )}
      <nav className={className} aria-label="HTPC Remote app bar">
        <div className="remote-brand-row remote-chrome-width">
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-blue-400"
            onClick={() => setQrModalOpen(true)}
            aria-label="Show remote QR code"
            title="Show remote QR code"
          >
            <Image
              src="/icons/app-icon-512.png"
              alt=""
              width={40}
              height={40}
            />
          </button>
          <span className="ml-2 text-lg font-semibold text-slate-200">
            HTPC Remote
          </span>
          {HAS_TPLINK_DEVICES && (
            <button
              type="button"
              className="ml-auto flex size-10 shrink-0 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-blue-400"
              onClick={() => setSmartHomeModalOpen(true)}
              aria-label="Lights"
              title="Lights"
            >
              <Image src="/icons/lightbulb.png" alt="" width={32} height={32} />
            </button>
          )}
        </div>
      </nav>
    </>
  );
}

export default Navbar;
