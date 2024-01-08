import client from '@/api-modules/tplink/tplink-client'
import {LIGHTSWITCHES, PLUGS} from "@/utilities/constants.js";

export default async function handleInfo(req, res) {
  let { deviceId } = req.query;
  let responseObject = {};

  async function getDeviceInfo(deviceId) {
    const allDeviceObjects = {...LIGHTSWITCHES, ...PLUGS}
    const device = Object.values(allDeviceObjects).find(
      (deviceObject) => deviceObject.id === deviceId,
    );

    try {
      const clientDevice = await client.getDevice(
        { host: device.ip },
        { timeout: 2000 },
      );
      const { sysInfo } = await clientDevice.getInfo();
      if (sysInfo.children) {
        sysInfo.children.forEach((child) => {
          const object = Object.values(allDeviceObjects).find((object) => `${object.label} Lights` === child.alias)
          responseObject[object.id] = {
            powerState: child.state === 1
          }
        })
      } else {
        responseObject[device.id] = {
          powerState: sysInfo.relay_state === 1,
          brightness: sysInfo.brightness,
        };
      }

    } catch (e) {
      responseObject[device.id] = { error: "could-not-connect" };
      console.log("Device not found");
    }
  }

  if (deviceId === PLUGS.PATIO.id || PLUGS.BACKYARD.id || deviceId === "all") {
    await getDeviceInfo(PLUGS.PATIO.id);
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





  res.send(responseObject);
}
