import client from '@/api-modules/tplink/tplink-client'
import {toNumber} from "lodash";
import {LIGHTSWITCHES} from "@/utilities/constants";
import {Plug} from "tplink-smarthome-api";

export default function handleBrightness(req, res) {
  let { params } = req.query;
  const light = params[0];
  const brightnessLevel = toNumber(params[1]);

  if (!(brightnessLevel >= 1 && brightnessLevel <= 100)) {
    return res.send("Error: No brightness value received!");
  }

  let ip;
  switch (light) {
    case "basement": {
      ip = LIGHTSWITCHES.BASEMENT.ip;
      break;
    }
    default: {
      return res.send("Error: Switch not dimmable!");
    }
  }

  client.on("error", (error) => console.log(error));
  client.getDevice({ host: ip }).then((device) => {
          if (device instanceof Plug) {
              device.dimmer.setBrightness(brightnessLevel);
          }
  });

  res.send("TPLink command sent!");
}
