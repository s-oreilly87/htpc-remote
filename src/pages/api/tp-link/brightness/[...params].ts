import type { NextApiRequest, NextApiResponse } from "next";
import { toNumber } from "lodash";

import client from "@/api-modules/tplink/tplink-client";
import { TPLINK_DEVICE_MAP } from "@/constants/smartHome";

type BrightnessResponse = { ok: boolean; error?: string };

interface DimmableDevice {
  dimmer: {
    setBrightness(brightness: number): Promise<void> | void;
  };
}

function isDimmableDevice(device: unknown): device is DimmableDevice {
  if (typeof device !== "object" || device === null || !("dimmer" in device)) {
    return false;
  }

  const dimmer = (device as { dimmer?: unknown }).dimmer;
  return (
    typeof dimmer === "object" &&
    dimmer !== null &&
    "setBrightness" in dimmer &&
    typeof dimmer.setBrightness === "function"
  );
}

export default async function handleBrightness(
  req: NextApiRequest,
  res: NextApiResponse<BrightnessResponse>,
) {
  const { params } = req.query;
  const [deviceId, brightnessParam] = Array.isArray(params) ? params : [];
  const deviceConfig = deviceId ? TPLINK_DEVICE_MAP[deviceId] : undefined;
  const brightnessLevel = toNumber(brightnessParam);

  if (!deviceConfig || deviceConfig.kind !== "dimmer") {
    res.status(400).json({ ok: false, error: "Switch is not dimmable" });
    return;
  }

  if (!(brightnessLevel >= 1 && brightnessLevel <= 100)) {
    res.status(400).json({ ok: false, error: "Invalid brightness value" });
    return;
  }

  try {
    const device = await client.getDevice({
      host: deviceConfig.ip,
      childId: deviceConfig.childId,
    });
    if (!isDimmableDevice(device)) {
      res.status(400).json({ ok: false, error: "Configured device does not support dimming" });
      return;
    }

    await device.dimmer.setBrightness(brightnessLevel);
    res.status(200).json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ ok: false, error: message });
  }
}
