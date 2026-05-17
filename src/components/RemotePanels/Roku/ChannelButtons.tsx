import { ROKU_APPS } from "@/constants/roku";
import { useState } from "react";
import { fetchRokuChannels, sendRokuLaunchCommand } from "@/utilities/http";
import { buttonPress } from "@/utilities/utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import MoreChannelsModal from "@/components/RemotePanels/Roku/MoreChannelsModal";
import { useRokuChannelIcon } from "@/hooks/useRokuChannelIcon";
import { useQuery } from "@tanstack/react-query";
import type { RokuChannel } from "@/types/remote";
import { useRokuCec } from "@/hooks/useRokuCec";

const FRONT_PAGE_CHANNEL_IDS = new Set(
  Object.values(ROKU_APPS.CHANNELS).map((ch) => ch.id),
);

interface ChannelButtonProps {
  channel: RokuChannel;
  onPress: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

function ChannelButton({ channel, onPress }: ChannelButtonProps) {
  const { data: iconUrl } = useRokuChannelIcon(channel.id);

  return (
    <button
      onClick={onPress}
      id={channel.label}
      className={`channel-button z-50 transition duration-150 ease-in-out ${iconUrl ? "opacity-100" : "opacity-0"}`}
      value={channel.id}
      style={iconUrl ? { backgroundImage: `url(${iconUrl})`, backgroundSize: "100% 100%" } : undefined}
    />
  );
}

function RokuChannels() {
  const { wakeRoku } = useRokuCec();
  const [isMoreChannelsModalOpen, setIsMoreChannelsModalOpen] = useState(false);
  const [buttonPressTimerId, setButtonPressTimerId] = useState<number | null>(null);

  const { data: moreChannels = [] } = useQuery({
    queryKey: ["rokuMoreChannels"],
    queryFn: async () => {
      const result = await fetchRokuChannels();
      if (result.error) throw new Error(String(result.error));
      return (result.data ?? []).filter((ch) => !FRONT_PAGE_CHANNEL_IDS.has(ch.id));
    },
    staleTime: 24 * 60 * 60 * 1000,
  });

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    sendRokuLaunchCommand(event.currentTarget);
    wakeRoku();
    buttonPress(event.currentTarget, buttonPressTimerId, setButtonPressTimerId);
  };

  return (
    <>
      <MoreChannelsModal
        isOpen={isMoreChannelsModalOpen}
        setIsOpen={setIsMoreChannelsModalOpen}
        moreChannels={moreChannels}
      />
      <div id="roku-channels" className="w-full flex place-content-center gap-2">
        <div className="grid grid-cols-4 grid-rows-2 gap-3 w-full">
          {Object.values(ROKU_APPS.CHANNELS).map((channel) => (
            <ChannelButton
              key={channel.id}
              channel={channel}
              onPress={handleClick}
            />
          ))}
          <button
            className="more-channels-button z-50"
            onClick={() => setIsMoreChannelsModalOpen(true)}
          >
            <FontAwesomeIcon icon={faPlus} size="2xl" beatFade color="#461699" />
          </button>
        </div>
      </div>
    </>
  );
}

export default RokuChannels;
