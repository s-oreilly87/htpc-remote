import { Transition } from "@headlessui/react";
import React from "react";

interface Props {
  enabled?: boolean;
  className?: string;
  children: React.ReactNode;
  show: boolean;
  selectedComponentIndex: number;
  prevComponentIndex?: number | null;
}

const SlideScrollTransition: React.FC<Props> = ({
  children,
  show,
  enabled = true,
  className,
  selectedComponentIndex,
  prevComponentIndex = null,
}) => {
  const enterFromClassNames = (
    selectedIndex: number,
    previousIndex: number | null,
  ) => {
    let enterFrom = "opacity-0 ";
    if (previousIndex === null) return enterFrom;
    if (selectedIndex < previousIndex) {
      enterFrom += "-translate-x-full";
    } else if (selectedIndex > previousIndex) {
      enterFrom += "translate-x-full";
    }
    return enterFrom;
  };

  const leaveToClassNames = (
    selectedIndex: number,
    previousIndex: number | null,
  ) => {
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
      appear={enabled}
      transition={enabled}
      enter={
        enabled ? "transition-all ease-in-out duration-[500ms]" : undefined
      }
      enterFrom={
        enabled
          ? enterFromClassNames(selectedComponentIndex, prevComponentIndex)
          : undefined
      }
      enterTo={enabled ? "opacity-100 translate-x-0" : undefined}
      leave={
        enabled ? "transition-all ease-in-out duration-[500ms]" : undefined
      }
      leaveFrom={enabled ? "opacity-100 translate-x-0" : undefined}
      leaveTo={
        enabled
          ? leaveToClassNames(selectedComponentIndex, prevComponentIndex)
          : undefined
      }
      className={`${className ?? ""} ${enabled ? "will-change-transform" : ""}`}
    >
      {children}
    </Transition>
  );
};

export default SlideScrollTransition;
