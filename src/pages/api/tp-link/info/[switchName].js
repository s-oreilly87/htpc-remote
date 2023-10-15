import {Client} from 'tplink-smarthome-api'
import {LIGHTSWITCHES} from "@/utilities/constants.js";


export default async function handleInfo(req, res) {
    let { switchName } = req.query

    const client = new Client()
    // client.on('error', (e) => {console.log(e)})

    let responseObject = {}

    async function getSwitchInfo(switchName) {
        const lightSwitch = Object.values(LIGHTSWITCHES).find(lightSwitch => lightSwitch.id === switchName)

        try {
            const device = await client.getDevice({host: lightSwitch.ip}, {timeout: 2000})
            const {sysInfo} = await device.getInfo()
            responseObject[lightSwitch.id] = {powerState: sysInfo.relay_state === 1, brightness: sysInfo.brightness}
        } catch (e) {
            responseObject[lightSwitch.id] = {error: 'could-not-connect'}
            console.log("Lightswitch not found")
        }
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
