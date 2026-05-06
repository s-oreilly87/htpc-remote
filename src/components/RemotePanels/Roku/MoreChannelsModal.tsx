import { Dialog, DialogPanel } from "@headlessui/react";
import { useState } from "react";
import { sendRokuLaunchCommand } from "@/utilities/http";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { buttonPress } from "@/utilities/utils";
import { useRokuContext } from "@/context/roku";
import { useRokuChannelIcon } from "@/hooks/useRokuChannelIcon";
import type { RokuChannel } from "@/types/remote";

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
      {!isNumeric && channel.label}
    </button>
  );
}

export default function MoreChannelsModal({
  isOpen,
  setIsOpen,
  moreChannels,
}: MoreChannelsModalProps) {
  const { updateRokuState } = useRokuContext();
  const [buttonPressTimerId, setButtonPressTimerId] = useState<number | null>(null);

  function closeModal() {
    setIsOpen(false);
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    sendRokuLaunchCommand(event.currentTarget);
    updateRokuState({ powerOn: true });
    buttonPress(event.currentTarget, buttonPressTimerId, setButtonPressTimerId);
    closeModal();
  };

  return (
    <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
      <div className="fixed inset-0 z-50 bg-black/50" />

      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <DialogPanel
            transition
            className="w-full max-w-md relative transform overflow-visible rounded-2xl bg-violet-950 p-6 text-left align-middle shadow-xl -top-3
              transition duration-300 ease-out data-[closed]:opacity-0 data-[closed]:scale-95
              data-[enter]:duration-300 data-[leave]:duration-200 data-[leave]:ease-in"
          >
                <div className="mt-1 flex justify-end">
                  <button
                    type="button"
                    className="absolute -right-3 -top-4 z-50 shadow-2xl inline-flex justify-center rounded-md border border-transparent bg-red-700 px-5 py-3 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={closeModal}
                  >
                    <FontAwesomeIcon icon={faXmark} color="white" />
                  </button>
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
