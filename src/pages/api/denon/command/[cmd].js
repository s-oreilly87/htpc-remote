import { KEYSTROKE } from "@/utilities/constants";
import denon from "@/api-modules/denon/denon-telnet.js";
import { promisify } from "util";

const getZonePowerStateAsync = promisify(denon.getZonePowerState).bind(denon);
const setZonePowerStateAsync = promisify(denon.setZonePowerState).bind(denon);
const getMuteStateAsync = promisify(denon.getMuteState).bind(denon);
const setMuteStateAsync = promisify(denon.setMuteState).bind(denon);
const cmdAsync = promisify(denon.cmd).bind(denon);

export default async function handleCommand(req, res) {
  let { cmd } = req.query; //.toUpperCase() //probably unnecessary with constants refactor

  // Handle toggle commands with query and set in callback
  switch (cmd) {
    case KEYSTROKE.DENON.POWER:
      try {
        const powerState = await getZonePowerStateAsync("ZM");
        const powerStateOn = await setZonePowerStateAsync(!powerState, "ZM");
        res.status(200).send({
          msg: "Command " + (powerState ? "ZMSTANDBY" : "ZMON") + " sent!",
          data: powerStateOn,
        });
      } catch (error) {
        console.log("DENON_TELNET!! - Error: " + error);
        res.status(500).send({ error: error });
      }
      break;

    case KEYSTROKE.DENON.MUTE:
      try {
        const muteState = await getMuteStateAsync("ZM");
        const response = await setMuteStateAsync(!muteState, "ZM");
        res.status(200).send({
          msg: "Command " + (muteState ? "MUOFF" : "MUON") + " sent!",
          data: muteState ? "MUOFF" : "MUON",
        });
      } catch (error) {
        console.log("DENON_TELNET - Error: " + error);
        res.status(500).send({ error: error });
      }
      break;

    case KEYSTROKE.DENON.MENU_TOGGLE:
      try {
        const menuState = await cmdAsync("MNMEN?");
        const data = await cmdAsync(
          `MNMEN ${menuState === "ON" ? "OFF" : "ON"}`,
        );
        res.status(200).send({
          msg: "Command " + cmd + " sent!",
          data: cmd,
        });
      } catch (error) {
        console.log("DENON_TELNET - Error: " + error);
        res.status(500).send({ error: error });
      }
      break;

    default:
      // If not a toggle command, send it as is
      try {
        const response = await cmdAsync(cmd);
        res.status(200).send({
          msg: "Command " + cmd + " sent!",
          data: response,
        });
      } catch (error) {
        console.log("DENON_TELNET - Error: " + error);
        res.status(500).send({ error: error });
      }
  }
}
