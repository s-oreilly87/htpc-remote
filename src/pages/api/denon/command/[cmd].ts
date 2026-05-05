import type { NextApiRequest, NextApiResponse } from "next";
import { promisify } from "util";

import denon from "@/api-modules/denon/denon-telnet";
import { KEYSTROKE } from "@/utilities/constants";

const getZonePowerState = promisify(denon.getZonePowerState).bind(denon);
const setZonePowerState = promisify(denon.setZonePowerState).bind(denon);
const getMuteState = promisify(denon.getMuteState).bind(denon);
const setMuteState = promisify(denon.setMuteState).bind(denon);
const cmd = promisify(denon.cmd).bind(denon);

export default async function handleCommand(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  let { cmd: cmdParam } = req.query;
  if (Array.isArray(cmdParam)) {
    cmdParam = cmdParam[0];
  }

  switch (cmdParam) {
    case KEYSTROKE.DENON.POWER: {
      try {
        const isOn = await getZonePowerState("ZM");
        await setZonePowerState(!isOn, "ZM");
        res.status(200).send({
          msg: `Command ${isOn ? "ZMSTANDBY" : "ZMON"} sent!`,
          data: !isOn,
        });
      } catch (error) {
        console.error("Denon command error (POWER):", error);
        res.status(500).send({ error });
      }
      break;
    }

    case KEYSTROKE.DENON.MUTE: {
      try {
        const isMuted = await getMuteState("ZM");
        await setMuteState(!isMuted, "ZM");
        res.status(200).send({
          msg: `Command ${isMuted ? "MUOFF" : "MUON"} sent!`,
          data: !isMuted,
        });
      } catch (error) {
        console.error("Denon command error (MUTE):", error);
        res.status(500).send({ error });
      }
      break;
    }

    case KEYSTROKE.DENON.MENU_TOGGLE: {
      try {
        // cmdAsync returns string[] — check if any line contains "MNMENON"
        const menuLines = await cmd("MNMEN?");
        const isMenuOn = menuLines?.some((line) => line.includes("MNMENON"));
        await cmd(`MNMEN ${isMenuOn ? "OFF" : "ON"}`);
        res.status(200).send({
          msg: `Command MNMEN ${isMenuOn ? "OFF" : "ON"} sent!`,
          data: !isMenuOn,
        });
      } catch (error) {
        console.error("Denon command error (MENU_TOGGLE):", error);
        res.status(500).send({ error });
      }
      break;
    }

    default: {
      try {
        const response = await cmd(cmdParam);
        res.status(200).send({
          msg: `Command ${cmdParam} sent!`,
          data: response,
        });
      } catch (error) {
        console.error(`Denon command error (${cmdParam}):`, error);
        res.status(500).send({ error });
      }
    }
  }
}
