import type { NextApiRequest, NextApiResponse } from "next";
import { getNutState, setNutState } from "@/api-modules/nutjs/nut-state";

export default async function handleSetTopLeft(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { topLeft } = req.query; //.toUpperCase() //probably unnecessary with constants refactor
  const x = parseFloat(topLeft[0]);
  const y = parseFloat(topLeft[1]);

  const nutState = getNutState();
  setNutState({
    calibrationRange: { ...nutState.calibrationRange, xMin: x, yMin: y },
  });

  console.log(`NUTJS: Top Left Orientation Set:  x:${x}, y: ${y}`);
  res.send("Top Left Set");
}
