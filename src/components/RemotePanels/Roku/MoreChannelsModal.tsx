import { Dialog, DialogPanel } from "@headlessui/react";
import { useState } from "react";
import { sendRokuLaunchCommand } from "@/utilities/http";
import { buttonPress } from "@/utilities/utils";
import { useRokuChannelIcon } from "@/hooks/useRokuChannelIcon";
import type { RokuChannel } from "@/types/remote";
import ModalCloseButton from "@/components/UI/ModalCloseButton";
import { MODAL_INSET } from "@/utilities/modalClasses";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTv } from "@fortawesome/free-solid-svg-icons";
import { useRokuCec } from "@/hooks/useRokuCec";

interface MoreChannelsModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  moreChannels: RokuChannel[];
}

interface ExtraChannelButtonProps {
  channel: RokuChannel;
  onPress: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

function ExtraChannelButton({ channel, onPress }: ExtraChannelButtonProps) {
  const isNumeric = !isNaN(parseInt(channel.id));
  const isHdmiInput = channel.id.startsWith("tvinput");
  const { data: iconUrl } = useRokuChannelIcon(channel.id);

  // Text-only buttons (HDMI inputs) show immediately; icon buttons fade in when loaded.
  const hasContent = !isNumeric || !!iconUrl;

  return (
    <button
      onClick={onPress}
      id={channel.label}
      className={`extra-channel-button z-50 flex justify-center items-end p-0.5 text-md text-slate-200 transition-opacity duration-500 ease-in-out ${hasContent ? "opacity-100" : "opacity-0"}`}
      value={channel.id}
      style={isNumeric && iconUrl ? { backgroundImage: `url(${iconUrl})`, backgroundSize: "100% 100%" } : undefined}
    >
      {isHdmiInput && (
        <span className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg bg-slate-900/35 px-2 text-center text-sm font-semibold leading-tight text-slate-100">
          <FontAwesomeIcon icon={faTv} className="text-2xl text-slate-100" />
          <span>{channel.label}</span>
        </span>
      )}
      {!isNumeric && !isHdmiInput && channel.label}
    </button>
  );
}

export default function MoreChannelsModal({
  isOpen,
  setIsOpen,
  moreChannels,
}: MoreChannelsModalProps) {
  const { wakeRoku } = useRokuCec();
  const [buttonPressTimerId, setButtonPressTimerId] = useState<number | null>(null);

  function closeModal() {
    setIsOpen(false);
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    sendRokuLaunchCommand(event.currentTarget);
    wakeRoku();
    buttonPress(event.currentTarget, buttonPressTimerId, setButtonPressTimerId);
    closeModal();
  };

  return (
    <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
      <div className={`${MODAL_INSET} z-50 bg-black/50`} />

      <div className={`${MODAL_INSET} z-50 overflow-y-auto`}>
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <DialogPanel
            transition
            className="w-full max-w-md relative transform overflow-visible rounded-2xl bg-violet-950 p-6 text-left align-middle shadow-xl -top-3
              transition duration-300 ease-out data-[closed]:opacity-0 data-[closed]:scale-95
              data-[enter]:duration-300 data-[leave]:duration-200 data-[leave]:ease-in"
          >
                <div className="mt-1 flex justify-end">
                  <ModalCloseButton onClick={closeModal} />
                </div>
                <div className="grid grid-cols-3 grid-rows-2 gap-3 w-full">
                  {moreChannels.map((channel) => (
                    <ExtraChannelButton
                      key={channel.id}
                      channel={channel}
                      onPress={handleClick}
                    />
                  ))}
                </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
