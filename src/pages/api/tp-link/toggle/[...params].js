import {Client} from 'tplink-smarthome-api'
import {LIGHTSWITCHES} from '@/utilities/constants.js'

export default function handleToggleSwitch(req, res) {
    let { params } = req.query
    const light = params[0]
    const powerState = params[1] === 'on'

    let ip;
    switch (light) {
        case LIGHTSWITCHES.BASEMENT.id: {
            ip = LIGHTSWITCHES.BASEMENT.ip
            break
        }
        case LIGHTSWITCHES.STAIRWAY.id: {
            ip = LIGHTSWITCHES.STAIRWAY.ip
            break
        }
        case LIGHTSWITCHES.BEDROOM.id: {
            ip = LIGHTSWITCHES.BEDROOM.ip
        }
    }
    const client = new Client()
    client.getDevice({ host: ip }).then((device) => {
        device.setPowerState(powerState)
    });
    res.send('TPLink command sent!')
}
