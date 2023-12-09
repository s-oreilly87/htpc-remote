import { ROKU_APPS } from "@/utilities/constants.js";
import { useEffect, useState } from "react";
import {
  fetchRokuChannels,
  sendRokuLaunchCommand,
  sendRokuQuery,
} from "@/utilities/http";
import { buttonPress } from "@/utilities/utils.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import MoreChannelsModal from "@/components/RemotePanels/Roku/MoreChannelsModal.js";

function RokuChannels({ setPowerOn }) {
  const [iconsLoaded, setIconsLoaded] = useState(false);
  const [moreChannels, setMoreChannels] = useState({});
  const [moreChannelsModalOpen, setMoreChannelsModalOpen] = useState(false);
  const [buttonPressTimer, setButtonPressTimer] = useState();

  const fetchIcon = async (button) => {
    const channelId = button.value;
    const cachedImageUrl = localStorage.getItem(`channelImage${channelId}`);

    if (cachedImageUrl) {
      try {
        await fetch(cachedImageUrl, { method: "GET" });
        // If the image is still available, apply it to button then exit function
        button.style.backgroundImage = `url(${cachedImageUrl})`;
        button.style.backgroundSize = "100% 100%";
        return;
      } catch (error) {
        // If the image is not available, remove the stale cached image URL from localStorage
        localStorage.removeItem(`channelImage${channelId}`);
      }
    }

    // fetch from Roku API
    let imageUrl;
    let blob;
    const response = await sendRokuQuery(`icon/${button.value}`);
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      blob = new Blob([buffer], { type: "image/jpeg" });
      imageUrl = URL.createObjectURL(blob);
      localStorage.setItem(`channelImage${channelId}`, imageUrl);
      button.style.backgroundImage = `url(${imageUrl})`;
      button.style.backgroundSize = "100% 100%";
      console.log("Image loaded from API");
    } else {
      console.error("No Image for channelId = " + channelId);
      button.innerHTML = button.id;
      button.style.color = "white";
    }
  };
  const fetchIcons = async (selector) => {
    const channelButtons = document.querySelectorAll(`.${selector}`);
    const promises = [];
    for (const button of channelButtons) {
      promises.push(fetchIcon(button));
    }
    await Promise.all(promises);
    setIconsLoaded(true);
  };

  const fetchChannels = async () => {
    const response = await fetchRokuChannels();
    if (response.error) {
      console.log("fetch channels error");
      return response.error;
    }

    const channels = response.data;

    const frontPageChannelIds = Object.values(ROKU_APPS.CHANNELS).map(
      (channel) => channel.id,
    );

    const moreChannels = channels.filter(
      (channel) => !frontPageChannelIds.includes(channel.id),
    );

    setMoreChannels(moreChannels);

    return moreChannels;
  };

  useEffect(() => {
    fetchIcons("channel-button").then(fetchChannels);
  }, []);

  const handleClick = (event) => {
    sendRokuLaunchCommand(event.currentTarget);
    setPowerOn(true);
    buttonPress(event.currentTarget, buttonPressTimer, setButtonPressTimer);
  };

  const handleClickMore = (event) => {
    setMoreChannelsModalOpen(true);
  };

  return (
    <>
      <MoreChannelsModal
        isOpen={moreChannelsModalOpen}
        setIsOpen={setMoreChannelsModalOpen}
        moreChannels={moreChannels}
        fetchIcons={fetchIcons}
        setPowerOn={setPowerOn}
      />
      <div
        id="roku-channels"
        className="w-full flex place-content-center gap-2"
      >
        <div
          className={`grid grid-cols-4 grid-rows-2 gap-3 w-full ${
            iconsLoaded ? "opacity-100" : "opacity-0"
          } transition duration-150 ease-in-out`}
        >
          {Object.values(ROKU_APPS.CHANNELS).map((CHANNEL) => (
            <button
              onClick={handleClick}
              key={CHANNEL.id}
              id={CHANNEL.label}
              className="channel-button z-50"
              value={CHANNEL.id}
            ></button>
          ))}
          <button
            className={"more-channels-button z-50"}
            onClick={handleClickMore}
          >
            <FontAwesomeIcon
              icon={faPlus}
              size={"2xl"}
              beatFade={true}
              color={"#461699"}
            />
          </button>
        </div>
      </div>
    </>
  );
}

export default RokuChannels;
