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

export interface ViewerRect {
  height: number;
  left: number;
  top: number;
  width: number;
}

export interface DesktopInputLayout {
  source: ViewerRect;
  visual: ViewerRect;
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

function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function getDesktopInputLayout(
  source: ViewerRect,
  frame: ViewerRect,
  rotation: DesktopRotation,
): DesktopInputLayout {
  const outputWidth = rotation % 180 === 0 ? source.width : source.height;
  const outputHeight = rotation % 180 === 0 ? source.height : source.width;
  const scale = outputWidth > 0 && outputHeight > 0 ? Math.min(frame.width / outputWidth, frame.height / outputHeight) : 0;
  const visualWidth = outputWidth * scale;
  const visualHeight = outputHeight * scale;

  return {
    source,
    visual: {
      height: visualHeight,
      left: frame.left + (frame.width - visualWidth) / 2,
      top: frame.top + (frame.height - visualHeight) / 2,
      width: visualWidth,
    },
  };
}

export function mapVisualClientPointToSource(
  point: NormalizedPoint,
  layout: DesktopInputLayout,
  rotation: DesktopRotation,
): NormalizedPoint {
  const visualX = clampUnit(point.x);
  const visualY = clampUnit(point.y);
  const remotePoint = mapRotatedPointToRemote({ x: visualX, y: visualY }, rotation);

  return {
    x: layout.source.left + remotePoint.x * layout.source.width,
    y: layout.source.top + remotePoint.y * layout.source.height,
  };
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
