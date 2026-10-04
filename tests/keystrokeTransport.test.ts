import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import * as ts from "typescript";
import * as vm from "node:vm";

import {
  buildKeystrokeEndpoint,
  resolveKeystrokeRequestKey,
} from "../src/utilities/keystrokeTransport.ts";

const PROJECT_ROOT = process.cwd();
const ORIGIN = "http://localhost";
const ROBOT_HANDLER_PATH = join(
  PROJECT_ROOT,
  "src/pages/api/robot/keystroke/[key].ts",
);
const LINUX_HANDLER_PATH = join(
  PROJECT_ROOT,
  "src/pages/api/linux/ydotool/[key].ts",
);

type QueryValue = string | string[] | undefined;

interface ApiRequest {
  method: string;
  query: Record<string, QueryValue>;
}

interface ApiResponseRecorder {
  statusCode: number;
  body: unknown;
  headers: Record<string, string | string[]>;
  setHeader(name: string, value: string | string[]): ApiResponseRecorder;
  status(code: number): ApiResponseRecorder;
  json(body: unknown): ApiResponseRecorder;
  send(body: unknown): ApiResponseRecorder;
}

type ApiHandler = (
  request: ApiRequest,
  response: ApiResponseRecorder,
) => void | Promise<void>;

interface CommonJsModule {
  exports: unknown;
}

type CommonJsFactory = (
  requireModule: (request: string) => unknown,
  module: CommonJsModule,
  exports: Record<string, unknown>,
  filename: string,
  dirname: string,
) => void;

function createResponse(): ApiResponseRecorder {
  const response: ApiResponseRecorder = {
    statusCode: 200,
    body: undefined,
    headers: {},
    setHeader(name, value) {
      response.headers[name] = value;
      return response;
    },
    status(code) {
      response.statusCode = code;
      return response;
    },
    json(body) {
      response.body = body;
      return response;
    },
    send(body) {
      response.body = body;
      return response;
    },
  };
  return response;
}

function resolveTypeScriptModule(parentPath: string, request: string): string {
  const basePath = request.startsWith("@/")
    ? join(PROJECT_ROOT, "src", request.slice(2))
    : resolve(dirname(parentPath), request);
  const candidates = [basePath, `${basePath}.ts`, `${basePath}.tsx`, `${basePath}.js`];
  const modulePath = candidates.find((candidate) => existsSync(candidate));
  if (!modulePath) {
    throw new Error(`Cannot resolve test module ${request} from ${parentPath}`);
  }
  return modulePath;
}

function createTypeScriptLoader(mocks: ReadonlyMap<string, unknown>): {
  load(modulePath: string): unknown;
} {
  const cache = new Map<string, unknown>();

  function load(modulePath: string): unknown {
    const cached = cache.get(modulePath);
    if (cached !== undefined) return cached;

    const source = readFileSync(modulePath, "utf8");
    const compiled = ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
      fileName: modulePath,
    }).outputText;
    const moduleRecord: CommonJsModule = { exports: {} };
    const initialExports = moduleRecord.exports as Record<string, unknown>;
    const requireModule = (request: string): unknown => {
      const mocked = mocks.get(request);
      if (mocked !== undefined) return mocked;
      if (request.startsWith("@/") || request.startsWith(".")) {
        return load(resolveTypeScriptModule(modulePath, request));
      }
      throw new Error(`Unexpected runtime dependency ${request} from ${modulePath}`);
    };
    const factorySource = `(function (require, module, exports, __filename, __dirname) {${compiled}\n})`;
    const factory = vm.runInNewContext(factorySource, {
      clearTimeout,
      console,
      setTimeout,
    }) as unknown as CommonJsFactory;
    factory(requireModule, moduleRecord, initialExports, modulePath, dirname(modulePath));
    cache.set(modulePath, moduleRecord.exports);
    return moduleRecord.exports;
  }

  return { load };
}

const constantsLoader = createTypeScriptLoader(new Map());
const remoteConstants = constantsLoader.load(
  join(PROJECT_ROOT, "src/constants/remotes.ts"),
) as Record<string, unknown>;
const htpcConstants = constantsLoader.load(
  join(PROJECT_ROOT, "src/constants/htpcControls.ts"),
) as Record<string, unknown>;
const KEYSTROKE = remoteConstants.KEYSTROKE as {
  PC: Record<string, string>;
};
const LinuxKeyAction = htpcConstants.LinuxKeyAction as Record<string, string>;

