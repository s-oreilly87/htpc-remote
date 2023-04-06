import express from 'express'
import DenonTelnet from './denon-telnet.js'
import {DENON_IP, KEYSTROKE} from '../src/utilities/constants.js'

const denonState = {
    powerOn: true,
    muteOn: false,
    input: "",
    soundMode: "",
    dynComp: "",
    psDilOn: false,
    PSDIL: 0,  //needs to be int so it can be incremented
    PSDYNEQ: "OFF",
    PSREFLEV: "0",
    PSDYNVOL: "OFF"
}

const QUERY_NO_SPACE = ["PW", "ZM", "MV", "CV", "MU", "SI", "SD", "DC", "SV", "SLP", "ECO", "STBY", "MS"]

const denonApp = express();
const denon = new DenonTelnet(DENON_IP)

denonApp.get('/api', function (req, res) {
    res.send('Denon API is running');
});

denonApp.get('/command/:command', async function (req, res) {
    let cmd = req.params.command.toUpperCase() //probably unnecessary with constants refactor

    // Handle toggle commands with query and set in callback
    if (cmd === KEYSTROKE.DENON.POWER) {
        const togglePowerCallback = async (error, powerState) => {
            if (error) {
                console.log("DENON_TELNET - Error: " + error)
            } else {
                await denon.setZonePowerState(
                    !powerState,
                    (error, data) => {
                        if (error) {
                            console.log(error)
                        }
                        res.status(200).send({
                            msg: "Command " + (powerState ? "ZMSTANDBY" : "ZMON") + " sent!",
                            data: powerState ? "ZMSTANDBY" : "ZMON"
                        })
                    },
                    "ZM"
                )
            }
        }

        return denon.getZonePowerState(togglePowerCallback, "ZM");
    }

    if (cmd === KEYSTROKE.DENON.MUTE) {
        const toggleMuteCallback = async (error, muteState) => {
            if (error) {
                console.log("DENON_TELNET - Error: " + error)
            } else {
                await denon.setMuteState(
                    !muteState,
                    (error, data) => {
                        res.status(200).send({
                            msg: "Command "  + (muteState ? "MUOFF" : "MUON") + " sent!",
                            data: muteState ? "MUOFF" : "MUON"
                        })
                    },
                    "ZM"
                )
            }
        }

      return denon.getMuteState(toggleMuteCallback, "ZM")
    }

    if (cmd === KEYSTROKE.DENON.MENU_TOGGLE) {
        const toggleMenuCallback = async (error, data) => {
            let menuState = data[0].split(" ")[1]
            if (error) {
                console.log("DENON-TELNET - Error: " + error)
            } else {
                const cmd = menuState === "ON" ? "MNMEN OFF" : "MNMEN ON"
                await denon.cmd(
                    cmd,
                    (error, data) => {
                        res.status(200).send({
                            msg: "Command "  + cmd + " sent!",
                            data: cmd
                        })
                    }
                )
            }
        }

        return denon.cmd("MNMEN?", toggleMenuCallback)
    }

    // If not a toggle command, send it as is
    const callback = (error, data) => {
        if (error) {
            console.log("DENON-TELNET - Error: " + error)
            res.status(500).send({ error: error })
        } else {
            res.status(200).send({
                msg: "Command "  + cmd + " sent!",
                data: data })
        }
    }

    denon.cmd(cmd, callback)
});

denonApp.get('/query/:command', function(req, res) {
    const cmd = req.params.command.toUpperCase() // toUpperCase() probably not necessary after the constants refactor

    const callback = (error, data) => {
        if (error) {
            console.log("DENON-TELNET - error: " + error)
            res.status(500).send({ error: error })
        } else {
            res.status(200).send({ data: data })
        }
    }

    if (QUERY_NO_SPACE.includes(cmd)) {
        denon.cmd(cmd + '?', callback)
    } else {
        denon.cmd(cmd + ' ?', callback)

    }
})

export default denonApp