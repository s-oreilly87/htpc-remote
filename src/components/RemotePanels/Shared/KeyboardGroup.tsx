import { KEYSTROKE, RemoteType } from "@/constants/remotes";
import { URL_ENCODED_SYMBOLS } from "@/constants/encoding";
import { useEffect, useRef, useState } from "react";
import { Transition } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKeyboard, faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";
import { faWindows, faLinux } from "@fortawesome/free-brands-svg-icons";
import KeypressButton from "@/components/UI/KeypressButton";
import { sendKeystrokeToHtpc, sendRokuKeypress, sendRokuSearchQuery } from "@/utilities/http";
import { sleep } from "@/utilities/utils";
import { throttle } from "lodash";
import { usePlatform } from "@/hooks/usePlatform";

interface KeyboardGroupProps {
  remote: RemoteType;
}

function KeyboardGroup({ remote }: KeyboardGroupProps) {
  const { isMac, isWindows, isLinux } = usePlatform();
  const [inputExpanded, setInputExpanded] = useState(false);

  const [inputSoFar, setInputSoFar] = useState("");

  const hasTyped = useRef(false); //maybe can use inputSoFar

  const startMenuOpen = useRef(false);

  const [rokuSearchOpen, setRokuSearchOpen] = useState(false);

  const waitForSendInput = useRef(100);

  const keyboardInput = useRef(null);

  useEffect(() => {
    if (!inputExpanded) {
      hasTyped.current = false;
      setInputSoFar("");
    }
  }, [inputExpanded]);

  const closeInput = () => {
    if (remote === RemoteType.PC) {
      // If user typed, send WIN_KEY first to clear the search field, then a second to close.
      if (hasTyped.current) {
        sendKeystrokeToHtpc(KEYSTROKE.PC.WIN_KEY);
      }
      if (startMenuOpen.current) {
        sendKeystrokeToHtpc(KEYSTROKE.PC.WIN_KEY);
      }
    }
    startMenuOpen.current = false;
    setInputExpanded(false);
  };

  // PC WIN_KEY / Spotlight button — opens start menu and expands the input.
  const handleSearchButton = () => {
    if (inputExpanded) {
      closeInput();
      return;
    }
    sendKeystrokeToHtpc(KEYSTROKE.PC.WIN_KEY);
    setInputExpanded(true);
    startMenuOpen.current = true;
  };

  // Keyboard toggle button — expands input without sending WIN_KEY.
  const handleKeyboardButton = () => {
    if (inputExpanded) {
      closeInput();
    } else {
      setInputExpanded(true);
    }
  };

  // Roku search button — expands input and marks rokuSearch open.
  const handleRokuSearchButton = () => {
    if (inputExpanded) {
      setRokuSearchOpen(false);
      closeInput();
    } else {
      setRokuSearchOpen(true);
      setInputExpanded(true);
    }
  };

  const sendKey = (key) => {
    if (remote === RemoteType.ROKU) {
      if (!rokuSearchOpen) {
        sendRokuKeypress({ value: key });
      }
    } else if (remote === RemoteType.PC) {
      if (key === KEYSTROKE.KEYS.BACKSPACE) {
        key = KEYSTROKE[remote].BACKSPACE;
      } else if (key === KEYSTROKE.KEYS.WIN_KEY) {
        key = KEYSTROKE[remote].WIN_KEY;
      } else if (key === KEYSTROKE.KEYS.ENTER) {
        key = KEYSTROKE[remote].ENTER;
      }
      sendKeystrokeToHtpc(key);
    }
  };

  const sendChar = (char) => {
    waitForSendInput.current = 80 + 10; //arbitrary extra delay?

    if (URL_ENCODED_SYMBOLS.hasOwnProperty(char)) {
      char = URL_ENCODED_SYMBOLS[char];
    }

    if (remote === RemoteType.ROKU) {
      if (!rokuSearchOpen) {
        sendKey("Lit_" + char);
      }
    } else {
      sendKey(char);
    }
  };

  const sendStringAsChars = async (string) => {
    waitForSendInput.current = string.length * 80 + 10; // arbitrary extra delay?

    for (let i = 0; i < string.length; i++) {
      await sleep(100);
      sendChar(string[i]);
    }
  };

  // Quick mobile debug to use in handleInput
  //if (inputSoFar.length > 3) {alert(inputType + " : " + event.nativeEvent.data + " : "  + inputSoFar)}
  const handleInput = async (event) => {
    const inputType = event.nativeEvent.inputType;

    // backspace from a keyboard
    if (inputType === "deleteContentBackward") {
      sendKey(KEYSTROKE.KEYS.BACKSPACE);
      setInputSoFar(inputSoFar.substring(0, inputSoFar.length - 1));

      // input from a keyboard, data = newest char
    } else if (inputType === "insertText") {
      let newChar = event.nativeEvent.data;
      sendChar(newChar);
      setInputSoFar(inputSoFar + newChar);

      // Input from Android(mobile?) keyboard -- comes as insertCompositionText - the entire current word at a time (backspace too!)
    } else if (inputType === "insertCompositionText") {
      // Event is null on delete after an autocomplete (or paste?)  - maybe other cases too which could case issues here!!!
      if (event.nativeEvent.data === null) {
        sendKey(KEYSTROKE.KEYS.BACKSPACE);
        setInputSoFar(inputSoFar.substring(0, inputSoFar.length - 1));
        await sleep(80);
        return;
      }

      let currentWord = event.nativeEvent.data;
      const lengthOfNewString =
        currentWord.length -
        inputSoFar.substring(inputSoFar.lastIndexOf(" ") + 1).length;

      //  check if compositionText is actually a backspace mid-word : data = the modified word (maybe works with whole word delete?)
      if (lengthOfNewString < 0) {
        for (let i = 0; i < Math.abs(lengthOfNewString); i++) {
          sendKey(KEYSTROKE.KEYS.BACKSPACE);
          setInputSoFar(inputSoFar.substring(0, inputSoFar.length - 1));
          await sleep(80);
        }
        return;
      }
      // TODO: It misses subsequent autocorrect words,  also stumbles on Voice Text (sending too fast?) Actually doesant work at all now!?
      // String was input (either char typed, autocomplete, voice keyboard, paste)
      const newString = currentWord.substring(
        currentWord.length - lengthOfNewString,
      );
      sendStringAsChars(newString);
      setInputSoFar(inputSoFar + newString);
    } else if (inputType === "insertFromPaste") {
      let pastedString = event.target.value.substring(inputSoFar.length);
      sendStringAsChars(pastedString);
      setInputSoFar(inputSoFar + pastedString);
    } else {
      alert(inputType);
    }
  };

  // TODO: This isnt working
  const throttledInputHandler = throttle(handleInput, waitForSendInput.current);

  // Keydown to handle extra backspaces when input is empty
  const handleKeyDown = (event) => {
    if (event.keyCode === 8 && event.target.value === "") {
      // handle backspace when input is empty
      if (remote === RemoteType.ROKU) {
        if (!rokuSearchOpen) {
          sendRokuKeypress({ value: KEYSTROKE.ROKU.BACKSPACE });
        }
      } else if (remote === RemoteType.PC) {
        sendKeystrokeToHtpc(KEYSTROKE.PC.BACKSPACE);
      }
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (rokuSearchOpen) {
      sendRokuSearchQuery(inputSoFar);
    } else {
      sendKey(KEYSTROKE.KEYS.ENTER);
    }
    setRokuSearchOpen(false);
    setInputExpanded(false);
  };

  const handleInputBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    // Let the click handlers on these buttons handle close themselves — don't double-trigger.
    const actionButtonIds = ["win-key", "search", "toggle-keyboard", "keyboard-submit"];
    if (actionButtonIds.includes((event.relatedTarget as HTMLElement)?.id)) return;
    closeInput();
  };

  const getInputPlaceholder = () => {
    let placeholder = "Type to ";
    if (remote === RemoteType.PC) {
      placeholder += "PC . . .";
    } else {
      placeholder += "RokuTV . . .";
    }
    return placeholder;
  };

  return (
    <div>
      {inputExpanded && (
        <div className="bg-slate-900 z-30 panel-height panel-width fixed top-0 left-0 m-3 opacity-90"></div>
      )}

      {/* The form itself handles the width animation via CSS transition — avoids the layout
          reflow jank that HeadlessUI Transition causes when animating width directly. */}
      <form
        id="keyboard-btn-group"
        autoComplete="off"
        onSubmit={handleSubmit}
        className={`flex absolute bottom-3 h-12 overflow-hidden transition-all duration-300 ease-in-out ${
          inputExpanded ? "panel-width z-40" : "w-12 z-10"
        }`}
      >
        <input type="hidden" value="needed-to-disable-autocomplete" />
        <div className="w-12 flex-shrink-0 h-full">
          {remote === RemoteType.PC && (
            <button
              id="win-key"
              type="button"
              className={`btn h-full w-full flex justify-center items-center shadow-inner ${
                inputExpanded
                  ? "rounded-l-xl rounded-r-none bg-red-600 shadow-red-500"
                  : "bg-green-700 shadow-green-500"
              }`}
              onClick={handleSearchButton}
            >
              {!inputExpanded && isMac  && <FontAwesomeIcon icon={faMagnifyingGlass} />}
              {!inputExpanded && isWindows && <FontAwesomeIcon icon={faWindows} />}
              {!inputExpanded && isLinux && <FontAwesomeIcon icon={faLinux} />}
              {inputExpanded           && <FontAwesomeIcon icon={faXmark} />}
            </button>
          )}
          {remote === RemoteType.ROKU && (
            <button
              id="search"
              type="button"
              className={`btn h-full w-full flex justify-center items-center ${
                inputExpanded
                  ? "rounded-l-xl rounded-r-none bg-red-600"
                  : "btn-primary-roku"
              }`}
              onClick={handleRokuSearchButton}
            >
              {!inputExpanded && <FontAwesomeIcon icon={faMagnifyingGlass} />}
              {inputExpanded  && <FontAwesomeIcon icon={faXmark} />}
            </button>
          )}
        </div>
        {/* Transition animates opacity only — width is handled by the parent form's CSS transition. */}
        <Transition
          as="div"
          show={inputExpanded}
          enter="transition-opacity ease-in-out duration-200 delay-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in-out duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          className="flex flex-1 min-w-0"
        >
          <input
            id="keyboard-input"
            ref={keyboardInput}
            className="h-full w-full px-3 py-1 z-50 bg-slate-700 text-white placeholder:text-slate-400"
            type="text"
            placeholder={getInputPlaceholder()}
            autoFocus
            autoComplete="off"
            value={inputSoFar}
            onKeyDown={handleKeyDown}
            onInput={throttledInputHandler}
            onBlur={handleInputBlur}
          />
          <div className="w-14 flex-shrink-0 flex justify-items-stretch">
            <button
              id="keyboard-submit"
              type="submit"
              className={`btn btn-primary-${remote.toLowerCase()} rounded-r-xl rounded-l-none h-full w-full z-10`}
              value={KEYSTROKE[remote].ENTER}
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} className="h-1/2 w-1/2 mx-auto" />
            </button>
          </div>
        </Transition>
      </form>
      {(remote === RemoteType.PC || remote === RemoteType.ROKU) && (
        <KeypressButton
          id="toggle-keyboard"
          className="btn-secondary absolute bottom-3 left-14 w-10"
          onClick={handleKeyboardButton}
          remote={remote}
        >
          <FontAwesomeIcon icon={faKeyboard} />
        </KeypressButton>
      )}
    </div>
  );
}

export default KeyboardGroup;
