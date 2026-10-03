export interface DesktopViewerLocation {
  origin: string;
  protocol: string;
}

export interface KeyboardInputDelta {
  backspaces: number;
  text: string;
}

export function getKeyboardKeysym(character: string): number {
  const codePoint = character.codePointAt(0);
  if (codePoint === undefined) return 0;
  return codePoint <= 0xff ? codePoint : 0x01000000 + codePoint;
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
