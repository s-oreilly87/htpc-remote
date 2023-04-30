import React, {useEffect, useRef, useState} from "react";
import KeepAlive from "react-fiber-keep-alive";
import {DENON_STATE_DEFAULTS, REMOTE, REMOTE_INDEX, ROKU_STATE_DEFAULTS} from "@/utilities/constants.js";
import {getKeyByValue, usePrevious} from "@/utilities/utils";
import Head from "next/head";
import SwipeDetector from "@/components/UI/SwipeDetector";
import Navbar from "@/components/UI/Navbar";
import RemotePanelSlideScroll from "@/components/RemotePanels/RemotePanelSlideScroll.js";
import {archivo_narrow} from "@/styles/fonts.js";

const App = () => {

    const [selectedRemote, setSelectedRemote] = useState(REMOTE.ROKU);
    const [denonState, setDenonState] = useState(DENON_STATE_DEFAULTS)
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
                                             denonState={denonState}
                                             setDenonState={setDenonState}
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




