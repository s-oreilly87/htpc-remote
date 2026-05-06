import * as robot from "@jitsi/robotjs";
import { Server } from "socket.io";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Server as HTTPServer } from "http";
import type { Socket } from "net";
import { getRobotState, setRobotState, type RobotState } from "@/api-modules/robot/robot-state";

interface OrientationPayload {
  x: number | string;
  y: number | string;
}

type OrientationVector = { x: number; y: number };

type SocketServer = Socket & {
  server: HTTPServer & { io?: Server };
};

type NextApiResponseWithSocket = NextApiResponse & { socket: SocketServer };

// No artificial delay — orientation events drive the pace via the socket.
robot.setMouseDelay(0);

function getDisplaySize(): RobotState["screenSize"] {
  const { width, height } = robot.getScreenSize();
  return { width, height };
}

function initializeAirmouse(x: number, y: number) {
  const screenSize = getDisplaySize();
  const centeredPosition = {
    x: Math.floor(screenSize.width / 2),
    y: Math.floor(screenSize.height / 2),
  };

  robot.moveMouse(centeredPosition.x, centeredPosition.y);

  setRobotState({
    isInitialized: true,
    screenSize,
    defaultRawOrientation: { x, y },
    centeredPosition,
    scaleFactor: { x: 12000, y: 7000 },
    awaitingInitialization: false,
  });
  console.log(
    `ROBOTJS: Airmouse initialized to centre of screen (${screenSize.width} x ${screenSize.height})`,
  );
}

function lerpAndFlipOrientation(orientation: OrientationVector): OrientationVector {
  const { defaultRawOrientation } = getRobotState();
  const dx = orientation.x - (defaultRawOrientation.x ?? 0);
  const dy = orientation.y - (defaultRawOrientation.y ?? 0);

  // Lerp offset into [-1, 1] over a ~60° (π/3 rad) range, then flip sign for
  // intuitive feel (tilting right moves cursor right, tilting down moves it down).
  const lerpedX = Math.max(Math.min(-(dx / (Math.PI / 3)) * 0.75, 1), -1);
  const lerpedY = Math.max(Math.min(-(dy / (Math.PI / 4)),         1), -1);

  return { x: lerpedX, y: lerpedY };
}

function getNewMousePos(x: number, y: number): OrientationVector {
  const { centeredPosition, scaleFactor, screenSize } = getRobotState();
  const lerped = lerpAndFlipOrientation({ x, y });

  return {
    x: Math.max(0, Math.min(
      (centeredPosition.x ?? 0) + lerped.x * (scaleFactor.x ?? 0),
      screenSize.width - 1,
    )),
    y: Math.max(0, Math.min(
      (centeredPosition.y ?? 0) + lerped.y * (scaleFactor.y ?? 0),
      screenSize.height - 1,
    )),
  };
}

let busy = false;

function handleOrientation(orientation: OrientationPayload) {
  if (busy) return;
  busy = true;

  if (!("x" in orientation) || !("y" in orientation)) {
    console.log("not an orientation!");
    busy = false;
    return;
  }

  const x = Number(orientation.x);
  const y = Number(orientation.y);

  if (Number.isNaN(x) || Number.isNaN(y)) {
    busy = false;
    return;
  }

  const robotState = getRobotState();

  if (!robotState.isInitialized) {
    if (robotState.awaitingInitialization) {
      busy = false;
      return;
    }
    setRobotState({ awaitingInitialization: true });
    initializeAirmouse(x, y);
    busy = false;
    return;
  }

  const newPos = getNewMousePos(x, y);
  const oldPos = robot.getMousePos();
  const dist = Math.sqrt((oldPos.x - newPos.x) ** 2 + (oldPos.y - newPos.y) ** 2);

  // robotjs moveMouse is always instant — both the large-jump and small-move cases
  // collapse into a single call. At socket event frequency, motion is smooth enough.
  if (dist > 0) {
    robot.moveMouse(Math.round(newPos.x), Math.round(newPos.y));
  }

  busy = false;
}

export default function handleInitializeSocket(
  req: NextApiRequest,
  res: NextApiResponseWithSocket,
) {
  if (res.socket.server.io) {
    res.send("Socket already running");
    return;
  }

  console.log("Socket is initializing . . .");
  const io = new Server(res.socket.server);
  res.socket.server.io = io;

  io.on("connection", (socket) => {
    console.log("socket connected!");
    socket.on("orientation", (orientation: OrientationPayload) => {
      handleOrientation(orientation);
    });
  });

  res.send("Socket created");
}
