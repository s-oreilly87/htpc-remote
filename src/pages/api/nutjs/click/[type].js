import { mouse } from "@nut-tree/nut-js";
import { CLICK_TYPE } from "@/utilities/constants";

export default async function handleClick(req, res) {
  let { type } = req.query; //.toUpperCase() //probably unnecessary with constants refactor

  switch (type) {
    case CLICK_TYPE.LEFT:
      await mouse.click(0);
      break;
    case CLICK_TYPE.RIGHT:
      await mouse.click(2);
      break;
    case CLICK_TYPE.DOUBLE:
      await mouse.doubleClick(0);
      break;
    default:
      res
        .status(400)
        .send(
          `No click 'type' specified. Values: {${CLICK_TYPE.LEFT}, ${CLICK_TYPE.RIGHT}, ${CLICK_TYPE.DOUBLE}}`,
        );
  }

  res.status(200).send(`${type} click`);
}
