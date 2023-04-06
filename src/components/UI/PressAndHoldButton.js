import {REMOTE} from "@/utilities/constants.js";
import {useState} from "react";
import {
    sendDenonCommand,
    sendEventToEventGhost,
    sendKeystrokeToNutJS,
    sendRokuKeydown,
    sendRokuKeypress,
    sendRokuKeyup
} from "@/utilities/http";
import {buttonPress} from "@/utilities/utils";

const PressAndHoldButton = ({ remote, children, ...props }) => {

    const [isHeld, setIsHeld] = useState(false);
    const [touchTimer, setTouchTimer] = useState(null);
    const [vibrateInterval, setVibrateInterval] = useState(null);
    const [sendKeyInterval, setSendKeyInterval] = useState(null);
    const [buttonPressTimer, setButtonPressTimer] = useState(null)

    const pressAndHoldVibration = () => {
        setVibrateInterval(setInterval(() => navigator.vibrate(1), 75))
    };

    // ########  FOR PC  ########

    // SIMULATE keydown by sending keypress repeatedly instead of keydown event
    const pcSimulatePressAndHoldStart = button => {
        if (button.value.startsWith("KEYSTROKE")) {
            sendKeystrokeToNutJS(button.value)
        } else {
            sendEventToEventGhost(REMOTE.PC, button)
        }

        buttonPress(button, buttonPressTimer, setButtonPressTimer)
        setTouchTimer(setTimeout(() => {
            pressAndHoldVibration()
            setSendKeyInterval(setInterval(() =>sendKeystrokeToNutJS(button.value), 150))
        }, 500))
    };

    const pcSimulatePressAndHoldEnd = button => {
        clearTimeout(touchTimer)
        clearInterval(sendKeyInterval)
        clearInterval(vibrateInterval)
    };

    //  Send keydown payload to EG to trigger actual keydown/keyup events - NOT USING
    function pcPressAndHoldStart(button) {
        sendEventToEventGhost(button, "-keydown")
        setTouchTimer(setTimeout(() => {
            setIsHeld(true)
            pressAndHoldVibration()
        }, 500))
    }

    function pcPressAndHoldEnd(button) {
        clearTimeout(touchTimer)
        if (isHeld) {
            sendEventToEventGhost(button, "-keyup")
            clearInterval(vibrateInterval)
            setIsHeld(false)
        }
    }


    // ########   FOR ROKU  ########
    function rokuPressAndHoldStart(button) {
        sendRokuKeypress(button)
        buttonPress(button, buttonPressTimer, setButtonPressTimer)
        setTouchTimer(setTimeout(() => {
            setIsHeld(true)
            sendRokuKeydown(button)
            pressAndHoldVibration()
        }, 500))
    }

    function rokuPressAndHoldEnd(button) {
        clearTimeout(touchTimer)
        if (isHeld) {
            sendRokuKeyup(button)
            clearInterval(vibrateInterval)
            setIsHeld(false)
        }
    }

    // #######  FOR DENON  #######

    // SIMULATE keydown by sending keypress repeatedly instead of keydown event
    const denonSimulatePressAndHoldStart = button => {
        sendDenonCommand(button)
        buttonPress(button, buttonPressTimer, setButtonPressTimer)
        setTouchTimer(setTimeout(() => {
            pressAndHoldVibration()
            setSendKeyInterval(setInterval(() => sendDenonCommand(button), 100))
        }, 500))
    }

    const denonSimulatePressAndHoldEnd = button => {
        clearTimeout(touchTimer)
        clearInterval(sendKeyInterval)
        clearInterval(vibrateInterval)
    }

    const handleStartPressAndHold = event => {
        switch (remote) {
            case REMOTE.ROKU: {
                return rokuPressAndHoldStart(event.currentTarget)
            }
            case REMOTE.PC: {
                return pcSimulatePressAndHoldStart(event.currentTarget)
            }
            case REMOTE.DENON: {
                return denonSimulatePressAndHoldStart(event.currentTarget)
            }
        }
    }

    const handleEndPressAndHold = event => {
        event.preventDefault()  // prevents request being send twice
        switch (remote) {
            case REMOTE.ROKU: {
                return rokuPressAndHoldEnd(event.currentTarget)
            }
            case REMOTE.PC: {
                return pcSimulatePressAndHoldEnd(event.currentTarget)
            }
            case REMOTE.DENON: {
                return denonSimulatePressAndHoldEnd(event.currentTarget)
            }
        }
        event.currentTarget.blur()
    }

    return (
        <button
            {...props}
            className={`btn touch-none ${props.className}`}
            onMouseDown={ handleStartPressAndHold }
            onTouchStart={ handleStartPressAndHold }
            onMouseUp={ handleEndPressAndHold }
            onTouchEnd={ handleEndPressAndHold }
        >
            { children }
        </button>
    )
}

export default PressAndHoldButton