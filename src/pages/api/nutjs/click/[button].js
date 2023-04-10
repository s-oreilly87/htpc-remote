import {mouse} from "@nut-tree/nut-js";

export default async function handleClick(req, res) {
    let {button} = req.query   //.toUpperCase() //probably unnecessary with constants refactor

    switch(button) {
        case 'left':
            await mouse.click(0)
            break
        case 'right':
            await mouse.click(2)
            break
        default:
            console.log("/click used without parameter 'button'")
            await mouse.click(0)
    }

    res.status(200).send(`${button} click`)
}
