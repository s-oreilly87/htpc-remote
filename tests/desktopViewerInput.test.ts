import assert from "node:assert/strict";
import test from "node:test";

import { attachRotatedDesktopInput } from "../src/components/RemotePanels/PC/desktopViewerInput.ts";
import {
  getDesktopInputLayout,
  mapVisualClientPointToSource,
} from "../src/components/RemotePanels/PC/desktopViewerLogic.ts";
import type { DesktopRotation, ViewerRect } from "../src/components/RemotePanels/PC/desktopViewerLogic.ts";

interface EventInitWithCoordinates {
  bubbles?: boolean;
  button?: number;
  buttons?: number;
  cancelable?: boolean;
  clientX?: number;
  clientY?: number;
  detail?: number;
  deltaMode?: number;
  deltaX?: number;
  deltaY?: number;
  deltaZ?: number;
}

class TestMouseEvent extends Event {
  readonly button: number;
  readonly buttons: number;
  readonly clientX: number;
  readonly clientY: number;
  readonly detail: number;
  readonly screenX = 0;
  readonly screenY = 0;
  readonly altKey = false;
  readonly ctrlKey = false;
  readonly metaKey = false;
  readonly shiftKey = false;

  constructor(type: string, init: EventInitWithCoordinates = {}) {
    super(type, { bubbles: init.bubbles ?? true, cancelable: init.cancelable ?? true });
    this.button = init.button ?? 0;
    this.buttons = init.buttons ?? 0;
    this.clientX = init.clientX ?? 0;
    this.clientY = init.clientY ?? 0;
    this.detail = init.detail ?? 0;
  }
}

class TestWheelEvent extends TestMouseEvent {
  readonly deltaMode: number;
  readonly deltaX: number;
  readonly deltaY: number;
  readonly deltaZ: number;

  constructor(type: string, init: EventInitWithCoordinates = {}) {
    super(type, init);
    this.deltaMode = init.deltaMode ?? 0;
    this.deltaX = init.deltaX ?? 0;
    this.deltaY = init.deltaY ?? 0;
    this.deltaZ = init.deltaZ ?? 0;
  }
}

interface TouchInit {
  clientX: number;
  clientY: number;
  identifier: number;
  pageX: number;
  pageY: number;
  target: EventTarget;
}

class TestTouch {
  readonly clientX: number;
  readonly clientY: number;
  readonly force = 1;
  readonly identifier: number;
  readonly pageX: number;
  readonly pageY: number;
  readonly radiusX = 1;
  readonly radiusY = 1;
  readonly rotationAngle = 0;
  readonly screenX = 0;
  readonly screenY = 0;
  readonly target: EventTarget;

  constructor(init: TouchInit) {
    this.clientX = init.clientX;
    this.clientY = init.clientY;
    this.identifier = init.identifier;
    this.pageX = init.pageX;
    this.pageY = init.pageY;
    this.target = init.target;
  }
}

class TestTouchList extends Array<TestTouch> {
  item(index: number): TestTouch | null {
    return this[index] ?? null;
  }
}

interface TouchEventInit {
  changedTouches: TestTouchList;
  targetTouches: TestTouchList;
  touches: TestTouchList;
}

class TestTouchEvent extends Event {
  readonly changedTouches: TestTouchList;
  readonly targetTouches: TestTouchList;
  readonly touches: TestTouchList;

  constructor(type: string, init: TouchEventInit) {
    super(type, { bubbles: true, cancelable: true });
    this.changedTouches = init.changedTouches;
    this.targetTouches = init.targetTouches;
    this.touches = init.touches;
  }
}

class TestCanvas extends EventTarget {
  width = 0;
  height = 0;
  private readonly rect: ViewerRect;

  constructor(rect: ViewerRect) {
    super();
    this.rect = rect;
  }

  getBoundingClientRect(): ViewerRect {
    return this.rect;
  }

  getContext(): null {
    return null;
  }
}

