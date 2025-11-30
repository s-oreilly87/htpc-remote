import React, {useState} from "react";

import {REMOTE} from "@/utilities/constants";
import {
    killLinuxApp,
    launchLinuxApp,
    sendDenonCommand,
    sendEventToHTPCEventGhost,
    sendKeystrokeToHtpc,
    sendRokuKeypress,
    setLinuxDisplayMode,
} from "@/utilities/http";
import {buttonPress, openPlexampAndroidApp, sleep} from "@/utilities/utils";
import {LinuxDisplayModeCommand, LinuxLaunchAppCommand} from "@/constants/htpcControls";

interface RemoteButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  remote: (typeof REMOTE)[keyof typeof REMOTE];
}

const PLATFORM = process.env.NEXT_PUBLIC_PLATFORM ?? "";
const USE_LINUX_API = PLATFORM === "LINUX" || PLATFORM === "LINUX_WAYLAND";

const RemoteButton: React.FC<RemoteButtonProps> = ({ remote, children, ...props }) => {
  const [buttonPressTimerId, setButtonPressTimerId] = useState<number | undefined>();

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (remote === REMOTE.ROKU) {
      sendRokuKeypress(event.currentTarget);
    } else if (remote === REMOTE.PC) {
      if (event.currentTarget.value.startsWith("KEYSTROKE")) {
        sendKeystrokeToHtpc(event.currentTarget.value);
      } else {
        const launchAppName = getLaunchAppFromValue(event.currentTarget.value);

        if (USE_LINUX_API && launchAppName) {
            if (launchAppName === LinuxLaunchAppCommand.Kodi) {
                await killLinuxApp(LinuxLaunchAppCommand.Plexamp)
                await sleep(2000)
                await setLinuxDisplayMode(LinuxDisplayModeCommand.Res4k60HDR);
                await sleep(2000)
            }

            if (launchAppName === LinuxLaunchAppCommand.Plexamp) {
                await killLinuxApp(LinuxLaunchAppCommand.Kodi)
                await sleep(2000)
                openPlexampAndroidApp();
            }

            await launchLinuxApp(launchAppName);

        } else {
          sendEventToHTPCEventGhost(event.currentTarget);
          if (event.currentTarget.value === "launchPlexamp") {
            openPlexampAndroidApp();
          }
        }
      }
    } else if (remote === REMOTE.DENON) {
      sendDenonCommand(event.currentTarget);
    }
    buttonPress(event.currentTarget, buttonPressTimerId ?? null, (timerId) =>
      setButtonPressTimerId(timerId),
    );
  };

  return (
    <button
      onClick={handleClick}
      {...props} // order matters - overwrite click handler with prop,  but add className btn to prop
      className={`btn ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
};

export default RemoteButton;

export function getLaunchAppFromValue(value: string): LinuxLaunchAppCommand | undefined {
  const launchMap: Record<string, LinuxLaunchAppCommand> = {
    launchKodi: LinuxLaunchAppCommand.Kodi,
    launchMoonlight: LinuxLaunchAppCommand.Moonlight,
    launchPlexamp: LinuxLaunchAppCommand.Plexamp,
  };

  return launchMap[value];
}
