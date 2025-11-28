import {useCallback, useEffect, useRef, useState} from "react";
import {Switch} from "@headlessui/react";
import {useWakeLock} from "react-screen-wake-lock";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faLocationCrosshairs} from "@fortawesome/free-solid-svg-icons";
import {hasRelativeOrientationSensor, type OrientationReading} from "@/utilities/sensors";
import AirMouseCalibrationModal from "@/components/RemotePanels/PC/AirMouseCalibrationModal";
import RelativeOrientationSensor from "@/components/Sensors/RelativeOrientationSensor";
import {io, type Socket} from "socket.io-client";
import {sendClickToNutJS, sendDisableCommandToNutJS,} from "@/utilities/http";
import {CLICK_TYPE} from "@/utilities/constants";

const AirMouse = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [hasRelOrientationSensor, setHasRelOrientationSensor] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);

  // Wakelock to keep screen alive while airMouse is enabled
  const { isSupported, released, request, release, type } = useWakeLock({
    // onRequest: () => alert('Screen Wake Lock: requested!'),
    // onError: () => alert('An error happened 💥'),
    // onRelease: () => alert('Screen Wake Lock: released!'),
  });
  useEffect(() => {
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
    await fetch(`api/nutjs/initializeSocket`);
    const newSocket = io();
    newSocket.on("connect", () => {
      console.log("Socket connected");
    });
    setSocket(newSocket);
  };

  const closeSocket = useCallback(async () => {
    socket?.removeAllListeners();
    socket?.close();
    setSocket(null);
  }, [socket]);

  const handleEnable = (isEnabled) => {
    // Create websocket connection
    if (isEnabled) {
      closeSocket().then(() => initializeSocket());
    } else {
      closeSocket();
      sendDisableCommandToNutJS();
    }
    setEnabled(isEnabled);
  };

  const handleLeftClick = () => {
    sendClickToNutJS(CLICK_TYPE.LEFT);
  };

  const handleRightClick = () => {
    sendClickToNutJS(CLICK_TYPE.RIGHT);
  };

  const handleDoubleClick = () => {
    sendClickToNutJS(CLICK_TYPE.DOUBLE);
  };

  const handleSetTopLeft = () => {
    if (!currentOrientation.current) {
      return;
    }
    socket?.emit("setTopLeft", {
      x: currentOrientation.current.quaternion[2],
      y: currentOrientation.current.quaternion[0],
    });
  };

  const handleSetBottomRight = () => {
    if (!currentOrientation.current) {
      return;
    }
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
          {enabled && (
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
            orientation={currentOrientation}
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
              <Switch.Group>
                <div className="flex flex-col items-center justify-center">
                  <Switch.Label className={"text-white"}>
                    Air Mouse
                  </Switch.Label>
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
                      } inline-block h-4 w-4 transform rounded-full  transition`}
                    />
                  </Switch>
                </div>
              </Switch.Group>

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
