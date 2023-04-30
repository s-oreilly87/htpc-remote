import {DENON_HTTP_COMMANDS, ROKU_POST_OPTIONS,} from "@/utilities/constants.js";

import {parseString} from "xml2js";
import {convertKebabToCamel} from "@/utilities/utils.js";


// ########   Roku Control   ########
export async function sendRokuQuery(query) {
    return await fetch(`api/roku/query/${query}`)
}

export async function fetchRokuChannels() {
    const response = await fetch('api/roku/query/apps')

    if (200 !== response.status) {
        return {error: response.error}
    }
    const xmlText = await response.text()
    let channels
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
            channels = {}

            let apps = [...results.apps.app]

            channels =  Object.values(apps).map((app) => {
                return { id: app.$.id, label: app._ }
            })
        })
    return channels ? { data: channels } : { error: "Parse error" }
}
export async function fetchRokuDeviceInfo() {
    let data
    const response = await fetch(`api/roku/query/device-info`)
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
    fetch(`api/roku/keypress/${button.value}`, ROKU_POST_OPTIONS)
}

export function sendRokuKeydown(button) {
    fetch(`api/roku/keydown/${button.value}`, ROKU_POST_OPTIONS)
}

export function sendRokuKeyup(button) {
    fetch(`api/roku/keyup/${button.value}`, ROKU_POST_OPTIONS)
}

export function sendRokuLaunchCommand(button) {
    fetch(`api/roku/launch/${button.value}`, ROKU_POST_OPTIONS)
}


// ########   PC Control   ########
export async function sendEventToEventGhost(button, payload = "") {
    await fetch(`api/eventghost/${button.value}${payload ? `&${payload}` : ""}`)
}

export function sendOrientationToNutJS(type, x, y) {
    fetch(`api/nutjs/${type}/${x}/${y}`, { mode: 'no-cors' })
}

export function sendClickToNutJS(type) {
    fetch(`api/nutjs/click/${type}`, { mode: 'no-cors' })
}

export function sendKeystrokeToNutJS(key) {
    fetch(`api/nutjs/keystroke/${key}`, { mode: 'no-cors' })
}

export function sendDisableCommandToNutJS() {
    fetch(`api/nutjs/disable`, { mode: 'no-cors' })
}


// ########   Denon Control   ########
export async function sendDenonCommand(button, path="command") {
    const command = button.value

    // If we dont need the return value, commands can be sent with HTTP request
    if (DENON_HTTP_COMMANDS.includes(command)) {
        fetch(`api/denon-http/command/${command}`,)
        return { msg: command + "sent with HTTP request!" }
    }

    // If we need the return value (or to toggle) then we must use telnet with Denon Server
    const response = await fetch(`api/denon/${path}/${command}`)
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

export async function sendDenonQuery(query) {
    return await sendDenonCommand({value: query}, "query")
}

export async function fetchMainZoneData() {
    let data
    const response = await fetch(`api/denon-http/queryMainZone`)
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
