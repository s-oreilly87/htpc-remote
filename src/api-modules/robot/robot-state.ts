export interface RobotState {
  isInitialized: boolean;
  screenSize: { width: number; height: number };
  defaultRawOrientation: { x: number | null; y: number | null };
  centeredPosition: { x: number | null; y: number | null };
  scaleFactor: { x: number | null; y: number | null };
  calibrationRange: { xMin: number | null; xMax: number | null; yMin: number | null; yMax: number | null };
  awaitingInitialization: boolean;
}

const defaultState: RobotState = {
  isInitialized: false,
  screenSize: { width: 1920, height: 1080 },
  defaultRawOrientation: { x: null, y: null },
  centeredPosition: { x: null, y: null },
  scaleFactor: { x: null, y: null },
  calibrationRange: { xMin: null, xMax: null, yMin: null, yMax: null },
  awaitingInitialization: false,
};

let state: RobotState = { ...defaultState };

export function resetRobotState(): void {
  state = { ...defaultState };
}

export function getRobotState(): RobotState {
  return state;
}

export function setRobotState(props: Partial<RobotState>): void {
  state = { ...state, ...props };
}
