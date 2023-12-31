import {Client} from "tplink-smarthome-api";
import {LIGHTSWITCHES, PLUGS} from "@/utilities/constants.js";

export default function handleToggleSwitch(req, res) {
  let { params } = req.query;
  const light = params[0];
  const powerState = params[1] === "on";

  let ip;
  let childId;
  switch (light) {
    case PLUGS.PATIO.id: {
      ip = PLUGS.PATIO.ip;
      childId = PLUGS.PATIO.childId
      break;
    }
    case PLUGS.BACKYARD.id: {
      ip = PLUGS.BACKYARD.ip;
      childId = PLUGS.BACKYARD.childId
      break;
    }
    case LIGHTSWITCHES.BASEMENT.id: {
      ip = LIGHTSWITCHES.BASEMENT.ip;
      break;
    }
    case LIGHTSWITCHES.STAIRWAY.id: {
      ip = LIGHTSWITCHES.STAIRWAY.ip;
      break;
    }
    case LIGHTSWITCHES.BEDROOM.id: {
      ip = LIGHTSWITCHES.BEDROOM.ip;
    }
  }
  const client = new Client();
  client.getDevice({ host: ip, childId: childId }).then((device) => {
    device.setPowerState(powerState);
  });
  res.send("TPLink command sent!");
}
