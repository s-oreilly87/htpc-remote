import assert from "node:assert/strict";
import net from "node:net";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import * as ts from "typescript";
import { QueryClient } from "@tanstack/react-query";

const require = createRequire(import.meta.url);
function load(path: string, mocks: Record<string, unknown>) {
  const source = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const moduleRecord = { exports: {} };
  vm.runInNewContext(`(function(require,module,exports){${source}\n})`, {
    console,
    setTimeout,
    clearTimeout,
    global: {},
    Buffer,
  })(
    (name: string) => mocks[name] ?? require(name),
    moduleRecord,
    moduleRecord.exports,
  );
  return moduleRecord.exports;
}
interface Client {
  cmd(
    command: string,
    callback: (error: string | null, lines?: string[]) => void,
  ): void;
  socket: net.Socket | null;
}
const { DenonTelnet } = load("src/api-modules/denon/denon-telnet.ts", {
  "@/constants/denon": { DENON_IP: "127.0.0.1" },
}) as {
  DenonTelnet: new (
    host: string,
    options: { port: number; responseTimeoutMs: number; collectionMs: number },
  ) => Client;
};

function command(client: Client, value: string): Promise<string[]> {
  return new Promise((resolve, reject) =>
    client.cmd(value, (error, lines) =>
      error ? reject(new Error(error)) : resolve(Array.from(lines ?? [])),
    ),
  );
}
async function fixture(
  onCommand: (command: string, socket: net.Socket) => void,
) {
  const sockets = new Set<net.Socket>();
  const server = net.createServer((socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    let buffer = "";
    socket.on("data", (data) => {
      buffer += data.toString();
      const lines = buffer.split("\r");
      buffer = lines.pop() ?? "";
      for (const line of lines) onCommand(line, socket);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as net.AddressInfo).port;
  const client = new DenonTelnet("127.0.0.1", {
    port,
    responseTimeoutMs: 400,
    collectionMs: 25,
  });
  return {
    client,
    port,
    close: async () => {
      for (const socket of sockets) socket.destroy();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

test("concurrent commands serialize, ignoring unrelated lines and accumulating CR fragments", async () => {
  const sent: string[] = [];
  const avr = await fixture((value, socket) => {
    sent.push(value);
    if (value === "ZM?") {
      socket.write("MV50\rZM");
      setTimeout(() => socket.write("OFF\r"), 140);
    } else socket.write("MUON\r");
  });
  try {
    const power = command(avr.client, "ZM?");
    const mute = command(avr.client, "MU?");
    assert.deepEqual(await power, ["ZMOFF"]);
    assert.deepEqual(await mute, ["MUON"]);
    assert.deepEqual(sent, ["ZM?", "MU?"]);
  } finally {
    await avr.close();
  }
});

test("unrelated traffic does not satisfy a power query or postpone its deadline", async () => {
  const avr = await fixture((_value, socket) =>
    socket.write("MV50\rPWSTANDBY\r"),
  );
  try {
    await assert.rejects(command(avr.client, "ZM?"), /no response/);
  } finally {
    await avr.close();
  }
});

test("close completes active and queued callbacks once, then reconnects safely", async () => {
  let count = 0;
  const avr = await fixture((_value, socket) => {
    if (count++ === 0) socket.destroy();
    else socket.write("ZMON\r");
  });
  try {
    const oldSocketResults: string[] = [];
    const first = new Promise<void>((resolve) =>
      avr.client.cmd("ZM?", (error) => {
        oldSocketResults.push(String(error));
        resolve();
      }),
    );
    const oldSocket = avr.client.socket!;
    const queued = command(avr.client, "MU?");
    await assert.rejects(queued, /connection closed/);
    await first;
    const next = command(avr.client, "ZM?");
    oldSocket.emit("close"); // An old connection cannot reset its replacement.
    assert.deepEqual(await next, ["ZMON"]);
    assert.equal(oldSocketResults.length, 1);
  } finally {
    await avr.close();
  }
});

test("timeout drains pending callbacks once, allowing a later request to retry", async () => {
  let respond = false;
  const avr = await fixture((_value, socket) => {
    if (respond) socket.write("ZMON\r");
  });
  try {
    const results = await Promise.allSettled([
      command(avr.client, "ZM?"),
      command(avr.client, "MU?"),
    ]);
    assert.equal(
      results.filter((result) => result.status === "rejected").length,
      2,
    );
    respond = true;
    assert.deepEqual(await command(avr.client, "ZM?"), ["ZMON"]);
  } finally {
    await avr.close();
  }
});

test("connection errors complete the batch and the next command can reconnect", async () => {
  const avr = await fixture((_value, socket) => socket.write("ZMON\r"));
  await avr.close();
  await assert.rejects(command(avr.client, "ZM?"), /ECONNREFUSED/);
  const server = net.createServer((socket) =>
    socket.on("data", () => socket.write("ZMOFF\r")),
  );
  await new Promise<void>((resolve) =>
    server.listen(avr.port, "127.0.0.1", resolve),
  );
  try {
    assert.deepEqual(await command(avr.client, "ZM?"), ["ZMOFF"]);
  } finally {
    avr.client.socket?.destroy();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

interface State {
  powerOn: boolean;
  MV: number;
  [key: string]: unknown;
}
function stateQueries(
  http: () => Promise<unknown>,
  telnet: () => Promise<unknown>,
) {
  return load("src/lib/denon-query.ts", {
    "@/constants/denon": {
      DENON_INPUTS: {},
      DENON_SOUND_MODES: { NONE: { selectSurround: [] } },
    },
    "@/utilities/http": { fetchMainZoneData: http, sendDenonQuery: telnet },
  }) as {
    fetchDenonState(previous: State): Promise<State>;
    fetchDenonAdvancedState(): Promise<Partial<State>>;
  };
}

test("basic power completes independently of hung advanced queries, preserving advanced state", async () => {
  let advancedCalls = 0;
  const queries = stateQueries(
    async () => ({ data: { zonePower: "OFF", mute: "OFF" } }),
    () => {
      advancedCalls++;
      return new Promise(() => {});
    },
  );
  void queries.fetchDenonAdvancedState(); // Remains unresolved throughout the basic fetch.
  const previous = { powerOn: true, MV: 44, PSDIL: 3 };
  const state = await queries.fetchDenonState(previous);
  assert.equal(state.powerOn, false);
  assert.equal(state.MV, 44);
  assert.equal(state.PSDIL, 3);
  assert.equal(advancedCalls, 1);
});

test("HTTP failures reject instead of manufacturing a false power state", async () => {
  const queries = stateQueries(
    async () => ({ error: "offline" }),
    async () => ({ error: "offline" }),
  );
  await assert.rejects(
    queries.fetchDenonState({ powerOn: true, MV: 44 }),
    /main-zone state unavailable/,
  );
  assert.deepEqual(Object.keys(await queries.fetchDenonAdvancedState()), []);
});

function providerFixture(
  result: Promise<{ data?: boolean; error?: string }>,
  suppliedClient?: QueryClient,
  basicFetch?: () => Promise<State>,
) {
  let state: State = { powerOn: true, MV: 44 };
  let sends = 0;
  let invalidations = 0;
  let cancellations = 0;
  const queryClient = suppliedClient ?? {
    getQueryData: () => state,
    setQueryData: (_key: unknown, update: (value: State) => State) => {
      state = update(state);
    },
    cancelQueries: async () => {
      cancellations++;
    },
    invalidateQueries: async () => {
      invalidations++;
    },
  };
  const react = {
    createContext: () => ({ Provider: "provider" }),
    useCallback: (fn: unknown) => fn,
    useMemo: (fn: () => unknown) => fn(),
    useRef: (value: unknown) => ({ current: value }),
    useState: (value: unknown) => [value, () => {}],
    useEffect: () => {},
  };
  const queryOptions: {
    queryFn: (context: { signal: AbortSignal }) => Promise<State>;
  }[] = [];
  const { DenonProvider } = load("src/context/denon.tsx", {
    react,
    "react/jsx-runtime": {
      jsx: (_type: unknown, props: unknown) => ({ props }),
    },
    "@tanstack/react-query": {
      useQueryClient: () => queryClient,
      useQuery: (options: {
        queryFn: (context: { signal: AbortSignal }) => Promise<State>;
      }) => {
        queryOptions.push(options);
        return { data: state, isLoading: false };
      },
    },
    "@/constants/denon": { DENON_SOUND_MODES: { NONE: {} } },
    "@/constants/remotes": { KEYSTROKE: { DENON: { POWER: "POWER" } } },
    "@/lib/denon-query": {
      DENON_QUERY_KEY: ["denon-state"],
      fetchDenonState: basicFetch,
    },
    "@/utilities/http": {
      sendDenonCommand: () => {
        sends++;
        return result;
      },
    },
  }) as {
    DenonProvider(props: { children: null }): {
      props: { value: { togglePower(): Promise<void> } };
    };
  };
  const power = DenonProvider({ children: null }).props.value.togglePower;
  return {
    power,
    basicQuery: queryOptions[0]?.queryFn,
    get state() {
      return suppliedClient?.getQueryData<State>(["denon-state"]) ?? state;
    },
    get sends() {
      return sends;
    },
    get invalidations() {
      return invalidations;
    },
    get cancellations() {
      return cancellations;
    },
  };
}

test("power waits for confirmation, ignores repeated clicks, cancels polls and resyncs", async () => {
  let resolve!: (result: { data: boolean }) => void;
  const result = new Promise<{ data: boolean }>((done) => {
    resolve = done;
  });
  const fixture = providerFixture(result);
  const action = fixture.power();
  await fixture.power();
  assert.equal(fixture.state.powerOn, true);
  assert.equal(fixture.sends, 1);
  assert.equal(fixture.cancellations, 1);
  resolve({ data: false });
  await action;
  assert.equal(fixture.state.powerOn, false);
  assert.equal(fixture.invalidations, 1);
});

test("failed power command preserves displayed state and still resyncs", async () => {
  const fixture = providerFixture(Promise.resolve({ error: "no response" }));
  await fixture.power();
  assert.equal(fixture.state.powerOn, true);
  assert.equal(fixture.invalidations, 1);
});

test("demo power returns the same boolean confirmation as the live API", () => {
  const { DenonSimulator } = load("src/demo/devices/denon.ts", {
    "@/constants/denon": { DENON_INPUTS: {}, DENON_SOUND_MODES: {} },
    "@/constants/remotes": { DenonKeystroke: { POWER: "POWER" } },
  }) as {
    DenonSimulator: new (
      state: { powerOn: boolean },
      mutate: () => void,
    ) => { handleCommand(value: string): { data: boolean } };
  };
  const simulator = new DenonSimulator({ powerOn: false }, () => {});
  assert.equal(simulator.handleCommand("POWER").data, true);
  assert.equal(simulator.handleCommand("POWER").data, false);
});

test("raw sound-mode setters accept MS family responses and PS queries filter their specific key", async () => {
  const avr = await fixture((value, socket) => {
    if (value === "MSMOVIE") socket.write("MSDOLBY DIGITAL\r");
    else socket.write("PSDYNVOL OFF\rPSDYNEQ ON\r");
  });
  try {
    assert.deepEqual(await command(avr.client, "MSMOVIE"), ["MSDOLBY DIGITAL"]);
    assert.deepEqual(await command(avr.client, "PSDYNEQ ?"), ["PSDYNEQ ON"]);
  } finally {
    await avr.close();
  }
});

test("silent first cycle press completes without dropping a queued rapid second press", async () => {
  let presses = 0;
  const avr = await fixture((value, socket) => {
    assert.equal(value, "MSMOVIE");
    if (++presses === 2) socket.write("MSDOLBY DIGITAL\r");
  });
  try {
    const first = command(avr.client, "MSMOVIE");
    const second = command(avr.client, "MSMOVIE");
    assert.deepEqual(await first, []);
    assert.deepEqual(await second, ["MSDOLBY DIGITAL"]);
    assert.equal(presses, 2);
  } finally {
    await avr.close();
  }
});

test("a cancelled pre-power HTTP poll cannot overwrite the confirmed command state", async () => {
  const client = new QueryClient();
  const previous = { powerOn: true, MV: 44 };
  client.setQueryData(["denon-state"], previous);
  let finishOldPoll!: (state: State) => void;
  const oldPoll = new Promise<State>((resolve) => {
    finishOldPoll = resolve;
  });
  const fixture = providerFixture(
    Promise.resolve({ data: false }),
    client,
    () => oldPoll,
  );
  const poll = client
    .fetchQuery({
      queryKey: ["denon-state"],
      queryFn: fixture.basicQuery,
      retry: false,
    })
    .catch(() => "cancelled");
  await fixture.power();
  finishOldPoll(previous);
  await poll;
  assert.equal(fixture.state.powerOn, false);
  client.clear();
});

test("empty command and follow-up sound-mode responses leave state unchanged without throwing", async () => {
  let updates = 0;
  const { default: CycleSoundModes } = load(
    "src/components/RemotePanels/Denon/CycleSoundModeButtons.tsx",
    {
      "react/jsx-runtime": {
        jsx: (_type: unknown, props: unknown) => ({ props }),
        jsxs: (_type: unknown, props: unknown) => ({ props }),
      },
      "@/constants/remotes": { RemoteType: { DENON: "denon" } },
      "@/constants/denon": {
        DENON_SOUND_MODES: {},
        DOLBY_MODES: [],
        DTS_MODES: [],
      },
      "@/components/UI/KeypressButton": { default: "button" },
      "@/context/denon": {
        useDenonContext: () => ({
          updateDenonState: () => {
            updates++;
          },
        }),
      },
      "@/utilities/http": {
        sendDenonCommand: async () => ({ data: [] }),
        sendDenonQuery: async () => ({ data: [] }),
      },
    },
  ) as {
    default: (props: { cycleTimeout: null; setCycleTimeout: () => void }) => {
      props: {
        children: {
          props: {
            children: {
              props: {
                onClick: (event: {
                  currentTarget: { value: string };
                }) => Promise<void>;
              };
            }[];
          };
        };
      };
    };
  };
  const panel = CycleSoundModes({
    cycleTimeout: null,
    setCycleTimeout: () => {},
  });
  const pureButton = panel.props.children.props.children[3];
  await pureButton.props.onClick({ currentTarget: { value: "MSDIRECT" } });
  assert.equal(updates, 0);
});
