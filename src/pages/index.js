import React, {useEffect, useRef, useState} from "react";
import KeepAlive from "react-fiber-keep-alive";
import {REMOTE, REMOTE_INDEX, ROKU_STATE_DEFAULTS} from "@/utilities/constants.js";
import {getKeyByValue, usePrevious} from "@/utilities/utils";
import Head from "next/head";
import SwipeDetector from "@/components/UI/SwipeDetector";
import Navbar from "@/components/UI/Navbar";
import RemotePanelSlideScroll from "@/components/RemotePanels/RemotePanelSlideScroll.js";
import {archivo_narrow} from "@/styles/fonts.js";

const App = () => {

    const [selectedRemote, setSelectedRemote] = useState(REMOTE.ROKU);
    const [rokuState, setRokuState] = useState(ROKU_STATE_DEFAULTS)
    const [pcState, setPcState] = useState()
    const resetDocHeight = () => {
            let vh = window.innerHeight * 0.01
            document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    useEffect(() => {
        resetDocHeight()
        window.addEventListener('resize', resetDocHeight)
    }, [])

    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);

    let currentlySelectedRemote = useRef();
    const prevRemote = usePrevious(selectedRemote);

    // No idea what im doing here
    useEffect( () => {
        currentlySelectedRemote.current = selectedRemote;
    }, [selectedRemote])

    const handleSelectRemote = (event) => {
        setSelectedRemote(event.currentTarget.value);
    }

    const handleSwipe = (direction) =>  {
        if (direction === "right") {
            if (REMOTE_INDEX[currentlySelectedRemote.current] > 0) {
                // This is somehow forcing a re-render or something - so the state actual updates right away
                setSelectedRemote(prevSelectedRemote => getKeyByValue(REMOTE_INDEX, REMOTE_INDEX[prevSelectedRemote] - 1));
            }
        } else {
            if (REMOTE_INDEX[currentlySelectedRemote.current] < Object.keys(REMOTE_INDEX).length - 1) {
                setSelectedRemote(prevSelectedRemote => getKeyByValue(REMOTE_INDEX, REMOTE_INDEX[prevSelectedRemote] + 1));
            }
        }
    }

    return (
        <>
            {isClient && (
                <KeepAlive.Provider value="root">
                    {/* this div is so tailwind can find classes that don't exist until runtime */}
                    <div id="dynamically-named-classes"
                         className="hidden btn-primary-denon btn-primary-roku btn-primary-pc bg-teal-500 fill-teal-500">
                    </div>
                    <div id="size-classes" className="hidden w-2 w-3 w-4 w-5 w-6 w-7 w-8 w-9 w-10 w-12 w-14 w-16 w-18 w-20 w-22 w-24 w-28 w-32 w-36 h-2 h-3 h-4 h-5 h-6 h-7 h-8 h-9 h-10 h-12 h-14 h-16 h-18 h-20 h-22 h-24 h-28 h-32 h-36"></div>
                    <div id="color-classes" className="hidden fill-amber-400 fill-teal-500 fill-white fill-red-600"></div>
                    <div id="button-color-classes" className="hidden bg-amber-100 bg-amber-200 bg-amber-300 bg-amber-400 bg-amber-500 bg-amber-600 bg-amber-700 bg-amber-800 bg-amber-900
                       text-amber-100 text-amber-200 text-amber-300 text-amber-400 text-amber-500 text-amber-600 text-amber-700 text-amber-800 text-amber-900">
                    </div>
                    <div id='root' className={`bg-slate-900 viewport-height overflow-y-hidden ${archivo_narrow.className}`}>
                        <Head>
                            <title>HTPC Remote</title>
                            <meta name="viewport" content="width=device-width, initial-scale=1" />
                            <link rel="icon" href="/favicon.ico" />
                        </Head>
                        <SwipeDetector onSwipe={ handleSwipe } />
                            <div className="flex flex-col">
                                <Navbar className="fixed top-0 w-screen"
                                        onClickHandler={handleSelectRemote}
                                        selectedRemote={selectedRemote} />
                                <RemotePanelSlideScroll className="mx-auto min-w-[330px] max-w-[550px] place-content-center w-full mt-16"
                                             selectedRemote={selectedRemote}
                                             prevRemote={prevRemote}
                                             rokuState={rokuState}
                                             setRokuState={setRokuState}
                                             pcState={pcState}
                                             setPcState={setPcState}
                                />
                            </div>
                        </div>
                </KeepAlive.Provider>
            )}
        </>
    );
}

export default App;




