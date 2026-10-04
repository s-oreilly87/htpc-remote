import { Transition } from "@headlessui/react";
import React from "react";

interface Props {
  show: boolean;
}

// Renders as the overlay div directly — no wrapper element needed.
const Overlay: React.FC<Props> = ({ show }) => {
  return (
    <Transition
      as="div"
      show={show}
      className="absolute inset-0 z-40 bg-slate-900
                 opacity-90 transition-opacity
                 data-closed:opacity-0
                 data-enter:ease-out data-enter:duration-1000
                 data-leave:ease-in data-leave:duration-1000"
    />
  );
};

export default Overlay;
