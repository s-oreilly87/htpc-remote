// Widths include each shell's border; the measured area also includes gutters.
export const REMOTE_PANEL_WIDTH = 550;
export const REMOTE_PANEL_GAP = 24;
export const REMOTE_AREA_GUTTER = 16;
export const DESKTOP_REMOTE_MIN_WIDTH =
  3 * REMOTE_PANEL_WIDTH + 2 * REMOTE_PANEL_GAP + 2 * REMOTE_AREA_GUTTER;

export function canFitDesktopRemotes(availableWidth: number): boolean {
  return availableWidth >= DESKTOP_REMOTE_MIN_WIDTH;
}
