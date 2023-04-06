import {useEffect, useRef} from 'react'

export function useHasChanged(val) {
    const prevVal = usePrevious(val)
    return prevVal !== val
}

export function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

export function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

export function getEntryByValue(object, value) {
    return Object.entries(object).find(entry => entry.value === value)
}

export function convertKebabToCamel(kebabString) {
    return kebabString.replace(/-([a-z])/g,
        function (m, s) {
            return s.toUpperCase();
        });
}

// sleep function (must call with await from an async function)
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function buttonPress(button, buttonPressTimer, setButtonPressTimer) {
    if (!button instanceof HTMLButtonElement) {
        return   // not a real button, just made a dummy object to send a request
    }

    if (buttonPressTimer) {
        clearTimeout(buttonPressTimer)
    }

    navigator.vibrate(5)
    button.classList.add('text-blue-400')

    setButtonPressTimer(setTimeout(() => {
        button.classList.remove('text-blue-400')
        button.blur()
    }, 200, button))
}