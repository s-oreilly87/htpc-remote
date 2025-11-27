export interface NutState {
  isInitialized: boolean;
  screenSize: { x: number; y: number };
  defaultRawOrientation: { x: number | null; y: number | null };
  centeredPosition: { x: number | null; y: number | null };
  scaleFactor: { x: number | null; y: number | null };
  calibrationRange: { xMin: number | null; xMax: number | null; yMin: number | null; yMax: number | null };
  awaitingInitialization: boolean;
}

const defaultState: NutState = {
  isInitialized: false,
  screenSize: { x: 1920, y: 1080 },
  defaultRawOrientation: { x: null, y: null },
  centeredPosition: { x: null, y: null },
  scaleFactor: { x: null, y: null },
  calibrationRange: { xMin: null, xMax: null, yMin: null, yMax: null },
  awaitingInitialization: false,
};

let state: NutState = { ...defaultState };

export function initializeState(): void {
  state = {
    ...defaultState,
  };
}
export function getNutState(): NutState {
  return state;
}

export function setNutState(props: Partial<NutState>): void {
  state = { ...state, ...props };
}
