import { Transition } from "@headlessui/react";
import { Fragment } from "react";

const Overlay = ({ show }) => {
  return (
    <Transition show={show} as={Fragment}>
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-[1000ms]"
        enterFrom="opacity-0"
        enterTo="opacity-90"
        leave="ease-in duration-[1000ms]"
        leaveFrom="opacity-90"
        leaveTo="opacity-0"
      >
        <div className="absolute top-0 left-0 w-screen h-screen z-40 bg-slate-900 opacity-90" />
      </Transition.Child>
    </Transition>
  );
};

export default Overlay;
