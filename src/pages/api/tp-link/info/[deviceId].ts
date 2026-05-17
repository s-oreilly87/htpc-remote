import {NextApiRequest, NextApiResponse} from "next";

import client from "@/api-modules/tplink/tplink-client";
import { TPLINK_DEVICES, TPLINK_DEVICE_MAP } from "@/constants/smartHome";

interface KasaChildSysInfo {
  alias: string;
  id?: string;
  state: number;
}

interface KasaDeviceSysInfo {
  relay_state?: number;
  brightness?: number;
  children?: KasaChildSysInfo[];
}

interface KasaDeviceClient {
  getInfo(): Promise<{ sysInfo: KasaDeviceSysInfo }>;
}

type DeviceInfoResponse =
  | { powerState: boolean; brightness?: number }
  | { error: string };

type DeviceResponseMap = Record<string, DeviceInfoResponse>;

export default async function handleInfo(
  req: NextApiRequest,
  res: NextApiResponse<DeviceResponseMap | { error: string }>,
) {
  const { deviceId } = req.query;

  if (typeof deviceId !== "string") {
    res.status(400).json({ error: "invalid-device" });
    return;
  }

  const responseObject: DeviceResponseMap = {};

  async function getDeviceInfo(targetDeviceId: string) {
    const device = TPLINK_DEVICE_MAP[targetDeviceId];

    if (!device) {
      return;
    }

    try {
      const clientDevice = (await client.getDevice(
        { host: device.ip },
        { timeout: 2000 },
      )) as KasaDeviceClient;
      const { sysInfo } = await clientDevice.getInfo();
      if (sysInfo.children?.length) {
        // sysInfo will have children for devices with multiple plugs
        sysInfo.children.forEach((child) => {
          // Prefer childId when available; otherwise match on the label set in the Kasa app.
          const object = TPLINK_DEVICES.find(
            (deviceObject) =>
              (deviceObject.childId && deviceObject.childId === child.id) ||
              `${deviceObject.label}` === child.alias,
          );
          if (object) {
            responseObject[object.id] = {
              powerState: child.state === 1,
            };
          }
        });
      } else {
        responseObject[device.id] = {
          powerState: sysInfo.relay_state === 1,
          brightness: sysInfo.brightness,
        };
      }
    } catch (e) {
      responseObject[device.id] = { error: "could-not-connect" };
      console.log(`${e}Device not found`);
    }
  }

  if (deviceId === "all") {
    await Promise.all(TPLINK_DEVICES.map((device) => getDeviceInfo(device.id)));
  } else if (TPLINK_DEVICE_MAP[deviceId]) {
    await getDeviceInfo(deviceId);
  } else {
    res.status(404).json({ error: "device-not-configured" });
    return;
  }

  res.status(200).json(responseObject);
}
