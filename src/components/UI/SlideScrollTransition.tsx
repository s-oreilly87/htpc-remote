import { Transition } from "@headlessui/react";
import React from "react";

interface SlideScrollTransitionProps {
  children: React.ReactNode;
  show: boolean;
  selectedComponentIndex: number;
  prevComponentIndex?: number | null;
}

const SlideScrollTransition: React.FC<SlideScrollTransitionProps> = ({
  children,
  show,
  selectedComponentIndex,
  prevComponentIndex = null,
}) => {
  const enterFromClassNames = (selectedIndex: number, previousIndex: number | null) => {
    let enterFrom = "opacity-0 ";
    if (previousIndex === null) return enterFrom;
    if (selectedIndex < previousIndex) {
      enterFrom += "-translate-x-full";
    } else if (selectedIndex > previousIndex) {
      enterFrom += "translate-x-full";
    }
    return enterFrom;
  };

  const leaveToClassNames = (selectedIndex: number, previousIndex: number | null) => {
    let leaveTo = "opacity-0 ";
    if (previousIndex === null) return leaveTo;
    if (selectedIndex < previousIndex) {
      leaveTo += "translate-x-full";
    } else if (selectedIndex > previousIndex) {
      leaveTo += "-translate-x-full";
    }
    return leaveTo;
  };

  return (
    <Transition
      as="div"
      unmount={false}
      show={show}
      appear={true}
      enter="transition-all ease-in-out duration-[500ms]"
      enterFrom={enterFromClassNames(selectedComponentIndex, prevComponentIndex)}
      enterTo="opacity-100 translate-x-0"
      leave="transition-all ease-in-out duration-[500ms]"
      leaveFrom="opacity-100 translate-x-0"
      leaveTo={leaveToClassNames(selectedComponentIndex, prevComponentIndex)}
      className="absolute w-full will-change-transform"
    >
      {children}
    </Transition>
  );
};

export default SlideScrollTransition;
