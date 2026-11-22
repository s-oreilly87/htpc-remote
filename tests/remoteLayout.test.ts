import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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


test("remote body sizing follows the available viewport without fixed pixel floors", () => {
  const styles = readFileSync(
    new URL("../src/styles/globals.css", import.meta.url),
    "utf8",
  );
  const compactBody = styles.match(/\.remote-body\s*\{([\s\S]*?)\n\s*\}/)?.[1];
  const desktopBody = styles.match(
    /\.remote-area\[data-layout="desktop"\] \.remote-body\s*\{([\s\S]*?)\n\s*\}/,
  )?.[1];

  assert.ok(compactBody, "compact remote body rule exists");
  assert.ok(desktopBody, "desktop remote body rule exists");
  assert.match(compactBody, /min-height:\s*calc\(/);
  assert.match(desktopBody, /min-height:\s*calc\(/);
  assert.doesNotMatch(compactBody, /max\(\s*740px/);
  assert.doesNotMatch(desktopBody, /max\(\s*850px/);
});
