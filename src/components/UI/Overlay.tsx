import { Transition } from "@headlessui/react";
import React from "react";

interface OverlayProps {
  show: boolean;
}

// Renders as the overlay div directly — no wrapper element needed.
const Overlay: React.FC<OverlayProps> = ({ show }) => {
  return (
    <Transition
      as="div"
      show={show}
      className="absolute top-0 left-0 w-screen h-screen z-40 bg-slate-900 mt-3
                 opacity-90 transition-opacity
                 data-closed:opacity-0
                 data-enter:ease-out data-enter:duration-1000
                 data-leave:ease-in data-leave:duration-1000"
    />
  );
};

export default Overlay;
