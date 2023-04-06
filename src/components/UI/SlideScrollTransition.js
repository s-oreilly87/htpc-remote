import {Transition} from "@headlessui/react";

const SlideScrollTransition = ({children, show, selectedComponentIndex, prevComponentIndex}) => {

    const enterFromClassNames = (selectedComponentIndex, prevComponentIndex) => {
        let enterFrom = "opacity-0 "
        if (selectedComponentIndex < prevComponentIndex) {
            enterFrom += "-translate-x-full"
        } else if (selectedComponentIndex > prevComponentIndex) {
            enterFrom += "translate-x-full"
        }
        return enterFrom;
    }

    const leaveToClassNames = (selectedComponentIndex, prevComponentIndex) => {
        let leaveTo = "opacity-0 "
        if (selectedComponentIndex < prevComponentIndex) {
            leaveTo += "translate-x-full"
        } else if (selectedComponentIndex > prevComponentIndex) {
            leaveTo += "-translate-x-full"
        }
        return leaveTo
    }

    return (
        <Transition
            show={ show }
            appear={ true }
            enter="transition-all ease-in-out duration-[500ms]"
            enterFrom={enterFromClassNames(selectedComponentIndex, prevComponentIndex)}
            enterTo="opacity-100 translate-x-0"
            leave="transition-all ease-in-out duration-[500ms]"
            leaveFrom="opacity-100 translate-x-0"
            leaveTo={leaveToClassNames(selectedComponentIndex, prevComponentIndex)}
        >
            { children }
        </Transition>
    );
}

export default SlideScrollTransition