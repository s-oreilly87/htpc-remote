import type { NextApiRequest, NextApiResponse } from "next";
import { getRobotState, setRobotState } from "@/api-modules/robot/robot-state";

export default async function handleSetBottomRight(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { bottomRight } = req.query;
  const x = parseFloat(bottomRight[0]);
  const y = parseFloat(bottomRight[1]);

  const robotState = getRobotState();
  const calibrationRange = { ...robotState.calibrationRange, xMax: x, yMax: y };

  setRobotState({ calibrationRange });

  const scaleFactor = {
    x:
      robotState.screenSize.width /
      ((calibrationRange.xMax ?? 0) - (calibrationRange.xMin ?? 0)),
    y:
      robotState.screenSize.height /
      ((calibrationRange.yMax ?? 0) - (calibrationRange.yMin ?? 0)),
  };

  setRobotState({ scaleFactor });

  console.log(`ROBOTJS: Bottom Right Set — scaleFactor: { x: ${scaleFactor.x}, y: ${scaleFactor.y} }`);
  res.send("Bottom Right set and scaling adjusted");
}
