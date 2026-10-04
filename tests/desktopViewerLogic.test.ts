import assert from "node:assert/strict";
import test from "node:test";

import {
  getDesktopViewerWebSocketUrl,
  getKeyboardKeysym,
  getKeyboardInputDelta,
  getNextDesktopRotation,
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
