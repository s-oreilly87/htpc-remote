import React, { useState } from "react";

import { RemoteType } from "@/constants/remotes";
import {
    killLinuxApp,
    launchLinuxApp,
    sendDenonCommand,
    sendEventToHTPCEventGhost,
    sendKeystrokeToHtpc,
    sendRokuKeypress,
    setLinuxDisplayMode,
} from "@/utilities/http";
import {buttonPress, openPlexampAndroidApp, openQobuzAndroidApp, sleep} from "@/utilities/utils";
import { LinuxDisplayModeCommand, LinuxLaunchAppCommand } from "@/constants/htpcControls";
import { usePlatform } from "@/hooks/usePlatform";
import { useRokuCec } from "@/hooks/useRokuCec";

interface RemoteButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  remote: RemoteType;
}

const RemoteButton: React.FC<RemoteButtonProps> = ({ remote, children, ...props }) => {
  const [buttonPressTimerId, setButtonPressTimerId] = useState<number | undefined>();
  const { isLinux } = usePlatform();
  const { toggleRokuPower } = useRokuCec();

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (remote === RemoteType.ROKU) {
      if (event.currentTarget.value === "Power") {
        toggleRokuPower();
      }
      sendRokuKeypress(event.currentTarget);
    } else if (remote === RemoteType.PC) {
      if (event.currentTarget.value.startsWith("KEYSTROKE")) {
        sendKeystrokeToHtpc(event.currentTarget.value);
      } else {
        const launchAppName = getLaunchAppFromValue(event.currentTarget.value);

        if (isLinux && launchAppName) {
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

            if (launchAppName === LinuxLaunchAppCommand.Qobuz) {
                await killLinuxApp(LinuxLaunchAppCommand.Kodi)
                await sleep(2000)
                openQobuzAndroidApp();
            }

            await launchLinuxApp(launchAppName);

        } else {
          sendEventToHTPCEventGhost(event.currentTarget);
          if (event.currentTarget.value === "launchPlexamp") {
            openPlexampAndroidApp();
          }
        }
      }
    } else if (remote === RemoteType.DENON) {
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
    launchQobuz: LinuxLaunchAppCommand.Qobuz,
  };

  return launchMap[value];
}