function getDefaultExport(value: unknown): ApiHandler {
  if (!value || typeof value !== "object") {
    throw new Error("Expected a CommonJS module object");
  }
  const defaultExport = (value as Record<string, unknown>).default;
  if (typeof defaultExport !== "function") {
    throw new Error("Expected a default API handler export");
  }
  return defaultExport as ApiHandler;
}

interface RobotFixture {
  handler: ApiHandler;
  typed: string[];
  taps: Array<{ key: string; modifiers?: string[] }>;
}

function loadRobotFixture(): RobotFixture {
  const typed: string[] = [];
  const taps: Array<{ key: string; modifiers?: string[] }> = [];
  const robotModule = {
    __esModule: true,
    keyTap(key: string, modifiers?: string[]): void {
      taps.push({ key, modifiers });
    },
    keyToggle(): void {},
    setKeyboardDelay(): void {},
    typeString(value: string): void {
      typed.push(value);
    },
  };
  const mocks = new Map<string, unknown>([
    ["@jitsi/robotjs", robotModule],
    ["@/hooks/usePlatform", {
      getPlatformInfo: () => ({ isLinux: false, isMac: false, isWindows: true, platform: "WINDOWS" }),
    }],
    ["../libnut-macos", {
      libnutTypeString: (value: string): void => {
        typed.push(value);
      },
    }],
  ]);
  const loader = createTypeScriptLoader(mocks);
  return {
    handler: getDefaultExport(loader.load(ROBOT_HANDLER_PATH)),
    taps,
    typed,
  };
}

interface LinuxFixture {
  handler: ApiHandler;
  commands: Array<{ command: string; args: string[] }>;
}

function loadLinuxFixture(): LinuxFixture {
  const commands: Array<{ command: string; args: string[] }> = [];
  const mocks = new Map<string, unknown>([
    ["../../lib/command", {
      runCommand: async (command: string, args: string[]): Promise<void> => {
        commands.push({ command, args: [...args] });
      },
    }],
  ]);
  const loader = createTypeScriptLoader(mocks);
  return {
    handler: getDefaultExport(loader.load(LINUX_HANDLER_PATH)),
    commands,
  };
}

function requestForEndpoint(endpoint: string): ApiRequest {
  const parsed = new URL(endpoint, ORIGIN);
  const routeKey = parsed.pathname.split("/").at(-1) ?? "";
  const value = parsed.searchParams.get("value");
  return {
    method: "GET",
    query: value === null ? { key: routeKey } : { key: routeKey, value },
  };
}

function requestForKey(key: string, basePath = "/api/robot/keystroke"): ApiRequest {
  return requestForEndpoint(buildKeystrokeEndpoint(basePath, key));
}

test("the old dynamic path loses a standalone encoded period", () => {
  const oldEndpoint = new URL("/api/robot/keystroke/%2E", ORIGIN);

  assert.equal(oldEndpoint.pathname, "/api/robot/keystroke/");
});

test("the query transport preserves raw dots and percent sequences", () => {
  const periodEndpoint = new URL(
    buildKeystrokeEndpoint("/api/robot/keystroke", "."),
    ORIGIN,
  );
  const literalPercentSequence = new URL(
    buildKeystrokeEndpoint("/api/robot/keystroke", "%2E"),
    ORIGIN,
  );

  assert.equal(periodEndpoint.pathname, "/api/robot/keystroke/input");
  assert.equal(periodEndpoint.searchParams.get("value"), ".");
  assert.equal(literalPercentSequence.searchParams.get("value"), "%2E");
});

test("URLs and IP addresses preserve punctuation and Unicode in transport", () => {
  const typed = "https://192.168.1.1/media?q=a+b#chapter/2 你好";
  const endpoint = new URL(buildKeystrokeEndpoint("/api/linux/ydotool", typed), ORIGIN);

  assert.equal(endpoint.pathname, "/api/linux/ydotool/input");
  assert.equal(endpoint.searchParams.get("value"), typed);
});

test("the Robot handler dispatches every URL and IP character unchanged", async () => {
  const fixture = loadRobotFixture();
  const typed = "https://192.168.1.1/media?q=a+b#chapter/2 %/?";

  for (const character of typed) {
    const response = createResponse();
    await fixture.handler(requestForKey(character), response);
    assert.equal(response.statusCode, 200);
  }

  assert.equal(fixture.typed.join(""), typed);
});