const globals = globalThis as unknown as {
  MouseEvent: typeof TestMouseEvent;
  Touch: typeof TestTouch;
  TouchEvent: typeof TestTouchEvent;
  WheelEvent: typeof TestWheelEvent;
  window: typeof globalThis;
};
globals.MouseEvent = TestMouseEvent;
globals.Touch = TestTouch;
globals.TouchEvent = TestTouchEvent;
globals.WheelEvent = TestWheelEvent;
globals.window = globalThis;

const sourceRect: ViewerRect = { left: 100, top: 50, width: 1024, height: 576 };
const frameRect: ViewerRect = { left: 0, top: 0, width: 1024, height: 768 };

function clientPoint(layout: ReturnType<typeof getDesktopInputLayout>, x: number, y: number) {
  return {
    clientX: layout.visual.left + layout.visual.width * x,
    clientY: layout.visual.top + layout.visual.height * y,
  };
}

function sourcePoint(layout: ReturnType<typeof getDesktopInputLayout>, rotation: DesktopRotation, x: number, y: number) {
  return mapVisualClientPointToSource({ x, y }, layout, rotation);
}

test("rotated bridge dispatches exact mouse down/up coordinates for every rotation", () => {
  for (const rotation of [0, 90, 180, 270] as const) {
    const source = new TestCanvas(sourceRect);
    const visual = new TestCanvas(frameRect);
    const frame = new TestCanvas(frameRect);
    const detach = attachRotatedDesktopInput(
      source as unknown as HTMLCanvasElement,
      visual as unknown as HTMLCanvasElement,
      frame as unknown as HTMLElement,
      () => rotation,
    );
    const received: Array<{ type: string; clientX: number; clientY: number }> = [];
    source.addEventListener("mousedown", (event) => {
      const mouse = event as unknown as TestMouseEvent;
      received.push({ type: event.type, clientX: mouse.clientX, clientY: mouse.clientY });
    });
    source.addEventListener("mouseup", (event) => {
      const mouse = event as unknown as TestMouseEvent;
      received.push({ type: event.type, clientX: mouse.clientX, clientY: mouse.clientY });
    });
    const layout = getDesktopInputLayout(sourceRect, frameRect, rotation);
    const start = clientPoint(layout, 0, 0);
    const end = clientPoint(layout, 1, 1);
    visual.dispatchEvent(new TestMouseEvent("mousedown", { ...start, buttons: 1 }));
    visual.dispatchEvent(new TestMouseEvent("mouseup", { ...end, buttons: 0 }));
    detach();

    const expectedStart = sourcePoint(layout, rotation, 0, 0);
    const expectedEnd = sourcePoint(layout, rotation, 1, 1);
    assert.deepEqual(received, [
      { type: "mousedown", clientX: expectedStart.x, clientY: expectedStart.y },
      { type: "mouseup", clientX: expectedEnd.x, clientY: expectedEnd.y },
    ]);
  }
});

test("capture-proxy drag events map outside-surface movement and release", () => {
  const source = new TestCanvas(sourceRect);
  const visual = new TestCanvas(frameRect);
  const frame = new TestCanvas(frameRect);
  const rotation = 90 as const;
  const detach = attachRotatedDesktopInput(
    source as unknown as HTMLCanvasElement,
    visual as unknown as HTMLCanvasElement,
    frame as unknown as HTMLElement,
    () => rotation,
  );
  const received: Array<{ type: string; clientX: number; clientY: number }> = [];
  source.addEventListener("mousedown", (event) => {
    const mouse = event as unknown as TestMouseEvent;
    received.push({ type: event.type, clientX: mouse.clientX, clientY: mouse.clientY });
  });
  source.addEventListener("mousemove", (event) => {
    const mouse = event as unknown as TestMouseEvent;
    received.push({ type: event.type, clientX: mouse.clientX, clientY: mouse.clientY });
  });
  source.addEventListener("mouseup", (event) => {
    const mouse = event as unknown as TestMouseEvent;
    received.push({ type: event.type, clientX: mouse.clientX, clientY: mouse.clientY });
  });
  const layout = getDesktopInputLayout(sourceRect, frameRect, rotation);
  const start = clientPoint(layout, 0.5, 0.5);
  visual.dispatchEvent(new TestMouseEvent("mousedown", { ...start, buttons: 1 }));
  source.dispatchEvent(new TestMouseEvent("mousemove", { clientX: -100, clientY: 900, buttons: 1 }));
  source.dispatchEvent(new TestMouseEvent("mouseup", { clientX: -100, clientY: 900, buttons: 0 }));
  detach();

  const expectedStart = sourcePoint(layout, rotation, 0.5, 0.5);
  const expectedEdge = sourcePoint(layout, rotation, 0, 1);
  assert.deepEqual(received, [
    { type: "mousedown", clientX: expectedStart.x, clientY: expectedStart.y },
    { type: "mousemove", clientX: expectedEdge.x, clientY: expectedEdge.y },
    { type: "mouseup", clientX: expectedEdge.x, clientY: expectedEdge.y },
  ]);
});

