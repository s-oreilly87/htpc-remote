import express from 'express'
import {Key, keyboard, mouse, Point, screen, straightTo} from '@nut-tree/nut-js'

import {KEYSTROKE} from '../src/utilities/constants.js'

const defaultLocals = {
    isInitialized: false,
    screenSize: { x:1920, y: 1080 },
    defaultRawOrientation: { x: null, y: null },
    centeredPosition: { x: null, y:null },
    scaleFactor: { x: null, y:null },
    calibrationRange: { xMin: null, xMax: null, yMin: null, yMax: null,
    awaitingInitialization: false}
}

const nutKeyMap = {
    [KEYSTROKE.PC.ENTER]: Key.Enter,
    [KEYSTROKE.PC.BACKSPACE]: Key.Backspace,
    [KEYSTROKE.PC.WIN_KEY]: Key.LeftWin,
    [KEYSTROKE.PC.ESCAPE]: Key.Escape,
    [KEYSTROKE.PC.TAB]: Key.Tab,
    [KEYSTROKE.PC.UP]: Key.Up,
    [KEYSTROKE.PC.DOWN]: Key.Down,
    [KEYSTROKE.PC.LEFT]: Key.Left,
    [KEYSTROKE.PC.RIGHT]: Key.Right,
    [KEYSTROKE.PC.VOL_UP]: Key.AudioVolUp,
    [KEYSTROKE.PC.VOL_DOWN]: Key.AudioVolDown,
    [KEYSTROKE.PC.MUTE]: Key.AudioMute,
    [KEYSTROKE.PC.PREV]: Key.AudioPrev,
    [KEYSTROKE.PC.REWIND]: Key.Left,
    [KEYSTROKE.PC.PLAY]: Key.AudioPlay,
    [KEYSTROKE.PC.FFWD]: Key.Right,
    [KEYSTROKE.PC.NEXT]: Key.AudioNext
}

const nutApp = express()

initializeLocals()

keyboard.config.autoDelayMs = 50

function initializeLocals() {
    for (const prop of Object.keys(defaultLocals)) {
        nutApp.locals[prop] = defaultLocals[prop]
    }
}

async function initializeAirmouse(x, y) {
    nutApp.locals.isInitialized = true
    nutApp.locals.screenSize = await getDisplaySize();

    console.log('NUTJS: Airmouse initialized. screenWidth: ' + nutApp.locals.screenSize.width + ", screenHeight: " + nutApp.locals.screenSize.height)

    nutApp.locals.defaultRawOrientation = { x: x, y: y }
    nutApp.locals.centeredPosition = {
        x: Math.floor(nutApp.locals.screenSize.width / 2),
        y: Math.floor(nutApp.locals.screenSize.height / 2)
    }
    nutApp.locals.scaleFactor = {x: 12000, y: 7000}
    nutApp.locals.calibrationRange = { xMin: null, xMax: null, yMin: null, yMax: null }

    console.log("NUTJS: Moving mouse to centre: " + nutApp.locals.centeredPosition.x + ", " + nutApp.locals.centeredPosition.y )
    mouse.config.mouseSpeed = 2000
    const centre = new Point(nutApp.locals.centeredPosition.x, nutApp.locals.centeredPosition.y)
    await mouse.move(straightTo(centre))
    mouse.config.mouseSpeed = 15000

    nutApp.locals.awaitingInitialization = false
}

async function getDisplaySize() {
    const width = await screen.width()
    const height = await screen.height()
    return { width: width, height: height }
}

function lerpAndFlipOrientation(orientation) {

    // offset from default
    let x = orientation.x - nutApp.locals.defaultRawOrientation.x
    let y = orientation.y - nutApp.locals.defaultRawOrientation.y

    // Calculate the lerped x value between -1 and 1
    let lerpedX = (x / (Math.PI / 3)) * 0.75 // Assumes a range of 60 degrees (Math.PI/3 radians) and a lerping range of -0.5 to 0.5

    // Ensure the lerped value is within the range of -1 to 1
    lerpedX = Math.max(Math.min(lerpedX, ), -1)

    // Flip the sign on the x value to be more intuitive
    lerpedX = -1 * lerpedX

    // Calculate the lerped y value between -1 and 1
    let lerpedY = (y / (Math.PI / 4)) // Assumes a range of 60 degrees (Math.PI/3 radians) and a lerping range of -0.5 to 0.5

    // Ensure the lerped value is within the range of -1 to 1
    lerpedY = Math.max(Math.min(lerpedY, 1), -1)

    // Flip the sign on the y value to be more intuitive
    lerpedY = -1 * lerpedY

    // Return the lerped orientation with the flipped x value
    return { x: lerpedX, y: lerpedY }
}

