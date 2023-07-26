import {Client} from 'tplink-smarthome-api'
import {LIGHTSWITCHES} from "@/utilities/constants.js";


export default async function handleInfo(req, res) {
    let { switchName } = req.query

    const client = new Client()

    let responseObject = {}

    async function getSwitchInfo(switchName) {
        const lightSwitch = Object.values(LIGHTSWITCHES).find(lightSwitch => lightSwitch.id === switchName)
        const device = await client.getDevice({ host: lightSwitch.ip })
        const { sysInfo } = await device.getInfo()
        responseObject[lightSwitch.id] = { powerState: sysInfo.relay_state === 1, brightness: sysInfo.brightness }
    }


    if (switchName === LIGHTSWITCHES.BASEMENT.id || switchName === 'all') {
        await getSwitchInfo(LIGHTSWITCHES.BASEMENT.id)
    }

    if (switchName === LIGHTSWITCHES.STAIRWAY.id || switchName === 'all') {
        await getSwitchInfo(LIGHTSWITCHES.STAIRWAY.id)
    }

    if (!switchName || switchName === LIGHTSWITCHES.BEDROOM.id || switchName === 'all') {
        await getSwitchInfo(LIGHTSWITCHES.BEDROOM.id)
    }

    res.send(responseObject)
}
