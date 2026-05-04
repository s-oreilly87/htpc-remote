import { mouse } from "@nut-tree/nut-js";
import { ClickType } from "@/constants/remotes";

export default async function handleClick(req, res) {
  let { type } = req.query; //.toUpperCase() //probably unnecessary with constants refactor

  switch (type) {
    case ClickType.LEFT:
      await mouse.click(0);
      break;
    case ClickType.RIGHT:
      await mouse.click(2);
      break;
    case ClickType.DOUBLE:
      await mouse.doubleClick(0);
      break;
    default:
      res
        .status(400)
        .send(
          `No click 'type' specified. Values: {${ClickType.LEFT}, ${ClickType.RIGHT}, ${ClickType.DOUBLE}}`,
        );
  }

  res.status(200).send(`${type} click`);
}
