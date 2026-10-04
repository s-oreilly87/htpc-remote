export interface DesktopViewerLocation {
  origin: string;
  protocol: string;
}

export interface KeyboardInputDelta {
  backspaces: number;
  text: string;
}

export type DesktopRotation = 0 | 90 | 180 | 270;

export interface NormalizedPoint {
  x: number;
  y: number;
}

export function getKeyboardKeysym(character: string): number {
  const codePoint = character.codePointAt(0);
  if (codePoint === undefined) return 0;
  return codePoint <= 0xff ? codePoint : 0x01000000 + codePoint;
}

export function getNextDesktopRotation(rotation: DesktopRotation): DesktopRotation {
  return rotation === 270 ? 0 : ((rotation + 90) as DesktopRotation);
}

export function mapRotatedPointToRemote(point: NormalizedPoint, rotation: DesktopRotation): NormalizedPoint {
  switch (rotation) {
    case 90:
      return { x: point.y, y: 1 - point.x };
    case 180:
      return { x: 1 - point.x, y: 1 - point.y };
    case 270:
      return { x: 1 - point.y, y: point.x };
    default:
      return point;
  }
}

export function getDesktopViewerWebSocketUrl(
  location: DesktopViewerLocation,
  path = "/desktop/websockify",
): string {
  const url = new URL(path, location.origin);
  url.protocol = location.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

export function getKeyboardInputDelta(
  previous: string,
  next: string,
): KeyboardInputDelta {
  const previousCharacters = Array.from(previous);
  const nextCharacters = Array.from(next);
  let sharedPrefixLength = 0;

  while (
    sharedPrefixLength < previousCharacters.length &&
    sharedPrefixLength < nextCharacters.length &&
    previousCharacters[sharedPrefixLength] === nextCharacters[sharedPrefixLength]
  ) {
    sharedPrefixLength += 1;
  }

  return {
    backspaces: previousCharacters.length - sharedPrefixLength,
    text: nextCharacters.slice(sharedPrefixLength).join(""),
  };
}
