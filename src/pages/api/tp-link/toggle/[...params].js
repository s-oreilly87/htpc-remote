import {Client} from 'tplink-smarthome-api'

export default function handleToggleSwitch(req, res) {
    let { params } = req.query
    const light = params[0]
    const powerState = params[1] === 'on'

    let ip;
    switch (light) {
        case 'basement': {
            ip = "192.168.1.24"
            break
        }
        case 'stairway': {
            ip = "192.168.1.194"
            break
        }
        case 'bedroom': {
            ip = "192.168.1.206"
        }
    }
    const client = new Client()
    client.getDevice({ host: ip }).then((device) => {
        device.setPowerState(powerState)
    });
    res.send('TPLink command sent!')
}
