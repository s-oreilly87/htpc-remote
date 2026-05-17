import { useCallback, useEffect, useRef, useState } from "react";
import { Field, Label, Switch } from "@headlessui/react";
import { useWakeLock } from "react-screen-wake-lock";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationCrosshairs } from "@fortawesome/free-solid-svg-icons";
import { hasRelativeOrientationSensor, type OrientationReading } from "@/utilities/sensors";
import AirMouseCalibrationModal from "@/components/RemotePanels/PC/AirMouseCalibrationModal";
import AirMouseDemoInfoModal from "@/components/RemotePanels/PC/AirMouseDemoInfoModal";
import RelativeOrientationSensor from "@/components/Sensors/RelativeOrientationSensor";
import { io, type Socket } from "socket.io-client";
import { sendClickToRobot, sendDisableCommandToRobot } from "@/utilities/http";
import { ClickType } from "@/constants/remotes";
import { getPlatformInfo } from "@/hooks/usePlatform";

const htpcIp = process.env.NEXT_PUBLIC_HTPC_IP ?? "";
const agentPort = process.env.NEXT_PUBLIC_LINUX_HTPC_AGENT_PORT ?? "3001";
const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const { isRemoteHtpc } = getPlatformInfo();

/** When the Next.js server is on a different machine, AirMouse connects directly
 *  to the htpc-agent socket.io server rather than the Next.js server. */
const agentUrl = isRemoteHtpc ? `http://${htpcIp}:${agentPort}` : null;

const AirMouse = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [hasRelOrientationSensor, setHasRelOrientationSensor] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [showDemoInfo, setShowDemoInfo] = useState(false);

  const { isSupported, released, request, release, type } = useWakeLock({});
  useEffect(() => {
    if (IS_DEMO) return;

    if (type !== undefined) {
      if (enabled) {
        request();
      } else {
        console.log(isSupported);
        console.log(released);
        release();
      }
    }
  }, [enabled, isSupported, release, released, request, type]);

  useEffect(() => {
    setHasRelOrientationSensor(hasRelativeOrientationSensor());
  }, []);

  const currentOrientation = useRef<OrientationReading | null>(null);

  const updateOrientation = (
    orientation: OrientationReading,
    prevOrientation: OrientationReading | null,
  ) => {
    currentOrientation.current = orientation;
    if (prevOrientation && socket) {
      const deltaX = prevOrientation.quaternion[2] - orientation.quaternion[2];
      const deltaY = prevOrientation.quaternion[0] - orientation.quaternion[0];
      if (Math.abs(deltaX) > 0.0005 || Math.abs(deltaY) > 0.0005) {
        socket.emit("orientation", {
          x: orientation.quaternion[2],
          y: orientation.quaternion[0],
        });
      }
    }
  };

  const initializeSocket = async () => {
    let newSocket: Socket;
    if (agentUrl) {
      // Remote HTPC: connect directly to the htpc-agent socket.io server.
      // No need to call /api/robot/initializeSocket — the agent manages its own socket.
      newSocket = io(agentUrl);
    } else {
      // Same machine: initialize socket.io on the Next.js server and connect same-origin.
      await fetch(`api/robot/initializeSocket`);
      newSocket = io();
    }
    newSocket.on("connect", () => console.log("AirMouse socket connected"));
    setSocket(newSocket);
  };

  const closeSocket = useCallback(async () => {
    socket?.removeAllListeners();
    socket?.close();
    setSocket(null);
  }, [socket]);

  const handleEnable = (isEnabled: boolean) => {
    if (IS_DEMO) {
      setEnabled(isEnabled);
      if (isEnabled) {
        setShowDemoInfo(true);
      }
      return;
    }

    if (isEnabled) {
      closeSocket().then(() => initializeSocket());
    } else {
      closeSocket();
      sendDisableCommandToRobot();
    }
    setEnabled(isEnabled);
  };

  const handleDemoClick = () => {
    if (IS_DEMO) {
      setShowDemoInfo(true);
      return true;
    }

    return false;
  };

  const handleLeftClick = () => {
    if (handleDemoClick()) return;
    sendClickToRobot(ClickType.LEFT);
  };
  const handleRightClick = () => {
    if (handleDemoClick()) return;
    sendClickToRobot(ClickType.RIGHT);
  };
  const handleDoubleClick = () => {
    if (handleDemoClick()) return;
    sendClickToRobot(ClickType.DOUBLE);
  };

  const handleSetTopLeft = () => {
    if (!currentOrientation.current) return;
    socket?.emit("setTopLeft", {
      x: currentOrientation.current.quaternion[2],
      y: currentOrientation.current.quaternion[0],
    });
  };

  const handleSetBottomRight = () => {
    if (!currentOrientation.current) return;
    socket?.emit("setBottomRight", {
      x: currentOrientation.current.quaternion[2],
      y: currentOrientation.current.quaternion[0],
    });
  };

  useEffect(() => {
    return () => {
      void closeSocket();
    };
  }, [closeSocket]);

  return (
    <>
      {hasRelOrientationSensor && (
        <>
          {enabled && !IS_DEMO && (
            <RelativeOrientationSensor
              frequency={120}
              updateOrientation={updateOrientation}
            />
          )}

          <AirMouseCalibrationModal
            showCalibration={showCalibration}
            setShowCalibration={setShowCalibration}
            handleSetTopLeft={handleSetTopLeft}
            handleSetBottomRight={handleSetBottomRight}
          />

          <AirMouseDemoInfoModal
            isOpen={showDemoInfo}
            setIsOpen={setShowDemoInfo}
          />

          <div className="flex gap-3 mx-auto self-end">
            {enabled && (
              <button
                className="btn px-10 py-6 bg-gray-500"
                onClick={handleLeftClick}
                onDoubleClick={handleDoubleClick}
              >
                L
              </button>
            )}

            <div className="flex flex-col items-center gap-2">
              <Field>
                <div className="flex flex-col items-center justify-center">
                  <Label className={"text-white"}>
                    Air Mouse
                  </Label>
                  <Switch
                    checked={enabled}
                    onChange={handleEnable}
                    className={`${
                      enabled ? "bg-blue-600" : "bg-gray-400"
                    } relative inline-flex h-6 w-11 items-center rounded-full`}
                  >
                    <span className="sr-only">Air Mouse</span>
                    <span
                      className={`${
                        enabled
                          ? "translate-x-6 bg-white"
                          : "translate-x-1 bg-blue-600"
                      } inline-block h-4 w-4 transform rounded-full transition`}
                    />
                  </Switch>
                </div>
              </Field>

              {enabled && (
                <button
                  className="btn btn-primary-pc rounded-full aspect-square p-2 justify-center items-center h-full"
                  onClick={() => setShowCalibration(true)}
                >
                  <FontAwesomeIcon icon={faLocationCrosshairs} />
                </button>
              )}
            </div>

            {enabled && (
              <button
                className="btn px-10 py-6 bg-gray-500"
                onClick={handleRightClick}
              >
                R
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default AirMouse;
