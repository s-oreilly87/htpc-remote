import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import * as ts from "typescript";

const require = createRequire(import.meta.url);

function load(path: string, mocks: Record<string, unknown>) {
  const source = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: {
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
    Buffer,
  })(
    (name: string) => mocks[name] ?? require(name),
    moduleRecord,
    moduleRecord.exports,
  );
  return moduleRecord.exports;
}

test("music audio mode restores Dynamic EQ, -5 dB reference offset, and Dynamic Volume Low after mode recall", async () => {
  const commands: string[] = [];
  const { applyDenonMusicAudioMode } = load("src/utilities/denonAudio.ts", {
    "@/utilities/http": {
      sendDenonCommand: async ({ value }: { value: string }) => {
        commands.push(value);
        return {};
      },
    },
  }) as {
    applyDenonMusicAudioMode(mode: { key: string; denonCmd: string }): Promise<void>;
  };

  await applyDenonMusicAudioMode({
    key: "DOLBY_UPMIX",
    denonCmd: "MSDOLBY DIGITAL_+_DOLBY_SURROUND",
  });

  assert.deepEqual(commands, [
    "MSDOLBY DIGITAL_+_DOLBY_SURROUND",
    "PSDYNEQ ON",
    "PSREFLEV 5",
    "PSDYNVOL LIT",
  ]);
});

test("non-music Denon modes do not overwrite their saved Audyssey settings", async () => {
  const commands: string[] = [];
  const { applyDenonMusicAudioMode } = load("src/utilities/denonAudio.ts", {
    "@/utilities/http": {
      sendDenonCommand: async ({ value }: { value: string }) => {
        commands.push(value);
        return {};
      },
    },
  }) as {
    applyDenonMusicAudioMode(mode: { key: string; denonCmd: string }): Promise<void>;
  };

  await applyDenonMusicAudioMode({ key: "ATMOS", denonCmd: "MSQUICK4" });

  assert.deepEqual(commands, ["MSQUICK4"]);
});

test("Dolby upmix uses the explicit Denon Dolby Surround mode, not a Quick Select memory", () => {
  const { AUDIO_MODES } = load("src/constants/pc.ts", {
    "@/constants/htpcControls": {
      LinuxAudioModeCommand: {
        HdmiStereo: "hdmi-stereo",
        Surround51: "surround51-hdmi",
      },
      LinuxDisplayModeCommand: {},
    },
    "@/constants/remotes": { RemoteType: { PC: "pc" } },
    "@/constants/encoding": { URL_ENCODED_SYMBOLS: {} },
    "@/constants/roku": { ROKU_APPS: { HDMI: { HDMI4: { id: "hdmi4" } } } },
    "@/constants/denon": {
      DENON_SOUND_MODES: {
        DOLBY: { value: "MSDOLBY DIGITAL_+_DOLBY_SURROUND" },
      },
    },
  }) as {
    AUDIO_MODES: Record<string, { denonCmd?: string; linuxValue?: string }>;
  };

  assert.equal(
    AUDIO_MODES.DOLBY_UPMIX.denonCmd,
    "MSDOLBY DIGITAL_+_DOLBY_SURROUND",
  );
  assert.equal(AUDIO_MODES.DOLBY_UPMIX.linuxValue, "hdmi-stereo");
});
