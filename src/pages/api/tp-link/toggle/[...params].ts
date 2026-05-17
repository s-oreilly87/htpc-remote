import type { NextApiRequest, NextApiResponse } from "next";

import client from "@/api-modules/tplink/tplink-client";
import { TPLINK_DEVICE_MAP } from "@/constants/smartHome";

type ToggleResponse = { ok: boolean; error?: string };

interface PowerDevice {
  setPowerState(powerState: boolean): Promise<unknown> | unknown;
}

export default async function handleToggleSwitch(
  req: NextApiRequest,
  res: NextApiResponse<ToggleResponse>,
) {
  const { params } = req.query;
  const [deviceId, onOff] = Array.isArray(params) ? params : [];
  const deviceConfig = deviceId ? TPLINK_DEVICE_MAP[deviceId] : undefined;

  if (!deviceConfig || (onOff !== "on" && onOff !== "off")) {
    res.status(400).json({ ok: false, error: "Invalid TP-Link toggle target" });
    return;
  }

  try {
    const device = await client.getDevice({
      host: deviceConfig.ip,
      childId: deviceConfig.childId,
    }) as PowerDevice;
    await device.setPowerState(onOff === "on");
    res.status(200).json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ ok: false, error: message });
  }
}
