//TODO: get locals into here
import type { NextApiRequest, NextApiResponse } from "next";
import { getNutState, setNutState } from "@/api-modules/nutjs/nut-state";

export default async function handleSetBottomRight(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { bottomRight } = req.query; //.toUpperCase() //probably unnecessary with constants refactor
  const x = parseFloat(bottomRight[0]);
  const y = parseFloat(bottomRight[1]);

  const nutState = getNutState();
  const calibrationRange = { ...nutState.calibrationRange, xMax: x, yMax: y };

  setNutState({ calibrationRange });

  console.log(`NUTJS: Bottom Right Orientation Set:  x: ${x}, y: ${y}`);
  const scaleFactor = {
    x:
      nutState.screenSize.width /
      ((calibrationRange.xMax ?? 0) - (calibrationRange.xMin ?? 0)),
    y:
      nutState.screenSize.height /
      ((calibrationRange.yMax ?? 0) - (calibrationRange.yMin ?? 0)),
  };

  setNutState({ scaleFactor });

  console.log(
    `NUTJS: Set scaleFactor to { x: ${scaleFactor.x}, y: ${scaleFactor.y} }`,
  );
  res.send("Bottom Right set and scaling adjusted");
}