nutApp.get('/orientation/:x/:y', async function(req, res) {

    // if its the first request, initialize (set default position, and move cursor to centre)
    if (!req.app.locals.isInitialized) {
        if (req.app.locals.awaitingInitialization) {
            return
        }
        req.app.locals.awaitingInitialization = true
        await initializeAirmouse(parseFloat(req.params.x) , parseFloat(req.params.y))
        return
    }

    if (!req.params.x || !req.params.y) {
        return
    }
    const orientation = lerpAndFlipOrientation({ x: parseFloat(req.params.x), y: parseFloat(req.params.y) })

    let moveMouseTo = {
        x: req.app.locals.centeredPosition.x + orientation.x * req.app.locals.scaleFactor.x,
        y: req.app.locals.centeredPosition.y + orientation.y * req.app.locals.scaleFactor.y
    }

    if (moveMouseTo.x > req.app.locals.screenSize.width - 1) {
        moveMouseTo.x = req.app.locals.screenSize.width - 1
    } else if (moveMouseTo.x < 0) {
        moveMouseTo.x = 0
    }

    if (moveMouseTo.y > req.app.locals.screenSize.height - 1) {
        moveMouseTo.y = req.app.locals.screenSize.height - 1
    } else if (moveMouseTo.y < 0) {
        moveMouseTo.y = 0
    }

    await mouse.move(straightTo(new Point(moveMouseTo.x, moveMouseTo.y)))
    res.send(`Mouse moved to x: ${moveMouseTo.x}, y: ${moveMouseTo.y}`)
});

nutApp.get('/leftClick', async (req, res) => {
    await mouse.click(0)

    res.send('Mouse Left-clicked');
});

nutApp.get('/rightClick', async (req, res) => {
    await mouse.click(2)

    res.send('Mouse Right-clicked');
});

nutApp.get('/setTopLeft/:x/:y', (req, res) => {
    const topLeftOrientation = lerpAndFlipOrientation({ x: parseFloat(req.params.x), y: parseFloat(req.params.y) })

    req.app.locals.calibrationRange.xMin = topLeftOrientation.x
    req.app.locals.calibrationRange.yMin = topLeftOrientation.y

    console.log("NUTJS: Top Left Orientation Set:  x: " + topLeftOrientation.x + ", y: " + topLeftOrientation.y)
    res.send('Top Left Set');
});

nutApp.get('/setBottomRight/:x/:y', (req, res) => {
    const bottomRightOrientation = lerpAndFlipOrientation({ x: parseFloat(req.params.x), y: parseFloat(req.params.y)})

    req.app.locals.calibrationRange.xMax = bottomRightOrientation.x
    req.app.locals.calibrationRange.yMax = bottomRightOrientation.y

    console.log("NUTJS: Bottom Right Orientation Set:  x: " + bottomRightOrientation.x + " , y: " + bottomRightOrientation.y)

    req.app.locals.scaleFactor.x = req.app.locals.screenSize.width / (req.app.locals.calibrationRange.xMax - req.app.locals.calibrationRange.xMin)
    req.app.locals.scaleFactor.y = req.app.locals.screenSize.height / (req.app.locals.calibrationRange.yMax - req.app.locals.calibrationRange.yMin)

    console.log(`NUTJS: Set scaleFactor to { x: ${req.app.locals.scaleFactor.x}, y: ${req.app.locals.scaleFactor.y} }`)
    res.send('Bottom Right set and scaling adjusted');
});

nutApp.get('/disable', (req, res) => {
    console.info("NUTJS: Airmouse disabled and defaults reset")
    initializeLocals()
    res.send('Airmouse disabled (defaults reset)');
});


// ##### Keyboard Functions #####

nutApp.get('/keystroke/:key', async (req, res) => {
    let key = req.params.key
    if (key.length > 1) {
        if (nutKeyMap.hasOwnProperty(key)) {
            key = nutKeyMap[key]
        } else {
            key = key + " "
        }
    }

    await keyboard.type(key)

    res.send("key '" + req.params.key + "' pressed")
});

export default nutApp

// Function to find the angle for lerping

//function calculateAngle(topLeft, bottomRight) {
//     // Calculate the difference in x values between the two points
//     const dx = bottomRight.x - topLeft.x;
//
//     // Calculate the angle between the two points using atan
//     const angle = Math.atan(dx / topLeft.y);
//
//     // Return the angle in degrees
//     return angle * (180 / Math.PI);
//