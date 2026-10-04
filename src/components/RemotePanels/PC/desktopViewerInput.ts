import {
  getDesktopInputLayout,
  mapVisualClientPointToSource,
} from "./desktopViewerLogic";
import type { DesktopInputLayout, DesktopRotation, ViewerRect } from "./desktopViewerLogic";

function getRect(element: HTMLElement): ViewerRect {
  const bounds = element.getBoundingClientRect();
  return {
    height: bounds.height,
    left: bounds.left,
    top: bounds.top,
    width: bounds.width,
  };
}

function getMappedClientPoint(
  clientX: number,
  clientY: number,
  layout: DesktopInputLayout,
  rotation: DesktopRotation,
): { clientX: number; clientY: number } {
  const visual = layout.visual;
  const point = {
    x: (clientX - visual.left) / visual.width,
    y: (clientY - visual.top) / visual.height,
  };
  const source = mapVisualClientPointToSource(point, layout, rotation);
  return { clientX: source.x, clientY: source.y };
}

function getLayout(
  sourceCanvas: HTMLCanvasElement,
  frame: HTMLElement,
  rotation: DesktopRotation,
): DesktopInputLayout {
  return getDesktopInputLayout(getRect(sourceCanvas), getRect(frame), rotation);
}

export function renderRotatedDesktopFrame(
  sourceCanvas: HTMLCanvasElement,
  visualCanvas: HTMLCanvasElement,
  frame: HTMLElement,
  rotation: DesktopRotation,
): DesktopInputLayout | null {
  const layout = getLayout(sourceCanvas, frame, rotation);
  if (layout.source.width === 0 || layout.source.height === 0 || layout.visual.width === 0 || layout.visual.height === 0) {
    return null;
  }

  const frameRect = getRect(frame);
  const devicePixelRatio = window.devicePixelRatio || 1;
  const canvasWidth = Math.max(1, Math.round(frameRect.width * devicePixelRatio));
  const canvasHeight = Math.max(1, Math.round(frameRect.height * devicePixelRatio));
  if (visualCanvas.width !== canvasWidth || visualCanvas.height !== canvasHeight) {
    visualCanvas.width = canvasWidth;
    visualCanvas.height = canvasHeight;
  }

  const context = visualCanvas.getContext("2d");
  if (!context) return layout;
  const centerX = (layout.visual.left - frameRect.left + layout.visual.width / 2) * devicePixelRatio;
  const centerY = (layout.visual.top - frameRect.top + layout.visual.height / 2) * devicePixelRatio;
  const sourceWidth = layout.source.width * devicePixelRatio;
  const sourceHeight = layout.source.height * devicePixelRatio;
  const angle = (rotation * Math.PI) / 180;
  const scale = layout.visual.width / (rotation % 180 === 0 ? layout.source.width : layout.source.height);

  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.fillStyle = "#000";
  context.fillRect(0, 0, canvasWidth, canvasHeight);
  context.save();
  context.translate(centerX, centerY);
  context.rotate(angle);
  context.drawImage(
    sourceCanvas,
    (-sourceWidth * scale) / 2,
    (-sourceHeight * scale) / 2,
    sourceWidth * scale,
    sourceHeight * scale,
  );
  context.restore();
  return layout;
}

