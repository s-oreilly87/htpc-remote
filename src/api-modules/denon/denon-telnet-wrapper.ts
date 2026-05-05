/**
 * Why this wrapper exists
 * -----------------------
 * `TelnetSocket` (from `telnet-stream`) is a Transform stream that sits on top of
 * a raw `net.Socket`. It strips Telnet protocol negotiation bytes (IAC sequences)
 * before emitting clean `data` events to application code. The problem is that its
 * internal event system is the same EventEmitter that application code uses. If we
 * tried to re-emit incoming data on the TelnetSocket itself (i.e.
 * `telnetSocket.emit("data", data)`) we'd trigger an infinite loop — the re-emitted
 * "data" event would be picked up by the listener we just added, which re-emits it
 * again, and so on.
 *
 * The wrapper solves this by maintaining a completely separate event registry. The
 * bridge in `denon-telnet.ts` reads raw data off the real TelnetSocket and forwards
 * it into the wrapper via `connection.emit(...)`. All application listeners (added
 * with `connection.on(...)`) live in the wrapper's registry, so `removeListener` and
 * `once` work reliably and cleanly, with no coupling to the TelnetSocket's internal
 * EventEmitter state.
 */

type Listener = (...args: unknown[]) => void;

type TelnetSocketShape = {
  destroy: () => void;
  write: (data: string) => void;
  on: (eventName: string, listener: Listener) => void;
};

export type DenonEventBus = {
  emit: (eventName: string, ...args: unknown[]) => void;
  on: (eventName: string, listener: Listener) => void;
  once: (eventName: string, listener: Listener) => void;
  removeListener: (eventName: string, listener: Listener) => void;
  removeAllListeners: (eventName: string) => void;
  write: (data: string) => void;
  destroy: () => void;
};

function createDenonEventBus(telnetSocket: TelnetSocketShape): DenonEventBus {
  const registry: Record<string, Listener[]> = {};

  const emit = (eventName: string, ...args: unknown[]): void => {
    const listeners = registry[eventName];
    if (listeners) {
      for (const listener of listeners) {
        listener(...args);
      }
    }
  };

  const on = (eventName: string, listener: Listener): void => {
    if (!registry[eventName]) {
      registry[eventName] = [];
    }
    registry[eventName].push(listener);
  };

  const removeListener = (eventName: string, listener: Listener): void => {
    const listeners = registry[eventName];
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  };

  const once = (eventName: string, listener: Listener): void => {
    const wrappedListener: Listener = (...args) => {
      listener(...args);
      removeListener(eventName, wrappedListener);
    };
    on(eventName, wrappedListener);
  };

  const removeAllListeners = (eventName: string): void => {
    delete registry[eventName];
  };

  const destroy = (): void => {
    telnetSocket.destroy();
    for (const eventName in registry) {
      delete registry[eventName];
    }
  };

  return {
    emit,
    on,
    once,
    removeListener,
    removeAllListeners,
    write: (data: string) => telnetSocket.write(data),
    destroy,
  };
}

export default createDenonEventBus;
