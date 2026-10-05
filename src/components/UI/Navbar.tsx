import Image from "next/image";
import { useState, type MouseEvent } from "react";
import { RemoteType, REMOTE_ORDER, REMOTE_LABEL } from "@/constants/remotes";
import { buttonPress } from "@/utilities/utils";

import QRCode from "@/components/UI/QRCode";
import SmartHomeModal from "@/components/RemotePanels/SmartHome/SmartHomeModal";
import { HAS_TPLINK_DEVICES } from "@/constants/smartHome";

interface Props {
  className?: string;
  isDesktop: boolean;
  selectedRemote: RemoteType;
  setSelectedRemote: (remote: RemoteType) => void;
}

const REMOTE_TAB_ACCENT: Record<RemoteType, string> = {
  [RemoteType.DENON]: "btn-primary-denon",
  [RemoteType.ROKU]: "btn-primary-roku",
  [RemoteType.PC]: "btn-primary-pc",
};

function Navbar({
  className,
  isDesktop,
  selectedRemote,
  setSelectedRemote,
}: Props) {
  const [buttonPressTimerId, setButtonPressTimerId] = useState<number | null>(
    null,
  );
  const selectRemote = (
    event: MouseEvent<HTMLButtonElement>,
    remote: RemoteType,
  ) => {
    setSelectedRemote(remote);
    buttonPress(event.currentTarget, buttonPressTimerId, setButtonPressTimerId);
  };
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
      <nav
        className={className}
        aria-label="HTPC Remote app bar"
        data-has-lights={HAS_TPLINK_DEVICES}
      >
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
          {isDesktop ? (
            <span className="ml-2 text-lg font-semibold text-slate-200">
              HTPC Remote
            </span>
          ) : (
            <div className="remote-compact-tabs" aria-label="Remote selection">
              {REMOTE_ORDER.map((remote) => (
                <button
                  key={remote}
                  type="button"
                  className={`remote-tab ${
                    selectedRemote === remote
                      ? `remote-tab-active ${REMOTE_TAB_ACCENT[remote]}`
                      : "remote-tab-inactive"
                  }`}
                  data-remote={remote}
                  aria-pressed={selectedRemote === remote}
                  onClick={(event) => selectRemote(event, remote)}
                >
                  {REMOTE_LABEL[remote]}
                </button>
              ))}
            </div>
          )}
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
