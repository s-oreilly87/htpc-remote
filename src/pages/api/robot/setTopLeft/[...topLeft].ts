import type { NextApiRequest, NextApiResponse } from "next";
import { getRobotState, setRobotState } from "@/api-modules/robot/robot-state";

export default async function handleSetTopLeft(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { topLeft } = req.query;
  const x = parseFloat(topLeft[0]);
  const y = parseFloat(topLeft[1]);

  const robotState = getRobotState();
  setRobotState({
    calibrationRange: { ...robotState.calibrationRange, xMin: x, yMin: y },
  });

  console.log(`ROBOTJS: Top Left Orientation Set: x:${x}, y:${y}`);
  res.send("Top Left Set");
}
