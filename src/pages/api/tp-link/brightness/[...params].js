import {Client} from 'tplink-smarthome-api'
import {toNumber} from "lodash";

export default function handleBrightness(req, res) {
    let { params } = req.query
    const light = params[0]
    const brightnessLevel = toNumber(params[1])
    let ip;
    switch (light) {
        case 'basement': {
            ip = "192.168.1.24"
            break
        }
        default: {
            return res.send('Error: Switch not dimmable!')
        }
    }
    const client = new Client()
    client.getDevice({ host: ip }).then((device) => {
        device.dimmer.setBrightness(brightnessLevel).then(response => console.log(response))
    });

    res.send('TPLink command sent!')
}
