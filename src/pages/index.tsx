import React, { useEffect, useRef, useState } from "react";
import KeepAlive from "react-fiber-keep-alive";
import Head from "next/head";

import RemotePanelSlideScroll from "@/components/RemotePanels/RemotePanelSlideScroll";
import Navbar from "@/components/UI/Navbar";
import SwipeDetector from "@/components/UI/SwipeDetector";
import { ROKU_STATE_DEFAULTS } from "@/components/RemotePanels/Roku/rokuConstants";
import { RemoteType, REMOTE_INDEX } from "@/constants/remotes";
import { archivo_narrow } from "@/styles/fonts";
import { getKeyByValue, usePrevious } from "@/utilities/utils";

const App = () => {
  const [selectedRemote, setSelectedRemote] = useState<RemoteType>(RemoteType.ROKU);
  const [rokuState, setRokuState] = useState(ROKU_STATE_DEFAULTS);
  const [pcState, setPcState] = useState<Record<string, unknown> | undefined>();
  const resetDocHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  };

  useEffect(() => {
    resetDocHeight();
    window.addEventListener("resize", resetDocHeight);
  }, []);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const currentlySelectedRemote = useRef<RemoteType>();
  const prevRemote = usePrevious(selectedRemote);

  useEffect(() => {
    currentlySelectedRemote.current = selectedRemote;
  }, [selectedRemote]);

  const handleSelectRemote = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSelectedRemote(event.currentTarget.value as RemoteType);
  };

  const handleSwipe = (direction: "left" | "right") => {
    if (!currentlySelectedRemote.current) return;

    if (direction === "right") {
      if (REMOTE_INDEX[currentlySelectedRemote.current] > 0) {
        setSelectedRemote((prevSelectedRemote) =>
          getKeyByValue(REMOTE_INDEX, REMOTE_INDEX[prevSelectedRemote] - 1) ?? prevSelectedRemote,
        );
      }
    } else {
      if (
        REMOTE_INDEX[currentlySelectedRemote.current] <
        Object.keys(REMOTE_INDEX).length - 1
      ) {
        setSelectedRemote((prevSelectedRemote) =>
          getKeyByValue(REMOTE_INDEX, REMOTE_INDEX[prevSelectedRemote] + 1) ?? prevSelectedRemote,
        );
      }
    }
  };

  return (
    <>
      {isClient && (
        <KeepAlive.Provider value="root">
          {/* this div is so tailwind can find classes that don't exist until runtime */}
          <div
            id="dynamically-named-classes"
            className="hidden btn-primary-denon btn-primary-roku btn-primary-pc bg-teal-500 fill-teal-500"
          ></div>
          <div
            id="size-classes"
            className="hidden w-2 w-3 w-4 w-5 w-6 w-7 w-8 w-9 w-10 w-12 w-14 w-16 w-18 w-20 w-22 w-24 w-28 w-32 w-36 h-2 h-3 h-4 h-5 h-6 h-7 h-8 h-9 h-10 h-12 h-14 h-16 h-18 h-20 h-22 h-24 h-28 h-32 h-36"
          ></div>
          <div
            id="color-classes"
            className="hidden fill-amber-400 fill-teal-500 fill-white fill-red-600"
          ></div>
          <div
            id="button-color-classes"
            className="hidden bg-amber-100 bg-amber-200 bg-amber-300 bg-amber-400 bg-amber-500 bg-amber-600 bg-amber-700 bg-amber-800 bg-amber-900 text-amber-100 text-amber-200 text-amber-300 text-amber-400 text-amber-500 text-amber-600 text-amber-700 text-amber-800 text-amber-900"
          ></div>
          <div
            id="root"
            className={`bg-slate-900 viewport-height overflow-y-hidden ${archivo_narrow.className}`}
          >
            <Head>
              <title>HTPC Remote</title>
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className="flex flex-col">
              <Navbar
                className="fixed top-0 w-screen"
                onClickHandler={handleSelectRemote}
                selectedRemote={selectedRemote}
              />
              <SwipeDetector onSwipe={handleSwipe}>
                <RemotePanelSlideScroll
                  className="mx-auto min-w-[330px] max-w-[550px] place-content-center w-full mt-16"
                  selectedRemote={selectedRemote}
                  setSelectedRemote={setSelectedRemote}
                  prevRemote={prevRemote}
                  rokuState={rokuState}
                  setRokuState={setRokuState}
                  pcState={pcState}
                  setPcState={setPcState}
                />
              </SwipeDetector>
            </div>
          </div>
        </KeepAlive.Provider>
      )}
    </>
  );
};

export default App;
