import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { faDesktop, faKeyboard, faRotateRight, faEye, faEyeSlash, faGamepad, faRotate } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useRef, useState } from "react";

import ModalCloseButton from "@/components/UI/ModalCloseButton";
import { MODAL_INSET } from "@/utilities/modalClasses";
import {
  getDesktopViewerWebSocketUrl,
  getKeyboardKeysym,
  getKeyboardInputDelta,
  getNextDesktopRotation,
} from "./desktopViewerLogic";
import type { DesktopRotation } from "./desktopViewerLogic";
import { attachRotatedDesktopInput, renderRotatedDesktopFrame } from "./desktopViewerInput";
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

function stopTouchPropagation(event: React.TouchEvent<HTMLDivElement>) {
  event.stopPropagation();
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
  const [controlsOpen, setControlsOpen] = useState(true);
  const [rotation, setRotation] = useState<DesktopRotation>(0);
  const [credentialTypes, setCredentialTypes] = useState<string[]>(["password"]);
  const [credentials, setCredentials] = useState<CredentialFormState>({ password: "", username: "" });

  const [viewerTarget, setViewerTarget] = useState<HTMLDivElement | null>(null);
  const viewerFrameRef = useRef<HTMLDivElement>(null);
  const visualCanvasRef = useRef<HTMLCanvasElement>(null);
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
    let animationFrame: number | null = null;

    function stopFrameMirror() {
      detachRotatedInput();
      detachRotatedInput = () => {};
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    }

    function startFrameMirror(sourceCanvas: HTMLCanvasElement) {
      const visualCanvas = visualCanvasRef.current;
      const frame = viewerFrameRef.current;
      if (!visualCanvas || !frame) return;

      detachRotatedInput = attachRotatedDesktopInput(sourceCanvas, visualCanvas, frame, () => rotationRef.current);
      const drawFrame = () => {
        if (cancelled) return;
        renderRotatedDesktopFrame(sourceCanvas, visualCanvas, frame, rotationRef.current);
        animationFrame = requestAnimationFrame(drawFrame);
      };
      drawFrame();
    }

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
          if (canvas) startFrameMirror(canvas);
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
          stopFrameMirror();
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
      stopFrameMirror();
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
    setControlsOpen(true);
    setKeyboardOpen(false);
    setKeyboardText("");
    setCredentials({ password: "", username: "" });
  }

  function toggleControls() {
    if (controlsOpen) {
      setKeyboardOpen(false);
      setKeyboardText("");
    }
    setControlsOpen((current) => !current);
  }

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
          className={`${MODAL_INSET} z-50 overflow-hidden overscroll-none`}
          onTouchStart={stopTouchPropagation}
          onTouchMove={stopTouchPropagation}
          onTouchEnd={stopTouchPropagation}
        >
          <div className="flex h-full min-h-[100dvh] w-full text-left">
            <DialogPanel
              className="relative flex h-[100dvh] min-h-0 max-h-[100dvh] w-full max-w-none flex-col overflow-hidden bg-slate-950 text-slate-100 shadow-2xl"
              onTouchStart={stopTouchPropagation}
              onTouchMove={stopTouchPropagation}
              onTouchEnd={stopTouchPropagation}
            >
              <DialogTitle as="h2" className="sr-only">
                HTPC Desktop
              </DialogTitle>
              <ModalCloseButton
                onClick={closeViewer}
                ariaLabel="Close desktop viewer"
                className="!right-[calc(0.75rem+env(safe-area-inset-right))] !top-[calc(0.75rem+env(safe-area-inset-top))] !h-10 !w-10 !bg-red-700/70 hover:!bg-red-600/85"
              />

              <div
                ref={viewerFrameRef}
                className="relative h-full min-h-0 w-full flex-1 overflow-hidden bg-black"
              >
                <div
                  ref={setViewerTargetNode}
                  className="pointer-events-none absolute inset-0 touch-none overflow-hidden bg-black opacity-0"
                  aria-hidden="true"
                />
                <canvas
                  ref={visualCanvasRef}
                  className="absolute inset-0 h-full w-full touch-none"
                  aria-label="Remote desktop display"
                  style={{ cursor: "crosshair" }}
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

                {controlsOpen && (
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-30 px-[calc(0.5rem+env(safe-area-inset-left))] pt-[calc(0.5rem+env(safe-area-inset-top))] pr-[calc(6.75rem+env(safe-area-inset-right))]">
                    <div className="pointer-events-none flex items-center justify-between gap-2 rounded-b-xl border border-slate-200/20 bg-slate-950/25 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-50">HTPC Desktop</p>
                        <p className="truncate text-xs text-slate-400">{desktopName || statusLabel(status)}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                          status === CONNECTED_STATUS
                            ? "bg-emerald-900/35 text-emerald-200"
                            : status === "error"
                              ? "bg-red-900/40 text-red-200"
                              : "bg-slate-800/40 text-slate-200"
                        }`}
                      >
                        {statusLabel(status)}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn-secondary absolute right-[calc(3.75rem+env(safe-area-inset-right))] top-[calc(0.75rem+env(safe-area-inset-top))] z-50 inline-flex min-h-10 min-w-10 items-center justify-center gap-1 bg-slate-600/50 px-2 py-1 text-xs hover:bg-slate-500/70"
                  onClick={toggleControls}
                  aria-expanded={controlsOpen}
                  aria-label={controlsOpen ? "Hide desktop viewer controls" : "Show desktop viewer controls"}
                  title={controlsOpen ? "Hide desktop viewer controls" : "Show desktop viewer controls"}
                >
                  <FontAwesomeIcon icon={controlsOpen ? faEyeSlash : faEye} />
                  <span className="hidden sm:inline">{controlsOpen ? "Hide" : "Show"}</span>
                  <span className="sr-only"> controls</span>
                </button>

                {controlsOpen && status === CONNECTED_STATUS && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-[calc(0.5rem+env(safe-area-inset-left))] pb-[calc(0.5rem+env(safe-area-inset-bottom))] pr-[calc(0.5rem+env(safe-area-inset-right))] pt-8">
                    <div className="pointer-events-none flex flex-wrap items-center gap-1 rounded-xl border border-slate-200/20 bg-slate-950/25 p-2">
                      <div className="flex items-center gap-1" role="group" aria-label="Desktop input mode">
                        <button
                          type="button"
                          className={`btn pointer-events-auto inline-flex min-h-10 min-w-10 items-center justify-center gap-1 px-2 py-1 text-xs ${viewOnly ? "btn-secondary bg-slate-600/50 hover:bg-slate-500/70" : "btn-primary-pc bg-blue-600/70 hover:bg-blue-500/80"}`}
                          onClick={() => setViewOnly(false)}
                          aria-pressed={!viewOnly}
                        >
                          Control
                        </button>
                        <button
                          type="button"
                          className={`btn pointer-events-auto inline-flex min-h-10 min-w-10 items-center justify-center gap-1 px-2 py-1 text-xs ${viewOnly ? "btn-primary-pc bg-blue-600/70 hover:bg-blue-500/80" : "btn-secondary bg-slate-600/50 hover:bg-slate-500/70"}`}
                          onClick={() => setViewOnly(true)}
                          aria-pressed={viewOnly}
                        >
                          <FontAwesomeIcon icon={faEye} />
                          View only
                        </button>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary pointer-events-auto inline-flex min-h-10 min-w-10 items-center justify-center gap-1 bg-slate-600/50 px-2 py-1 text-xs hover:bg-slate-500/70"
                        onClick={() => setKeyboardOpen((current) => !current)}
                        disabled={viewOnly}
                        aria-pressed={keyboardOpen}
                      >
                        <FontAwesomeIcon icon={faKeyboard} />
                        Keyboard
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary pointer-events-auto inline-flex min-h-10 min-w-10 items-center justify-center gap-1 bg-slate-600/50 px-2 py-1 text-xs hover:bg-slate-500/70"
                        onClick={() => setRotation((current) => getNextDesktopRotation(current))}
                        aria-label={`Rotate desktop screen to ${getNextDesktopRotation(rotation)} degrees`}
                      >
                        <FontAwesomeIcon icon={faRotate} />
                        Rotate {rotation}°
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary pointer-events-auto ml-auto inline-flex min-h-10 min-w-10 items-center justify-center gap-1 bg-slate-600/50 px-2 py-1 text-xs hover:bg-slate-500/70"
                        onClick={reconnect}
                        disabled={IS_DEMO}
                      >
                        <FontAwesomeIcon icon={faRotateRight} />
                        Reconnect
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
                          className="pointer-events-auto order-last basis-full rounded-lg border border-slate-200/25 bg-slate-950/45 px-3 py-1.5 text-sm text-white outline-none focus:border-blue-300"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
}

export default DesktopViewer;
