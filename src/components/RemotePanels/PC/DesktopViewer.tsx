import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { faDesktop, faKeyboard, faRotateRight, faEye, faGamepad, faRotate } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useRef, useState } from "react";

import ModalCloseButton from "@/components/UI/ModalCloseButton";
import { MODAL_INSET } from "@/utilities/modalClasses";
import {
  getDesktopViewerWebSocketUrl,
  getKeyboardKeysym,
  getKeyboardInputDelta,
  getNextDesktopRotation,
  mapRotatedPointToRemote,
} from "./desktopViewerLogic";
import type { DesktopRotation } from "./desktopViewerLogic";
import type RFB from "@novnc/novnc";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const BACKSPACE_KEYSYM = 0xff08;
const ENTER_KEYSYM = 0xff0d;
const ESCAPE_KEYSYM = 0xff1b;
const TAB_KEYSYM = 0xff09;
const CONNECTED_STATUS = "connected";
const CONNECTION_TIMEOUT_MS = 15_000;

type ViewerStatus = "idle" | "loading" | "connecting" | "connected" | "credentials" | "disconnected" | "error" | "demo";

interface CredentialFormState {
  password: string;
  username: string;
}

interface Props {
  className?: string;
}

interface ViewerFrameSize {
  height: number;
  width: number;
}

function stopTouchPropagation(event: React.TouchEvent<HTMLDivElement>) {
  event.stopPropagation();
}

function clampNormalizedCoordinate(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function getRotatedClientPoint(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
  rotation: DesktopRotation,
): { clientX: number; clientY: number } {
  const bounds = canvas.getBoundingClientRect();
  if (bounds.width === 0 || bounds.height === 0) return { clientX, clientY };

  const visualPoint = {
    x: clampNormalizedCoordinate((clientX - bounds.left) / bounds.width),
    y: clampNormalizedCoordinate((clientY - bounds.top) / bounds.height),
  };
  const remotePoint = mapRotatedPointToRemote(visualPoint, rotation);
  return {
    clientX: bounds.left + clampNormalizedCoordinate(remotePoint.x) * bounds.width,
    clientY: bounds.top + clampNormalizedCoordinate(remotePoint.y) * bounds.height,
  };
}

function attachRotatedInput(canvas: HTMLCanvasElement, getRotation: () => DesktopRotation): () => void {
  const syntheticEvents = new WeakSet<Event>();

  function handleMouseEvent(event: Event) {
    const rotation = getRotation();
    if (rotation === 0 || syntheticEvents.has(event)) return;
    const mouseEvent = event as MouseEvent;
    const point = getRotatedClientPoint(canvas, mouseEvent.clientX, mouseEvent.clientY, rotation);
    const syntheticEvent = new MouseEvent(event.type, {
      altKey: mouseEvent.altKey,
      bubbles: true,
      button: mouseEvent.button,
      buttons: mouseEvent.buttons,
      cancelable: true,
      clientX: point.clientX,
      clientY: point.clientY,
      ctrlKey: mouseEvent.ctrlKey,
      detail: mouseEvent.detail,
      metaKey: mouseEvent.metaKey,
      screenX: mouseEvent.screenX,
      screenY: mouseEvent.screenY,
      shiftKey: mouseEvent.shiftKey,
      view: window,
    });
    syntheticEvents.add(syntheticEvent);
    event.preventDefault();
    event.stopImmediatePropagation();
    canvas.dispatchEvent(syntheticEvent);
  }

  function mapTouches(touches: TouchList): Touch[] {
    const mapped: Touch[] = [];
    for (let index = 0; index < touches.length; index += 1) {
      const touch = touches.item(index);
      if (!touch) continue;
      const point = getRotatedClientPoint(canvas, touch.clientX, touch.clientY, getRotation());
      mapped.push(
        new Touch({
          clientX: point.clientX,
          clientY: point.clientY,
          force: touch.force,
          identifier: touch.identifier,
          pageX: touch.pageX,
          pageY: touch.pageY,
          radiusX: touch.radiusX,
          radiusY: touch.radiusY,
          rotationAngle: touch.rotationAngle,
          screenX: touch.screenX,
          screenY: touch.screenY,
          target: canvas,
        }),
      );
    }
    return mapped;
  }

  function handleTouchEvent(event: Event) {
    const rotation = getRotation();
    if (rotation === 0 || syntheticEvents.has(event)) return;
    const touchEvent = event as TouchEvent;
    const syntheticEvent = new TouchEvent(event.type, {
      bubbles: true,
      cancelable: true,
      changedTouches: mapTouches(touchEvent.changedTouches),
      targetTouches: mapTouches(touchEvent.targetTouches),
      touches: mapTouches(touchEvent.touches),
      view: window,
    });
    syntheticEvents.add(syntheticEvent);
    event.preventDefault();
    event.stopImmediatePropagation();
    canvas.dispatchEvent(syntheticEvent);
  }

  function handleWheelEvent(event: Event) {
    const rotation = getRotation();
    if (rotation === 0 || syntheticEvents.has(event)) return;
    const wheelEvent = event as WheelEvent;
    const point = getRotatedClientPoint(canvas, wheelEvent.clientX, wheelEvent.clientY, rotation);
    const syntheticEvent = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      clientX: point.clientX,
      clientY: point.clientY,
      deltaMode: wheelEvent.deltaMode,
      deltaX: wheelEvent.deltaX,
      deltaY: wheelEvent.deltaY,
      deltaZ: wheelEvent.deltaZ,
      view: window,
    });
    syntheticEvents.add(syntheticEvent);
    event.preventDefault();
    event.stopImmediatePropagation();
    canvas.dispatchEvent(syntheticEvent);
  }

  const mouseEvents = ["mousedown", "mouseup", "mousemove", "click", "contextmenu"];
  const touchEvents = ["touchstart", "touchmove", "touchend", "touchcancel"];
  const wheelEvent = "wheel";
  mouseEvents.forEach((type) => canvas.addEventListener(type, handleMouseEvent, true));
  touchEvents.forEach((type) => canvas.addEventListener(type, handleTouchEvent, true));
  canvas.addEventListener(wheelEvent, handleWheelEvent, true);

  return () => {
    mouseEvents.forEach((type) => canvas.removeEventListener(type, handleMouseEvent, true));
    touchEvents.forEach((type) => canvas.removeEventListener(type, handleTouchEvent, true));
    canvas.removeEventListener(wheelEvent, handleWheelEvent, true);
  };
}

