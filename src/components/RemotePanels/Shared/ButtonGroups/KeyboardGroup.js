import {KEYSTROKE, REMOTE, URL_ENCODED_SYMBOLS, PLATFORM } from "@/utilities/constants.js";
import {useEffect, useRef, useState} from "react";
import {Transition} from "@headlessui/react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faKeyboard, faMagnifyingGlass, faXmark} from '@fortawesome/free-solid-svg-icons'
import {faWindows} from "@fortawesome/free-brands-svg-icons";
import RemoteButton from "@/components/UI/RemoteButton";
import {sendKeystrokeToNutJS, sendRokuKeypress} from "@/utilities/http";
import {sleep} from "@/utilities/utils";
import {throttle} from 'lodash'

function KeyboardGroup({ remote }) {
    const [inputExpanded, setInputExpanded] = useState(false)

    const [inputSoFar, setInputSoFar] = useState("")

    const hasTyped = useRef(false) //maybe can use inputSoFar

    const startMenuOpen = useRef(false)

    const waitForSendInput = useRef(100)

    useEffect(() => {
        if(!inputExpanded) {
            hasTyped.current = false
            setInputSoFar("")
        }
    }, [inputExpanded])

    const toggleInputExpanded = (event = null) => {
        if (event && event.currentTarget.id === "toggle-keyboard") {
            setInputExpanded(!inputExpanded)
            return
        }

        if (remote === REMOTE.PC) {
            if (!inputExpanded) {
                sendKeystrokeToNutJS(KEYSTROKE[remote].WIN_KEY)
                setInputExpanded(!inputExpanded)
                startMenuOpen.current = true
                return
            }

            // if user has typed - need to send an extra winkey to clear field so second one closes start menu
            if (hasTyped.current) {
                sendKeystrokeToNutJS(KEYSTROKE[remote].WIN_KEY)
            }
            if (startMenuOpen.current) {
                sendKeystrokeToNutJS(KEYSTROKE[remote].WIN_KEY)
            }
        }
        setInputExpanded(!inputExpanded)
    }


    const sendKey = (key) => {
        if (remote === REMOTE.ROKU) {
            sendRokuKeypress({ value: key })
        } else if (remote === REMOTE.PC) {
            if (key === KEYSTROKE.KEYS.BACKSPACE) {
                key = KEYSTROKE[remote].BACKSPACE
            } else if (key === KEYSTROKE.KEYS.WIN_KEY) {
                key = KEYSTROKE[remote].WIN_KEY
            } else if (key === KEYSTROKE.KEYS.ENTER) {
                key = KEYSTROKE[remote].ENTER
            }
            sendKeystrokeToNutJS(key)
        }
    }

    const sendChar = (char) => {
        waitForSendInput.current = 80 + 10   //arbitrary extra delay?

        if (URL_ENCODED_SYMBOLS.hasOwnProperty(char)) {
            char = URL_ENCODED_SYMBOLS[char]
        }

        if (remote === REMOTE.ROKU) {
            sendKey("Lit_" + char)
        } else {
            sendKey(char)
        }
    }

    const sendStringAsChars = async (string) => {
        waitForSendInput.current = string.length * 80 + 10   // arbitrary extra delay?

        for (let i = 0; i < string.length; i++) {
            await sleep(100)
            sendChar(string[i])
        }
    }


    // Quick mobile debug to use in handleInput
    //if (inputSoFar.length > 3) {alert(inputType + " : " + event.nativeEvent.data + " : "  + inputSoFar)}
    const handleInput = async (event) => {
        const inputType = event.nativeEvent.inputType;

            // backspace from a keyboard
        if (inputType === "deleteContentBackward") {
            sendKey(KEYSTROKE.KEYS.BACKSPACE)
            setInputSoFar(inputSoFar.substring(0, inputSoFar.length - 1))

            // input from a keyboard, data = newest char
        } else if (inputType === "insertText") {
            let newChar = event.nativeEvent.data
            sendChar(newChar)
            setInputSoFar(inputSoFar + newChar)

            // Input from Android(mobile?) keyboard -- comes as insertCompositionText - the entire current word at a time (backspace too!)
        } else if (inputType === "insertCompositionText") {
            // Event is null on delete after an autocomplete (or paste?)  - maybe other cases too which could case issues here!!!
            if (event.nativeEvent.data === null) {
                sendKey(KEYSTROKE.KEYS.BACKSPACE)
                setInputSoFar(inputSoFar.substring(0, inputSoFar.length - 1))
                await sleep(80)
                return
            }

            let currentWord = event.nativeEvent.data
            const lengthOfNewString = currentWord.length - inputSoFar.substring(inputSoFar.lastIndexOf(" ") + 1).length

            //  check if compositionText is actually a backspace mid-word : data = the modified word (maybe works with whole word delete?)
            if (lengthOfNewString < 0) {
                for (let i = 0; i < Math.abs(lengthOfNewString); i++) {
                    sendKey(KEYSTROKE.KEYS.BACKSPACE)
                    setInputSoFar(inputSoFar.substring(0, inputSoFar.length - 1))
                    await sleep(80)
                }
                return
            }
            // TODO: It misses subsequent autocorrect words,  also stumbles on Voice Text (sending too fast?) Actually doesant work at all now!?
            // String was input (either char typed, autocomplete, voice keyboard, paste)
            const newString = currentWord.substring(currentWord.length - lengthOfNewString)
            sendStringAsChars(newString)
            setInputSoFar(inputSoFar + newString)

        } else if (inputType === "insertFromPaste") {
            let pastedString = event.target.value.substring(inputSoFar.length)
            console.log(pastedString)
            sendStringAsChars(pastedString)
            setInputSoFar(inputSoFar + pastedString)
        } else {
            alert(inputType)
        }
    }

    // TODO: This isnt working
    const throttledInputHandler = throttle(handleInput, waitForSendInput.current);

    // Keydown to handle extra backspaces when input is empty
    const handleKeyDown = (event) => {
        if (event.keyCode === 8 && event.target.value === "") {
            // handle backspace when input is empty
            if (remote === REMOTE.ROKU) {
                sendRokuKeypress({ value: KEYSTROKE.ROKU.BACKSPACE });
            } else if (remote === REMOTE.PC) {
                sendKeystrokeToNutJS(KEYSTROKE.PC.BACKSPACE);
            }
        }
    };


    const handleSubmit = (event) => {
        event.preventDefault()
        sendKey(KEYSTROKE.KEYS.ENTER)
        setInputExpanded(false)
    }

    const handleInputBlur = (event) => {
        // unless the focus is lost when they click the close or search button, in that case let the click handler handle it
        if (event.relatedTarget === (document.getElementById('keyboard') ?? document.getElementById('win-key'))
            || event.relatedTarget === document.getElementById('keyboard-submit')) {
            return
        }
        toggleInputExpanded()
    }

    const getInputPlaceholder = () => {
        let placeholder = "Type to "
        if (remote === REMOTE.PC) {
            placeholder += "PC . . ."
        } else {
            placeholder += "RokuTV . . ."
        }
        return placeholder
    }

    return (
        <div>

            { inputExpanded &&
                <div className="bg-slate-900 z-30 panel-height panel-width fixed top-0 left-0 m-3 opacity-90"></div>
            }

            <form id="keyboard-btn-group"
                  autoComplete="off"
                  onSubmit={handleSubmit}
                  className={`flex absolute bottom-0 justify-items-center h-12 ${inputExpanded ? "panel-width z-40" : "w-12"}`}>
                <input type="hidden" value="needed-to-disable-autocomplete" />
                <div className="w-12 h-full">
                    { remote === REMOTE.PC &&
                        <button id="win-key"
                                type="button"
                                className={`btn h-full w-full flex justify-center items-center\
                            ${ (inputExpanded ? "rounded-l-xl rounded-r-none bg-red-600" : "bg-green-700") } `}
                                onClick={toggleInputExpanded}
                                value={KEYSTROKE.PC.WIN_KEY}>
                            { (!inputExpanded && PLATFORM === "MACOS") &&
                                <FontAwesomeIcon icon={ faMagnifyingGlass } />
                            }
                            { (!inputExpanded && PLATFORM === "PC") &&
                                <FontAwesomeIcon icon={ faWindows } />
                            }
                            { inputExpanded &&
                                <FontAwesomeIcon icon={ faXmark } />
                            }
                        </button>
                    }
                    { remote === REMOTE.ROKU &&
                        <button id="keyboard"
                                type="button"
                                className={`btn h-full w-full flex justify-center items-center \
                            ${ (inputExpanded ? "rounded-l-xl rounded-r-none bg-red-600" : "btn-secondary") } `}
                                onClick={toggleInputExpanded}>

                            { !inputExpanded &&
                                <FontAwesomeIcon icon={ faKeyboard } />
                            }
                            { inputExpanded &&
                                <FontAwesomeIcon icon={ faXmark } />
                            }
                        </button>
                    }

                </div>
                <Transition
                    show={ inputExpanded }
                    enter="transition-all ease-in-out duration-[500ms]"
                    enterFrom="opacity-0 -translate-x-4/5 w-1/4"
                    enterTo="opacity-100 translate-x-0 w-full"
                    leave="transition-all ease-in-out duration-[500ms]"
                    leaveFrom="opacity-100 translate-x-0 w-full"
                    leaveTo="opacity-0 -translate-x-4/5 w-1/4"
                    className="flex">
                    <div className="w-full h-full">
                        <input id="keyboard-input"
                               className={`h-full w-full px-3 py-1`}
                               type="text"
                               placeholder={ getInputPlaceholder() }
                               autoFocus
                               autoComplete="off"
                               value={inputSoFar}
                               onKeyDown={handleKeyDown}
                               onInput={throttledInputHandler}
                               onBlur={handleInputBlur}
                        />
                    </div>
                    <div className="w-14 flex justify-items-stretch">
                        <button id="keyboard-submit"
                                type="submit"
                                className={ `btn btn-primary-${ remote } rounded-r-xl rounded-l-none h-full w-full` }
                                value={ KEYSTROKE[remote].ENTER }>
                            <FontAwesomeIcon icon={ faMagnifyingGlass } className="h-1/2 w-1/2 mx-auto" />
                        </button>
                    </div>
                </Transition>
            </form>
            { remote === REMOTE.PC &&
                <RemoteButton id="toggle-keyboard"
                              className="btn-secondary absolute bottom-0 left-14 w-10"
                              onClick={toggleInputExpanded}>
                    <FontAwesomeIcon icon={faKeyboard} />
                </RemoteButton>
            }
        </div>
    );
}

export default KeyboardGroup;