export function attachRotatedDesktopInput(
  sourceCanvas: HTMLCanvasElement,
  visualCanvas: HTMLCanvasElement,
  frame: HTMLElement,
  getRotation: () => DesktopRotation,
): () => void {
  const syntheticEvents = new WeakSet<Event>();
  let dragging = false;

  function getCurrentLayout() {
    return getLayout(sourceCanvas, frame, getRotation());
  }

  function mapMouseEvent(event: MouseEvent, layout: DesktopInputLayout, rotation: DesktopRotation): MouseEvent {
    const point = getMappedClientPoint(event.clientX, event.clientY, layout, rotation);
    return new MouseEvent(event.type, {
      altKey: event.altKey,
      bubbles: true,
      button: event.button,
      buttons: event.buttons,
      cancelable: true,
      clientX: point.clientX,
      clientY: point.clientY,
      ctrlKey: event.ctrlKey,
      detail: event.detail,
      metaKey: event.metaKey,
      screenX: event.screenX,
      screenY: event.screenY,
      shiftKey: event.shiftKey,
      view: window,
    });
  }

  function dispatchMappedMouseEvent(event: MouseEvent, target: HTMLCanvasElement) {
    const mappedEvent = mapMouseEvent(event, getCurrentLayout(), getRotation());
    syntheticEvents.add(mappedEvent);
    event.preventDefault();
    event.stopImmediatePropagation();
    target.dispatchEvent(mappedEvent);
  }

  function handleVisualMouseEvent(event: Event) {
    dispatchMappedMouseEvent(event as MouseEvent, sourceCanvas);
    if (event.type === "mousedown") dragging = true;
    if (event.type === "mouseup") dragging = false;
  }

  function handleCapturedMouseEvent(event: Event) {
    if (syntheticEvents.has(event) || !dragging) return;
    dispatchMappedMouseEvent(event as MouseEvent, sourceCanvas);
    if (event.type === "mouseup") dragging = false;
  }

  function mapTouches(touches: TouchList, layout: DesktopInputLayout, rotation: DesktopRotation): Touch[] {
    const mapped: Touch[] = [];
    for (let index = 0; index < touches.length; index += 1) {
      const touch = touches.item(index);
      if (!touch) continue;
      const point = getMappedClientPoint(touch.clientX, touch.clientY, layout, rotation);
      mapped.push(
        new Touch({
          clientX: point.clientX,
          clientY: point.clientY,
          force: touch.force,
          identifier: touch.identifier,
          pageX: point.clientX + touch.pageX - touch.clientX,
          pageY: point.clientY + touch.pageY - touch.clientY,
          radiusX: touch.radiusX,
          radiusY: touch.radiusY,
          rotationAngle: touch.rotationAngle,
          screenX: touch.screenX,
          screenY: touch.screenY,
          target: sourceCanvas,
        }),
      );
    }
    return mapped;
  }

  function handleVisualTouchEvent(event: Event) {
    const touchEvent = event as TouchEvent;
    const layout = getCurrentLayout();
    const rotation = getRotation();
    const mappedEvent = new TouchEvent(event.type, {
      bubbles: true,
      cancelable: true,
      changedTouches: mapTouches(touchEvent.changedTouches, layout, rotation),
      targetTouches: mapTouches(touchEvent.targetTouches, layout, rotation),
      touches: mapTouches(touchEvent.touches, layout, rotation),
      view: window,
    });
    syntheticEvents.add(mappedEvent);
    event.preventDefault();
    event.stopImmediatePropagation();
    sourceCanvas.dispatchEvent(mappedEvent);
  }

  function handleWheelEvent(event: Event) {
    const wheelEvent = event as WheelEvent;
    const point = getMappedClientPoint(wheelEvent.clientX, wheelEvent.clientY, getCurrentLayout(), getRotation());
    const mappedEvent = new WheelEvent("wheel", {
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
    syntheticEvents.add(mappedEvent);
    event.preventDefault();
    event.stopImmediatePropagation();
    sourceCanvas.dispatchEvent(mappedEvent);
  }

  const mouseEvents = ["mousedown", "mouseup", "mousemove", "click", "contextmenu"];
  const touchEvents = ["touchstart", "touchmove", "touchend", "touchcancel"];
  mouseEvents.forEach((type) => visualCanvas.addEventListener(type, handleVisualMouseEvent, true));
  touchEvents.forEach((type) => visualCanvas.addEventListener(type, handleVisualTouchEvent, true));
  visualCanvas.addEventListener("wheel", handleWheelEvent, true);
  mouseEvents.forEach((type) => sourceCanvas.addEventListener(type, handleCapturedMouseEvent, true));

  return () => {
    mouseEvents.forEach((type) => visualCanvas.removeEventListener(type, handleVisualMouseEvent, true));
    touchEvents.forEach((type) => visualCanvas.removeEventListener(type, handleVisualTouchEvent, true));
    visualCanvas.removeEventListener("wheel", handleWheelEvent, true);
    mouseEvents.forEach((type) => sourceCanvas.removeEventListener(type, handleCapturedMouseEvent, true));
    dragging = false;
  };
}
