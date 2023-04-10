const defaultState = {
    isInitialized: false,
    screenSize: { x:1920, y: 1080 },
    defaultRawOrientation: { x: null, y: null },
    centeredPosition: { x: null, y:null },
    scaleFactor: { x: null, y:null },
    calibrationRange: { xMin: null, xMax: null, yMin: null, yMax: null},
    awaitingInitialization: false
}

let state = {
    ...defaultState
};

export function initializeState() {
    state = {
        ...defaultState
    };
}
export function getNutState() {
    return state;
}

export function setNutState(props) {
    state = {...state, ...props}
}