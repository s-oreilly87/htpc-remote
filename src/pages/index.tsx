import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";

import RemotePanelSlideScroll from "@/components/RemotePanels/RemotePanelSlideScroll";
import Navbar from "@/components/UI/Navbar";
import SwipeDetector from "@/components/UI/SwipeDetector";
import { DenonProvider } from "@/context/denon";
import { RokuProvider } from "@/context/roku";
import { TplinkProvider } from "@/context/tplink";
import { RemoteType, REMOTE_INDEX } from "@/constants/remotes";
import { archivo_narrow } from "@/styles/fonts";
import { getKeyByValue, usePrevious } from "@/utilities/utils";

const App = () => {
  const [selectedRemote, setSelectedRemote] = useState<RemoteType>(RemoteType.ROKU);
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

  const currentlySelectedRemote = useRef<RemoteType>(null);
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
            (getKeyByValue(REMOTE_INDEX, REMOTE_INDEX[prevSelectedRemote] - 1) ?? prevSelectedRemote) as RemoteType,
        );
      }
    } else {
      if (
        REMOTE_INDEX[currentlySelectedRemote.current] <
        Object.keys(REMOTE_INDEX).length - 1
      ) {
        setSelectedRemote((prevSelectedRemote) =>
            (getKeyByValue(REMOTE_INDEX, REMOTE_INDEX[prevSelectedRemote] + 1) ?? prevSelectedRemote) as RemoteType
        );
      }
    }
  };

  return (
    <>
      {isClient && (
        <DenonProvider>
        <RokuProvider>
        <TplinkProvider>
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
                  className="mx-auto min-w-[330px] max-w-[550px] w-full mt-16"
                  selectedRemote={selectedRemote}
                  setSelectedRemote={setSelectedRemote}
                  prevRemote={prevRemote}
                />
              </SwipeDetector>
            </div>
          </div>
        </TplinkProvider>
        </RokuProvider>
        </DenonProvider>
      )}
    </>
  );
};

export default App;
