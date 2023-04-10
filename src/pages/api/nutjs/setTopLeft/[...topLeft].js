import {getNutState, setNutState} from "@/api-modules/nutjs/nut-state.js";

export default async function handleSetTopLeft(req, res) {
    const { topLeft } = req.query   //.toUpperCase() //probably unnecessary with constants refactor
    const x = parseFloat(topLeft[0])
    const y = parseFloat(topLeft[1])

    setNutState({calibrationRange: { xMin: x, yMin: y }})

    console.log(`NUTJS: Top Left Orientation Set:  x:${x}, y: ${y}`)
    res.send('Top Left Set');
}
