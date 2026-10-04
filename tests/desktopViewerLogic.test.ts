import assert from "node:assert/strict";
import test from "node:test";

import {
  getDesktopInputLayout,
  getDesktopViewerWebSocketUrl,
  getKeyboardKeysym,
  getKeyboardInputDelta,
  getNextDesktopRotation,
  mapVisualClientPointToSource,
  mapRotatedPointToRemote,
} from "../src/components/RemotePanels/PC/desktopViewerLogic.ts";

test("desktop viewer uses the same-origin websockify endpoint", () => {
  assert.equal(
    getDesktopViewerWebSocketUrl({
      origin: "https://remote.example.test",
      protocol: "https:",
    }),
    "wss://remote.example.test/desktop/websockify",
  );
  assert.equal(
    getDesktopViewerWebSocketUrl({
      origin: "http://localhost:3000",
      protocol: "http:",
    }),
    "ws://localhost:3000/desktop/websockify",
  );
});

test("mobile keyboard delta preserves punctuation, spaces, and Unicode", () => {
  assert.deepEqual(getKeyboardInputDelta("", "https://192.168.1.1/a+b#c % 你好"), {
    backspaces: 0,
    text: "https://192.168.1.1/a+b#c % 你好",
  });
  assert.deepEqual(getKeyboardInputDelta("abc", "ab."), {
    backspaces: 1,
    text: ".",
  });
  assert.deepEqual(getKeyboardInputDelta("你好", "你好!"), {
    backspaces: 0,
    text: "!",
  });
  assert.deepEqual(getKeyboardInputDelta("abc", "xyz"), {
    backspaces: 3,
    text: "xyz",
  });
});

test("mobile keyboard uses direct Latin-1 keysyms and extended Unicode keysyms", () => {
  assert.equal(getKeyboardKeysym("."), 0x2e);
  assert.equal(getKeyboardKeysym("%"), 0x25);
  assert.equal(getKeyboardKeysym("é"), 0xe9);
  assert.equal(getKeyboardKeysym("你"), 0x01004f60);
});

test("desktop rotation maps visual points back to remote coordinates", () => {
  const point = { x: 0.25, y: 0.75 };
  assert.deepEqual(mapRotatedPointToRemote(point, 0), point);
  assert.deepEqual(mapRotatedPointToRemote(point, 90), { x: 0.75, y: 0.75 });
  assert.deepEqual(mapRotatedPointToRemote(point, 180), { x: 0.75, y: 0.25 });
  assert.deepEqual(mapRotatedPointToRemote(point, 270), { x: 0.25, y: 0.25 });
  assert.equal(getNextDesktopRotation(0), 90);
  assert.equal(getNextDesktopRotation(90), 180);
  assert.equal(getNextDesktopRotation(180), 270);
  assert.equal(getNextDesktopRotation(270), 0);
});

test("desktop rotation maps a non-square viewport and clamps an off-edge drag", () => {
  const source = { left: 100, top: 50, width: 1024, height: 576 };
  const frame = { left: 0, top: 0, width: 1024, height: 768 };

  for (const rotation of [0, 90, 180, 270] as const) {
    const layout = getDesktopInputLayout(source, frame, rotation);
    const topLeft = mapVisualClientPointToSource({ x: 0, y: 0 }, layout, rotation);
    const bottomRight = mapVisualClientPointToSource({ x: 1, y: 1 }, layout, rotation);
    const expectedCorners = {
      0: [
        { x: source.left, y: source.top },
        { x: source.left + source.width, y: source.top + source.height },
      ],
      90: [
        { x: source.left, y: source.top + source.height },
        { x: source.left + source.width, y: source.top },
      ],
      180: [
        { x: source.left + source.width, y: source.top + source.height },
        { x: source.left, y: source.top },
      ],
      270: [
        { x: source.left + source.width, y: source.top },
        { x: source.left, y: source.top + source.height },
      ],
    } as const;
    assert.deepEqual(topLeft, expectedCorners[rotation][0]);
    assert.deepEqual(bottomRight, expectedCorners[rotation][1]);
    assert.deepEqual(
      mapVisualClientPointToSource({ x: -1, y: 2 }, layout, rotation),
      mapVisualClientPointToSource({ x: 0, y: 1 }, layout, rotation),
    );
  }
});
