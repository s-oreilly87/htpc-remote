//TODO: get locals into here
import { getNutState, setNutState } from "@/api-modules/nutjs/nut-state.js";

export default async function handleSetBottomRight(req, res) {
  const { bottomRight } = req.query; //.toUpperCase() //probably unnecessary with constants refactor
  const x = parseFloat(bottomRight[0]);
  const y = parseFloat(bottomRight[1]);

  setNutState({ calibrationRange: { xMax: x, yMax: y } });

  console.log(`NUTJS: Bottom Right Orientation Set:  x: ${x}, y: ${y}`);
  const nutState = getNutState();
  setNutState({
    scaleFactor: {
      x:
        nutState.screenSize.width /
        (nutState.calibrationRange.xMax - nutState.calibrationRange.xMin),
      y:
        nutState.screenSize.height /
        (nutState.calibrationRange.yMax - nutState.calibrationRange.yMin),
    },
  });

  console.log(
    `NUTJS: Set scaleFactor to { x: ${nutState.scaleFactor.x}, y: ${nutState.scaleFactor.y} }`,
  );
  res.send("Bottom Right set and scaling adjusted");
}
