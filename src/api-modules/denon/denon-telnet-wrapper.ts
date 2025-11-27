type Listener = (...args: unknown[]) => void;
type TelnetSocket = {
  destroy: () => void;
  write: (data: string) => void;
  on: (eventName: string, listener: Listener) => void;
};

function DenonTelnetWrapper(telnetSocket: TelnetSocket) {
  const events: Record<string, Listener[]> = {};

  //Not sure this is doing anything!?  chatGPT . . .

  // Forward the emit method to the wrapper and trigger the registered listeners.
  const emit = (eventName: string, ...args: unknown[]) => {
    const listeners = events[eventName];
    if (listeners) {
      for (const listener of listeners) {
        listener(...args);
      }
    }
  };

  const on = (eventName: string, listener: Listener) => {
    if (!events[eventName]) {
      events[eventName] = [];
    }
    events[eventName].push(listener);
    //console.log(events)
  };

  const once = (eventName: string, listener: Listener) => {
    const wrappedListener: Listener = (...args) => {
      listener(...args);
      removeListener(eventName, wrappedListener);
    };
    on(eventName, wrappedListener);
  };

  const removeListener = (eventName: string, listener: Listener) => {
    const listeners = events[eventName];
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  };

  const removeAllListeners = (eventName: string) => {
    delete events[eventName];
  };

  const destroy = () => {
    telnetSocket.destroy();
    for (const eventName in events) {
      delete events[eventName];
    }
  };

  return Object.assign({}, telnetSocket, {
    emit,
    on,
    once,
    removeListener,
    removeAllListeners,
    destroy,
    write: telnetSocket.write,
  });
}

export default DenonTelnetWrapper;