test("the Linux handler dispatches every URL and IP character unchanged", async () => {
  const fixture = loadLinuxFixture();
  const typed = "https://192.168.1.1/media?q=a+b#chapter/2 %/?";

  for (const character of typed) {
    const response = createResponse();
    await fixture.handler(requestForKey(character, "/api/linux/ydotool"), response);
    assert.equal(response.statusCode, 200);
  }

  assert.deepEqual(
    fixture.commands,
    [...typed].map((character) => ({
      command: "htpc-key",
      args: [LinuxKeyAction.Type, character],
    })),
  );
});

test("both handlers retain control-token dispatch and legacy paths", async () => {
  const robot = loadRobotFixture();
  const linux = loadLinuxFixture();
  const robotControls = new Map([
    [KEYSTROKE.PC.ENTER, "enter"],
    [KEYSTROKE.PC.BACKSPACE, "backspace"],
    [KEYSTROKE.PC.TAB, "tab"],
    [KEYSTROKE.PC.LEFT, "left"],
    [KEYSTROKE.PC.WIN_KEY, "command"],
  ]);
  const linuxControls = new Map([
    [KEYSTROKE.PC.ENTER, LinuxKeyAction.Enter],
    [KEYSTROKE.PC.BACKSPACE, LinuxKeyAction.Back],
    [KEYSTROKE.PC.TAB, LinuxKeyAction.Tab],
    [KEYSTROKE.PC.LEFT, LinuxKeyAction.Left],
    [KEYSTROKE.PC.WIN_KEY, LinuxKeyAction.SuperKey],
  ]);

  for (const [token, expectedKey] of robotControls) {
    const response = createResponse();
    await robot.handler(requestForKey(token), response);
    assert.equal(response.statusCode, 200);
    assert.equal(robot.taps.at(-1)?.key, expectedKey);
  }
  for (const [token, expectedAction] of linuxControls) {
    const response = createResponse();
    await linux.handler(requestForKey(token, "/api/linux/ydotool"), response);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(linux.commands.at(-1), { command: "htpc-key", args: [expectedAction] });
  }

  const robotLegacyResponse = createResponse();
  await robot.handler({ method: "GET", query: { key: KEYSTROKE.PC.ENTER } }, robotLegacyResponse);
  assert.equal(robotLegacyResponse.statusCode, 200);
  assert.equal(robot.taps.at(-1)?.key, "enter");

  const linuxLegacyResponse = createResponse();
  await linux.handler({ method: "GET", query: { key: KEYSTROKE.PC.ENTER } }, linuxLegacyResponse);
  assert.equal(linuxLegacyResponse.statusCode, 200);
  assert.deepEqual(linux.commands.at(-1), { command: "htpc-key", args: [LinuxKeyAction.Enter] });
});

test("both handlers reject non-GET, missing, and empty input without dispatch", async () => {
  const robot = loadRobotFixture();
  const linux = loadLinuxFixture();

  for (const handler of [robot.handler, linux.handler]) {
    const methodResponse = createResponse();
    await handler({ method: "POST", query: { key: "input" } }, methodResponse);
    assert.equal(methodResponse.statusCode, 405);
    assert.equal((methodResponse.body as { ok: boolean }).ok, false);
    assert.equal((methodResponse.body as { error: string }).error, "Method Not Allowed");

    const missingResponse = createResponse();
    await handler({ method: "GET", query: { key: "input" } }, missingResponse);
    assert.equal(missingResponse.statusCode, 400);
    assert.equal((missingResponse.body as { ok: boolean }).ok, false);
    assert.equal((missingResponse.body as { error: string }).error, "Missing key");

    const emptyResponse = createResponse();
    await handler({ method: "GET", query: { key: "input", value: "" } }, emptyResponse);
    assert.equal(emptyResponse.statusCode, 400);
    assert.equal((emptyResponse.body as { ok: boolean }).ok, false);
    assert.equal((emptyResponse.body as { error: string }).error, "Missing key");
  }

  assert.equal(robot.typed.length, 0);
  assert.equal(robot.taps.length, 0);
  assert.equal(linux.commands.length, 0);
});

test("request resolution preserves an explicit raw percent sequence", () => {
  assert.equal(resolveKeystrokeRequestKey("input", undefined), undefined);
  assert.equal(resolveKeystrokeRequestKey("input", "."), ".");
  assert.equal(resolveKeystrokeRequestKey("input", ""), "");
  assert.equal(resolveKeystrokeRequestKey("KEYSTROKE_ENTER", undefined), "KEYSTROKE_ENTER");
  assert.equal(resolveKeystrokeRequestKey("input", "%2E"), "%2E");
});
