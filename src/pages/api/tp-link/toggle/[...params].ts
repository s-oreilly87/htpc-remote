import client from '@/api-modules/tplink/tplink-client'
import { LIGHTSWITCHES, PLUGS } from "@/constants/smartHome";

export default function handleToggleSwitch(req, res) {
  let { params } = req.query;
  const light = params[0];
  const powerState = params[1] === "on";

  let ip;
  let childId;
  switch (light) {
    case PLUGS.YARD_DINING.id: {
      ip = PLUGS.YARD_DINING.ip;
      childId = PLUGS.YARD_DINING.childId
      break;
    }
    case PLUGS.YARD_FENCE.id: {
      ip = PLUGS.YARD_FENCE.ip;
      childId = PLUGS.YARD_FENCE.childId
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

  client.getDevice({ host: ip, childId: childId }).then((device) => {
    device.setPowerState(powerState);
  });
  res.send("TPLink command sent!");
}
