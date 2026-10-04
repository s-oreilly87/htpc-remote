import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";

import RemotePanelSlideScroll from "@/components/RemotePanels/RemotePanelSlideScroll";
import Navbar from "@/components/UI/Navbar";
import SwipeDetector from "@/components/UI/SwipeDetector";
import { DenonProvider } from "@/context/denon";
import { RokuProvider } from "@/context/roku";
import { TplinkProvider } from "@/context/tplink";
import { RemoteType, REMOTE_INDEX, REMOTE_ORDER } from "@/constants/remotes";
import { archivo_narrow } from "@/styles/fonts";
import { usePrevious } from "@/utilities/utils";
import { canFitDesktopRemotes } from "@/components/RemotePanels/remoteLayout";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const DemoPanel = dynamic(
  () => import("@/components/Demo/DemoPanel").then((mod) => mod.DemoPanel),
  { ssr: false },
);

const App = () => {
  const [selectedRemote, setSelectedRemote] = useState<RemoteType>(
    RemoteType.ROKU,
  );
  const remoteAreaRef = useRef<HTMLElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const area = remoteAreaRef.current;
    if (!area) return;
    const updateLayout = () => {
      setIsDesktop(canFitDesktopRemotes(area.getBoundingClientRect().width));
    };
    updateLayout();
    const observer = new ResizeObserver(updateLayout);
    observer.observe(area);
    return () => observer.disconnect();
  }, [isClient]);

  const prevRemote = usePrevious(selectedRemote);

  const handleSwipe = (direction: "left" | "right") => {
    setSelectedRemote((current) => {
      const nextIndex =
        REMOTE_INDEX[current] + (direction === "right" ? -1 : 1);
      return REMOTE_ORDER[nextIndex] ?? current;
    });
  };

  return (
    <>
      {isClient && (
        <DenonProvider>
          <RokuProvider>
            <TplinkProvider>
              <div
                id="root"
                className={`bg-slate-900 h-dvh overflow-hidden ${archivo_narrow.className}`}
              >
                <Head>
                  <title>HTPC Remote</title>
                  <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                  />
                  <link rel="icon" href="/favicon.ico" />
                </Head>
                <div className="flex h-full min-h-0">
                  <main
                    ref={remoteAreaRef}
                    className="remote-area flex min-w-0 flex-1 flex-col"
                    data-layout={isDesktop ? "desktop" : "compact"}
                  >
                    <Navbar
                      className="relative z-50 shrink-0"
                      isDesktop={isDesktop}
                      selectedRemote={selectedRemote}
                      setSelectedRemote={setSelectedRemote}
                    />
                    <SwipeDetector
                      onSwipe={handleSwipe}
                      enabled={!isDesktop}
                      className="min-h-0 flex-1"
                    >
                      <RemotePanelSlideScroll
                        isDesktop={isDesktop}
                        selectedRemote={selectedRemote}
                        setSelectedRemote={setSelectedRemote}
                        prevRemote={prevRemote}
                      />
                    </SwipeDetector>
                  </main>
                  {IS_DEMO && (
                    <aside
                      className="hidden w-[480px] shrink-0 overflow-hidden lg:flex"
                      aria-label="Home theater simulator"
                    >
                      <DemoPanel />
                    </aside>
                  )}
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
