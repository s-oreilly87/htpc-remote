import { useEffect, useRef } from "react";

export function openPlexampAndroidApp() {
  window.location.href =
    "intent://home#Intent;scheme=plexamp-auth;package=tv.plex.labs.plexamp;end;";
}

export function openQobuzAndroidApp() {
  window.location.href =
      "intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=com.qobuz.music;end;";
}

export function useHasChanged<T>(val: T) {
  const prevVal = usePrevious(val);
  return prevVal !== val;
}

export function usePrevious<T>(value: T) {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export function getKeyByValue<T extends object>(object: T, value: unknown) {
  return Object.keys(object).find((key) => (object as Record<string, unknown>)[key] === value);
}

export function getEntryByValue<T extends { value: string }>(object: Record<string, T>, value: string) {
  return Object.entries(object).find((entry) => entry[1].value === value);
}

export function convertKebabToCamel(kebabString: string) {
  return kebabString.replace(/-([a-z])/g, function (_m, s) {
    return s.toUpperCase();
  });
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function buttonPress(
  button: HTMLButtonElement | null,
  buttonPressTimerId: number | null,
  setButtonPressTimer: (timerId: number) => void,
) {
  if (!(button instanceof HTMLButtonElement)) {
    return; // not a real button, just made a dummy object to send a request
  }

  if (buttonPressTimerId) {
    clearTimeout(buttonPressTimerId);
  }

  if (Object.hasOwn(navigator, 'vibrate')) {
      navigator.vibrate(5);
  }

  button.classList.add("text-blue-400");

  setButtonPressTimer(
    setTimeout(
      () => {
        button.classList.remove("text-blue-400");

        button.blur();
      },
      200,
      button,
    ),
  );
}
