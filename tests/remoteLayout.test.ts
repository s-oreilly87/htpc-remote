import assert from "node:assert/strict";
import test from "node:test";
import {
  canFitDesktopRemotes,
  shouldAnimateRemoteChange,
  DESKTOP_REMOTE_MIN_WIDTH,
  REMOTE_AREA_GUTTER,
  REMOTE_PANEL_GAP,
  REMOTE_PANEL_WIDTH,
} from "../src/components/RemotePanels/remoteLayout.ts";

test("three full-width bordered shells fit exactly at the available-area boundary", () => {
  assert.equal(DESKTOP_REMOTE_MIN_WIDTH, 1730);
  assert.equal(
    DESKTOP_REMOTE_MIN_WIDTH - 2 * REMOTE_AREA_GUTTER - 2 * REMOTE_PANEL_GAP,
    3 * REMOTE_PANEL_WIDTH,
  );
  assert.equal(canFitDesktopRemotes(1729.99), false);
  assert.equal(canFitDesktopRemotes(1730), true);
  assert.equal(canFitDesktopRemotes(1731), true);
});

test("demo sidebar space cannot contribute to remote fitting", () => {
  const sidebarWidth = 480;
  assert.equal(canFitDesktopRemotes(2209 - sidebarWidth), false);
  assert.equal(canFitDesktopRemotes(2210 - sidebarWidth), true);
  // Widths that could hold two remotes always retain the compact layout.
  assert.equal(
    canFitDesktopRemotes(2 * REMOTE_PANEL_WIDTH + REMOTE_PANEL_GAP),
    false,
  );
});

test("layout mode changes snap while compact navigation keeps its animation", () => {
  assert.equal(shouldAnimateRemoteChange(true, false), false);
  assert.equal(shouldAnimateRemoteChange(true, true), false);
  assert.equal(shouldAnimateRemoteChange(false, true), false);
  assert.equal(shouldAnimateRemoteChange(false, false), true);
  assert.equal(shouldAnimateRemoteChange(false, null), true);
});
