import { Server } from "socket.io";
import { mouse, Point, screen, straightTo } from "@nut-tree/nut-js";
import { getNutState, setNutState } from "@/api-modules/nutjs/nut-state";

let busy = false;
async function initializeAirmouse(x, y) {
  const screenSize = await getDisplaySize();
  const centeredPosition = {
    x: Math.floor(screenSize.width / 2),
    y: Math.floor(screenSize.height / 2),
  };

  //console.log(`NUTJS: Moving mouse to centre: ${centeredPosition.x},${centeredPosition.y}`)
  mouse.config.mouseSpeed = 2000;
  const centre = new Point(centeredPosition.x, centeredPosition.y);
  await mouse.move(straightTo(centre));
  mouse.config.mouseSpeed = 15000;

  setNutState({
    isInitialized: true,
    screenSize: screenSize,
    defaultRawOrientation: { x: x, y: y },
    centeredPosition: centeredPosition,
    scaleFactor: { x: 12000, y: 7000 },
    awaitingInitialization: false,
  });
  console.log(
    `NUTJS: Airmouse initialized to centre of screen (${screenSize.width} X ${screenSize.height})`,
  );
}

async function getDisplaySize() {
  const width = await screen.width();
  const height = await screen.height();
  return { width: width, height: height };
}

async function lerpAndFlipOrientation(orientation) {
  const nutState = getNutState();

  // offset from default
  let x = orientation.x - nutState.defaultRawOrientation.x;
  let y = orientation.y - nutState.defaultRawOrientation.y;

  // Calculate the lerped x value between -1 and 1
  let lerpedX = (x / (Math.PI / 3)) * 0.75; // Assumes a range of 60 degrees (Math.PI/3 radians) and a lerping range of -0.5 to 0.5

  // Ensure the lerped value is within the range of -1 to 1
  lerpedX = Math.max(Math.min(lerpedX), -1);

  // Flip the sign on the x value to be more intuitive
  lerpedX = -1 * lerpedX;

  // Calculate the lerped y value between -1 and 1
  let lerpedY = y / (Math.PI / 4); // Assumes a range of 60 degrees (Math.PI/3 radians) and a lerping range of -0.5 to 0.5

  // Ensure the lerped value is within the range of -1 to 1
  lerpedY = Math.max(Math.min(lerpedY, 1), -1);

  // Flip the sign on the y value to be more intuitive
  lerpedY = -1 * lerpedY;

  // Return the lerped orientation with the flipped x value
  return { x: lerpedX, y: lerpedY };
}

async function getNewMousePos(x, y) {
  const nutState = getNutState();
  const lerped = await lerpAndFlipOrientation({ x: x, y: y });

  let newMousePos = {
    x: nutState.centeredPosition.x + lerped.x * nutState.scaleFactor.x,
    y: nutState.centeredPosition.y + lerped.y * nutState.scaleFactor.y,
  };

  if (newMousePos.x > nutState.screenSize.width - 1) {
    newMousePos.x = nutState.screenSize.width - 1;
  } else if (newMousePos.x < 0) {
    newMousePos.x = 0;
  }

  if (newMousePos.y > nutState.screenSize.height - 1) {
    newMousePos.y = nutState.screenSize.height - 1;
  } else if (newMousePos.y < 0) {
    newMousePos.y = 0;
  }

  return newMousePos;
}

async function handleOrientation(orientation) {
  if (busy) {
    return;
  }
  busy = true;
  if (!orientation.hasOwnProperty("x") || !orientation.hasOwnProperty("y")) {
    console.log("not an orientation!");
    busy = false;
    return; //res.status(500).send('not an orientation')
  }

  const x = parseFloat(orientation.x);
  const y = parseFloat(orientation.y);
  const nutState = getNutState();
  // if its the first request, initialize (set default position, and move cursor to centre)
  if (!nutState.isInitialized) {
    if (nutState.awaitingInitialization) {
      busy = false;
      return; //res.send(" ... awaiting initialization ...")
    }

    setNutState({ awaitingInitialization: true });
    await initializeAirmouse(x, y);
    busy = false;
    return; //res.send("Initialization Complete")
  }

  if (!x || !y) {
    return; //res.send("Bad orientation. Use '/api/nutjs/orientation/x :float/y :float'")
  }

  const newMousePos = await getNewMousePos(x, y);

  const oldMousePos = await mouse.getPosition();

  if (
    Math.sqrt(
      Math.pow(oldMousePos.x - newMousePos.x, 2) +
        Math.pow(oldMousePos.y - newMousePos.y, 2),
    ) > 150
  ) {
    await mouse.setPosition(new Point(newMousePos.x, newMousePos.y));
  } else {
    await mouse.move(straightTo(new Point(newMousePos.x, newMousePos.y)));
  }

  busy = false;
  //res.send(`Mouse moved to x: ${newMousePos.x}, y: ${newMousePos.y}`)
}

export default function handleInitializeSocket(req, res) {
  if (res.socket.server.io) {
    res.send("Socket already running");
  } else {
    console.log("Socket is initializing . . .");
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("socket connected!");
      socket.on("orientation", (orientation) => {
        handleOrientation(orientation);
      });
    });

    res.send("Socket created");
  }
}

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
