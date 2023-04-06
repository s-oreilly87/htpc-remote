import Constants, {
    DENON_HTTP_COMMANDS,
    DENON_HTTP_URL,
    DENON_SERVER_URL,
    EVENTGHOST_URL,
    NUTJS_URL,
    PROXY_URL,
    ROKU_POST_OPTIONS,
    ROKU_URL
} from "@/utilities/constants.js";

import {parseString} from "xml2js";
import {convertKebabToCamel} from "@/utilities/utils.js";


// ########   Roku Control   ########
export async function sendRokuQuery(query) {
    return await fetch(`${PROXY_URL}/${ROKU_URL}/query/${query}`)
}

export async function fetchRokuDeviceInfo() {
    let data
    const response = await fetch(`${Constants.PROXY_URL}/${Constants.ROKU_URL}/query/device-info`)
    if (200 !== response.status) {
        return {error: response.error}
    }
    const xmlText = await response.text()
    parseString(xmlText,
        {
            explicitArray: false,
            parseBooleans: true,
            normalize: true
        },
        (error, results) => {
            if (error) {
                console.error("Error parsing xml response from Roku")
            }
            data = {}
            Object.keys(results['device-info']).forEach(key => {
                const newKey = convertKebabToCamel(key)
                data[newKey] = results['device-info'][key] || null
            })
    })
    return data ? { data: data } : { error: "Parse error" }
}

export function sendRokuKeypress(button) {
    fetch(`${PROXY_URL}/${ROKU_URL}/keypress/${button.value}`, ROKU_POST_OPTIONS)
}

export function sendRokuKeydown(button) {
    fetch(`${Constants.PROXY_URL}/${Constants.ROKU_URL}/keydown/${button.value}`, Constants.ROKU_POST_OPTIONS)
}

export function sendRokuKeyup(button) {
    fetch(`${Constants.PROXY_URL}/${Constants.ROKU_URL}/keyup/${button.value}`, Constants.ROKU_POST_OPTIONS)
}

export function sendRokuLaunchCommand(button) {
    fetch(`${PROXY_URL}/${ROKU_URL}/launch/${button.value}`, ROKU_POST_OPTIONS)
}


// ########   PC Control   ########
export function sendEventToEventGhost(button, payload = "") {
    fetch(`${EVENTGHOST_URL}?${button.value}${payload ? `&${payload}` : ""}`, { mode: "no-cors"})
}

export function sendOrientationToNutJS(type, x, y) {
    fetch(`${NUTJS_URL}/${type}/${x}/${y}`, { mode: 'no-cors' })
}

export function sendClickToNutJS(button) {
    fetch(`${NUTJS_URL}/${button}Click/`, { mode: 'no-cors' })
}

export function sendKeystrokeToNutJS(key) {
    fetch(`${NUTJS_URL}/keystroke/${key}`, { mode: 'no-cors' })
}

export function sendDisableCommandToNutJS() {
    fetch(`${Constants.NUTJS_URL}/disable`, { mode: 'no-cors' })
}


// ########   Denon Control   ########
export async function sendDenonCommand(button, path="command") {
    const command = button.value

    // If we dont need the return value, commands can be sent with HTTP request
    if (DENON_HTTP_COMMANDS.includes(command)) {
        fetch(`${PROXY_URL}/${DENON_HTTP_URL}?${command}`, {mode: 'no-cors'})
        return { msg: command + "sent with HTTP request!" }
    }

    // If we need the return value (or to toggle) then we must use telnet with Denon Server
    const response = await fetch(`${PROXY_URL}/${DENON_SERVER_URL}/${path}/${command}`, { mode: 'cors' })
    const body = await response.json()

    if (200 === response.status) {
        // sendCommand returns body: { msg: "message", data: "newly set value" }
        // sendQuery returns body: { data: "param value" }
        return { data: body.data }
    } else {
        // error returns body: { error: "errormsg" }
        return { error: body.error }
    }
}

export async function sendDenonQuery(command) {
    return await sendDenonCommand({value: command}, "query")
}

export async function fetchMainZoneData() {
    let data
    const response = await fetch(`${Constants.PROXY_URL}/http://${Constants.DENON_IP}/goform/formMainZone_MainZoneXml.xml`, {mode: 'cors'})
    if (200 !== response.status) {
        return {error: response.error}
    }
    const xmlText = await response.text()

    parseString(xmlText,
        {
            explicitArray: false,
            normalize: true,
            mergeAttrs: true
        },
        (error, results) => {
            if (error) {
               return console.error("Error parsing xml response from Denon")
            }
            data = {}
            Object.keys(results.item).forEach(key => {
                const newKey = key.charAt(0).toLowerCase() + key.slice(1)
                if ((results.item[key].value instanceof Array)) {
                    data[newKey] = results.item[key].value || null
                } else {
                    data[newKey] = results.item[key].value.toUpperCase().replaceAll(" ", "_") || null
                }
            })
        })
    return data ? { data: data } : { error: "Parse error" }
}
