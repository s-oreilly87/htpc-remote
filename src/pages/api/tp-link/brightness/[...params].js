import client from '@/api-modules/tplink/tplink-client'
import {toNumber} from "lodash";
import {LIGHTSWITCHES} from "@/utilities/constants.js";

export default function handleBrightness(req, res) {
  let { params } = req.query;
  const light = params[0];
  const brightnessLevel = toNumber(params[1]);
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

  client.on("error", (error) => console.log("ERROR! ERROR!"));
  client.getDevice({ host: ip }).then((device) => {
    device.dimmer.setBrightness(brightnessLevel);
  });

  res.send("TPLink command sent!");
}