function statusLabel(status: ViewerStatus): string {
  switch (status) {
    case "loading":
      return "Loading viewer…";
    case "connecting":
      return "Connecting to HTPC…";
    case CONNECTED_STATUS:
      return "Connected";
    case "credentials":
      return "Credentials required";
    case "disconnected":
      return "Disconnected";
    case "error":
      return "Connection failed";
    case "demo":
      return "Demo mode";
    default:
      return "Ready to connect";
  }
}

function DesktopViewer({ className = "" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [connectAttempt, setConnectAttempt] = useState(0);
  const [status, setStatus] = useState<ViewerStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [desktopName, setDesktopName] = useState("");
  const [viewOnly, setViewOnly] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [keyboardText, setKeyboardText] = useState("");
  const [rotation, setRotation] = useState<DesktopRotation>(0);
  const [viewerFrameSize, setViewerFrameSize] = useState<ViewerFrameSize>({ height: 0, width: 0 });
  const [credentialTypes, setCredentialTypes] = useState<string[]>(["password"]);
  const [credentials, setCredentials] = useState<CredentialFormState>({ password: "", username: "" });

  const [viewerTarget, setViewerTarget] = useState<HTMLDivElement | null>(null);
  const viewerFrameRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<RFB | null>(null);
  const viewOnlyRef = useRef(false);
  const rotationRef = useRef<DesktopRotation>(0);
  const securityFailureReasonRef = useRef("");
  const connectionDeadlineRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionTimedOutRef = useRef(false);
  const keyboardInputRef = useRef<HTMLInputElement>(null);

  const setViewerTargetNode = useCallback((element: HTMLDivElement | null) => {
    setViewerTarget(element);
  }, []);

  useEffect(() => {
    if (!isOpen || !viewerTarget) return;

    let cancelled = false;
    const target = viewerTarget;
    setErrorMessage("");
    setDesktopName("");
    setKeyboardText("");
    securityFailureReasonRef.current = "";
    connectionTimedOutRef.current = false;

    if (IS_DEMO) {
      setStatus("demo");
      return () => {
        cancelled = true;
      };
    }

    setStatus("loading");
    let detachRotatedInput = () => {};

    async function connectViewer() {
      try {
        const { default: RFB } = await import("@novnc/novnc");
        if (cancelled || connectionTimedOutRef.current) return;

        const websocketUrl = getDesktopViewerWebSocketUrl(window.location);
        const rfb = new RFB(target, websocketUrl, { shared: true });
        rfb.scaleViewport = true;
        rfb.resizeSession = false;
        rfb.showDotCursor = true;
        rfb.viewOnly = viewOnlyRef.current;

        rfb.addEventListener("connect", () => {
          if (cancelled) return;
          const canvas = target.querySelector("canvas");
          if (canvas) detachRotatedInput = attachRotatedInput(canvas, () => rotationRef.current);
          setStatus(CONNECTED_STATUS);
          setErrorMessage("");
          securityFailureReasonRef.current = "";
        });
        rfb.addEventListener("desktopname", (event) => {
          if (!cancelled) setDesktopName(event.detail.name ?? "");
        });
        rfb.addEventListener("credentialsrequired", (event) => {
          if (cancelled) return;
          setCredentialTypes(event.detail.types?.length ? event.detail.types : ["password"]);
          setCredentials({ password: "", username: "" });
          setStatus("credentials");
        });
        rfb.addEventListener("securityfailure", (event) => {
          if (cancelled) return;
          const reason = event.detail.reason || "The VNC server rejected the connection.";
          securityFailureReasonRef.current = reason;
          setStatus("error");
          setErrorMessage(reason);
        });
        rfb.addEventListener("disconnect", (event) => {
          if (cancelled) return;
          if (connectionTimedOutRef.current) {
            setStatus("error");
            setErrorMessage(securityFailureReasonRef.current || "The desktop connection timed out.");
            return;
          }
          setStatus(event.detail.clean ? "disconnected" : "error");
          if (!event.detail.clean) {
            setErrorMessage(
              securityFailureReasonRef.current || event.detail.reason || "The desktop connection closed unexpectedly.",
            );
          }
        });

        rfbRef.current = rfb;
        setStatus("connecting");
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Unable to load the desktop viewer.");
      }
    }

    void connectViewer();

    return () => {
      cancelled = true;
      detachRotatedInput();
      connectionTimedOutRef.current = true;
      if (connectionDeadlineRef.current) {
        clearTimeout(connectionDeadlineRef.current);
        connectionDeadlineRef.current = null;
      }
      const rfb = rfbRef.current;
      rfbRef.current = null;
      try {
        rfb?.disconnect();
      } catch {
        // The viewer may already have closed its WebSocket during unmount.
      }
      target?.replaceChildren();
    };
  }, [connectAttempt, isOpen, viewerTarget]);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    if (!isOpen || !viewerFrameRef.current) return;
    const frame = viewerFrameRef.current;
    const updateFrameSize = () => {
      const bounds = frame.getBoundingClientRect();
      setViewerFrameSize({ height: bounds.height, width: bounds.width });
    };
    const observer = new ResizeObserver(updateFrameSize);
    observer.observe(frame);
    updateFrameSize();
    return () => observer.disconnect();
  }, [isOpen]);

  useEffect(() => {
    if (status !== "loading" && status !== "connecting") return;

    connectionTimedOutRef.current = false;
    if (connectionDeadlineRef.current) clearTimeout(connectionDeadlineRef.current);
    connectionDeadlineRef.current = setTimeout(() => {
      connectionTimedOutRef.current = true;
      const message =
        "Desktop sharing did not respond. Check that the HTPC is online and desktop sharing is running, then reconnect.";
      securityFailureReasonRef.current = message;
      setStatus("error");
      setErrorMessage(message);
      try {
        rfbRef.current?.disconnect();
      } catch {
        // The viewer may already have closed its WebSocket during timeout handling.
      }
    }, CONNECTION_TIMEOUT_MS);

    return () => {
      if (connectionDeadlineRef.current) {
        clearTimeout(connectionDeadlineRef.current);
        connectionDeadlineRef.current = null;
      }
    };
  }, [status]);

  useEffect(() => {
    viewOnlyRef.current = viewOnly;
    if (rfbRef.current) rfbRef.current.viewOnly = viewOnly;
  }, [viewOnly]);

  useEffect(() => {
    if (keyboardOpen) keyboardInputRef.current?.focus();
  }, [keyboardOpen]);

  useEffect(() => {
    if (isOpen && !viewOnly && status === CONNECTED_STATUS) return;
    setKeyboardOpen(false);
    setKeyboardText("");
  }, [isOpen, status, viewOnly]);

  function closeViewer() {
    setIsOpen(false);
    setKeyboardOpen(false);
    setKeyboardText("");
    setCredentials({ password: "", username: "" });
  }

  const targetWidth =
    viewerFrameSize.width > 0
      ? rotation % 180 === 0
        ? viewerFrameSize.width
        : viewerFrameSize.height
      : null;
  const targetHeight =
    viewerFrameSize.height > 0
      ? rotation % 180 === 0
        ? viewerFrameSize.height
        : viewerFrameSize.width
      : null;

  function reconnect() {
    setStatus("loading");
    setErrorMessage("");
    setConnectAttempt((attempt) => attempt + 1);
  }

  function sendKey(keysym: number, code: string | null = null) {
    if (viewOnly || status !== CONNECTED_STATUS) return;
    const rfb = rfbRef.current;
    if (!rfb) return;
    rfb.sendKey(keysym, code, true);
    rfb.sendKey(keysym, code, false);
  }

  function sendText(text: string) {
    for (const character of Array.from(text)) {
      sendKey(getKeyboardKeysym(character));
    }
  }

  function handleKeyboardChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextText = event.currentTarget.value;
    const delta = getKeyboardInputDelta(keyboardText, nextText);
    for (let index = 0; index < delta.backspaces; index += 1) {
      sendKey(BACKSPACE_KEYSYM, "Backspace");
    }
    sendText(delta.text);
    setKeyboardText(nextText);
  }

  function handleKeyboardKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "Enter":
        event.preventDefault();
        sendKey(ENTER_KEYSYM, "Enter");
        setKeyboardText("");
        break;
      case "Escape":
        event.preventDefault();
        sendKey(ESCAPE_KEYSYM, "Escape");
        setKeyboardOpen(false);
        setKeyboardText("");
        break;
      case "Tab":
        event.preventDefault();
        sendKey(TAB_KEYSYM, "Tab");
        break;
      case "Backspace":
        if (keyboardText.length === 0) {
          event.preventDefault();
          sendKey(BACKSPACE_KEYSYM, "Backspace");
        }
        break;
      default:
        break;
    }
  }

  function submitCredentials(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rfb = rfbRef.current;
    if (!rfb) return;
    const nextCredentials: { password?: string; username?: string } = {};
    if (credentialTypes.includes("password")) nextCredentials.password = credentials.password;
    if (credentialTypes.includes("username")) nextCredentials.username = credentials.username;
    rfb.sendCredentials(nextCredentials);
    setCredentials({ password: "", username: "" });
    setStatus("connecting");
  }

  return (
    <>
      <button
        type="button"
        className={`btn btn-primary-pc flex items-center justify-center gap-2 ${className}`}
        onClick={() => setIsOpen(true)}
        aria-label="Open HTPC desktop viewer"
      >
        <FontAwesomeIcon icon={faDesktop} />
        Desktop
      </button>

      <Dialog open={isOpen} onClose={closeViewer} className="relative z-50">
        <div className={`${MODAL_INSET} z-50 bg-black/75`} />
        <div
          className={`${MODAL_INSET} z-50 overflow-y-auto overscroll-contain`}
          onTouchStart={stopTouchPropagation}
          onTouchMove={stopTouchPropagation}
          onTouchEnd={stopTouchPropagation}
        >
          <div className="flex min-h-full items-center justify-center p-3 text-left">
            <DialogPanel
              className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-950 text-slate-100 shadow-2xl"
              onTouchStart={stopTouchPropagation}
              onTouchMove={stopTouchPropagation}
              onTouchEnd={stopTouchPropagation}
            >
              <ModalCloseButton onClick={closeViewer} ariaLabel="Close desktop viewer" className="!right-3 !top-3" />
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3 pr-12">
                <div className="min-w-0">
                  <DialogTitle as="h2" className="truncate text-lg font-semibold text-slate-50">
                    HTPC Desktop
                  </DialogTitle>
                  <p className="truncate text-xs text-slate-400">
                    {desktopName || statusLabel(status)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                    status === CONNECTED_STATUS
                      ? "bg-emerald-900/70 text-emerald-300"
                      : status === "error"
                        ? "bg-red-900/70 text-red-300"
                        : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {statusLabel(status)}
                </span>
              </div>

              <div
                ref={viewerFrameRef}
                className="relative h-[min(62vh,34rem)] min-h-[16rem] w-full overflow-hidden bg-black sm:min-h-[24rem]"
              >
                <div
                  ref={setViewerTargetNode}
                  className="absolute left-1/2 top-1/2 touch-none overflow-hidden bg-black"
                  aria-label="Remote desktop display"
                  style={{
                    height: targetHeight ? `${targetHeight}px` : "100%",
                    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                    width: targetWidth ? `${targetWidth}px` : "100%",
                  }}
                />
                {(status === "loading" || status === "connecting") && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 px-6 text-center text-sm text-slate-300">
                    {statusLabel(status)}
                  </div>
                )}
                {status === "demo" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 px-6 text-center">
                    <FontAwesomeIcon icon={faGamepad} className="text-3xl text-blue-400" />
                    <p className="font-semibold text-blue-200">Desktop viewer unavailable in demo mode</p>
                    <p className="max-w-md text-sm text-slate-400">
                      A real HTPC connection is intentionally disabled in the public simulator.
                    </p>
                  </div>
                )}
                {status === "error" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 px-6 text-center">
                    <p className="font-semibold text-red-300">Unable to connect</p>
                    <p className="max-w-xl text-sm text-slate-400">{errorMessage}</p>
                    <button type="button" className="btn btn-secondary inline-flex items-center gap-2" onClick={reconnect}>
                      <FontAwesomeIcon icon={faRotateRight} />
                      Reconnect
                    </button>
                  </div>
                )}
                {status === "disconnected" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 px-6 text-center">
                    <p className="font-semibold text-slate-200">Desktop disconnected</p>
                    <button type="button" className="btn btn-secondary inline-flex items-center gap-2" onClick={reconnect}>
                      <FontAwesomeIcon icon={faRotateRight} />
                      Reconnect
                    </button>
                  </div>
                )}
                {status === "credentials" && (
                  <form
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/95 px-6"
                    onSubmit={submitCredentials}
                  >
                    <p className="font-semibold text-slate-100">Credentials required</p>
                    {credentialTypes.includes("username") && (
                      <input
                        type="text"
                        autoComplete="username"
                        value={credentials.username}
                        onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))}
                        placeholder="Username"
                        className="w-full max-w-xs rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                      />
                    )}
                    {credentialTypes.includes("password") && (
                      <input
                        type="password"
                        autoFocus
                        autoComplete="current-password"
                        value={credentials.password}
                        onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                        placeholder="Password"
                        className="w-full max-w-xs rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                      />
                    )}
                    <button type="submit" className="btn btn-primary-pc">Continue</button>
                  </form>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 bg-slate-900/80 p-3">
                <div className="flex items-center gap-1" role="group" aria-label="Desktop input mode">
                  <button
                    type="button"
                    className={`btn inline-flex items-center gap-2 ${viewOnly ? "btn-secondary" : "btn-primary-pc"}`}
                    onClick={() => setViewOnly(false)}
                    aria-pressed={!viewOnly}
                    disabled={status !== CONNECTED_STATUS}
                  >
                    Control
                  </button>
                  <button
                    type="button"
                    className={`btn inline-flex items-center gap-2 ${viewOnly ? "btn-primary-pc" : "btn-secondary"}`}
                    onClick={() => setViewOnly(true)}
                    aria-pressed={viewOnly}
                    disabled={status !== CONNECTED_STATUS}
                  >
                    <FontAwesomeIcon icon={faEye} />
                    View only
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary inline-flex items-center gap-2"
                  onClick={() => setKeyboardOpen((current) => !current)}
                  disabled={viewOnly || status !== CONNECTED_STATUS}
                  aria-pressed={keyboardOpen}
                >
                  <FontAwesomeIcon icon={faKeyboard} />
                  Keyboard
                </button>
                {keyboardOpen && (
                  <input
                    ref={keyboardInputRef}
                    type="text"
                    value={keyboardText}
                    onKeyDown={handleKeyboardKeyDown}
                    onChange={handleKeyboardChange}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="Type on HTPC…"
                    aria-label="Type on HTPC"
                    className="min-w-[12rem] flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                  />
                )}
                <button
                  type="button"
                  className="btn btn-secondary inline-flex items-center gap-2"
                  onClick={() => setRotation((current) => getNextDesktopRotation(current))}
                  disabled={status !== CONNECTED_STATUS}
                  aria-label={`Rotate desktop screen to ${getNextDesktopRotation(rotation)} degrees`}
                >
                  <FontAwesomeIcon icon={faRotate} />
                  Rotate {rotation}°
                </button>
                <button
                  type="button"
                  className="btn btn-secondary ml-auto inline-flex items-center gap-2"
                  onClick={reconnect}
                  disabled={IS_DEMO || status === "loading" || status === "connecting"}
                >
                  <FontAwesomeIcon icon={faRotateRight} />
                  Reconnect
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
}

export default DesktopViewer;
