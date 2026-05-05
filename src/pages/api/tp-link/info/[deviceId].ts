import {NextApiRequest, NextApiResponse} from "next";

import client from "@/api-modules/tplink/tplink-client";
import { LIGHTSWITCHES, PLUGS } from "@/constants/smartHome";

interface KasaChildSysInfo {
  alias: string;
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
    const allDeviceObjects = {...LIGHTSWITCHES, ...PLUGS};
    const device = Object.values(allDeviceObjects).find(
      (deviceObject) => deviceObject.id === targetDeviceId,
    );

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
          // This is matching on the label set in the KASA app
          const object = Object.values(allDeviceObjects).find(
            (deviceObject) => `${deviceObject.label}` === child.alias,
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

  if (
    deviceId === PLUGS.YARD_DINING.id ||
    deviceId === PLUGS.YARD_FENCE.id ||
    deviceId === "all"
  ) {
    await getDeviceInfo(PLUGS.YARD_DINING.id);
    await getDeviceInfo(PLUGS.YARD_FENCE.id);
  }

  if (deviceId === LIGHTSWITCHES.BEDROOM.id || deviceId === "all") {
    await getDeviceInfo(LIGHTSWITCHES.BEDROOM.id);
  }

  if (deviceId === LIGHTSWITCHES.STAIRWAY.id || deviceId === "all") {
    await getDeviceInfo(LIGHTSWITCHES.STAIRWAY.id);
  }

  if (deviceId === LIGHTSWITCHES.BASEMENT.id || deviceId === "all") {
    await getDeviceInfo(LIGHTSWITCHES.BASEMENT.id);
  }

  res.status(200).json(responseObject);
}