test("rotated bridge maps wheel and touch coordinates", () => {
  const source = new TestCanvas(sourceRect);
  const visual = new TestCanvas(frameRect);
  const frame = new TestCanvas(frameRect);
  const rotation = 270 as const;
  const detach = attachRotatedDesktopInput(
    source as unknown as HTMLCanvasElement,
    visual as unknown as HTMLCanvasElement,
    frame as unknown as HTMLElement,
    () => rotation,
  );
  const received: { wheel?: TestWheelEvent; touch?: TestTouchEvent } = {};
  source.addEventListener("wheel", (event) => {
    received.wheel = event as unknown as TestWheelEvent;
  });
  source.addEventListener("touchmove", (event) => {
    received.touch = event as unknown as TestTouchEvent;
  });
  const layout = getDesktopInputLayout(sourceRect, frameRect, rotation);
  const point = clientPoint(layout, 0.25, 0.75);
  visual.dispatchEvent(new TestWheelEvent("wheel", { ...point, deltaX: 2, deltaY: -3, deltaMode: 1 }));
  const touch = new TestTouch({
    clientX: point.clientX,
    clientY: point.clientY,
    identifier: 7,
    pageX: point.clientX + 10,
    pageY: point.clientY + 20,
    target: visual,
  });
  const touches = new TestTouchList(touch);
  visual.dispatchEvent(new TestTouchEvent("touchmove", { changedTouches: touches, targetTouches: touches, touches }));
  detach();

  const expected = sourcePoint(layout, rotation, 0.25, 0.75);
  assert.equal(received.wheel?.clientX, expected.x);
  assert.equal(received.wheel?.clientY, expected.y);
  assert.equal(received.wheel?.deltaX, 2);
  assert.equal(received.wheel?.deltaY, -3);
  assert.equal(received.touch?.touches[0]?.clientX, expected.x);
  assert.equal(received.touch?.touches[0]?.clientY, expected.y);
  assert.equal(received.touch?.touches[0]?.pageX, expected.x + 10);
  assert.equal(received.touch?.touches[0]?.pageY, expected.y + 20);
});

test("source events remain available for noVNC's viewOnly send gate", () => {
  const source = new TestCanvas(sourceRect);
  const visual = new TestCanvas(frameRect);
  const frame = new TestCanvas(frameRect);
  const detach = attachRotatedDesktopInput(
    source as unknown as HTMLCanvasElement,
    visual as unknown as HTMLCanvasElement,
    frame as unknown as HTMLElement,
    () => 0,
  );
  let viewOnly = true;
  let sentPackets = 0;
  source.addEventListener("mousedown", () => {
    if (!viewOnly) sentPackets += 1;
  });
  const layout = getDesktopInputLayout(sourceRect, frameRect, 0);
  const point = clientPoint(layout, 0.5, 0.5);
  visual.dispatchEvent(new TestMouseEvent("mousedown", { ...point, buttons: 1 }));
  assert.equal(sentPackets, 0);
  viewOnly = false;
  visual.dispatchEvent(new TestMouseEvent("mousedown", { ...point, buttons: 1 }));
  assert.equal(sentPackets, 1);
  detach();
});
