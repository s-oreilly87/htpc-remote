import Image from 'next/image'
import {REMOTE} from "@/utilities/constants.js";
import {useState} from "react";
import {buttonPress} from "@/utilities/utils.js";

function Navbar({ className, selectedRemote, onClickHandler }) {

    const [buttonPressTimer, setButtonPressTimer] = useState()

    const handleClick = (event) => {
        onClickHandler(event)
        buttonPress(event.currentTarget, buttonPressTimer, setButtonPressTimer)
    }

    return (
        <nav className={className}>
            <div className="max-w-7xl h-16 w-full mx-auto px-3 z-10 flex relative justify-end xs:justify-center">
                <div className="py-1 absolute left-0 top-0 aspect-video">
                    <Image src={'/icons/app-icon.png'} alt="Remote" width={60} height={50} />
                </div>
                <div className="flex w-5/6 max-w-[550px] min-w-[270px] justify-center">
                    <div className="w-full flex items-end">
                        <button onClick={handleClick}
                                className={ (selectedRemote === REMOTE.DENON ?
                                    "nav-tab-active btn-primary-denon" : "nav-tab-inactive") }
                                value={REMOTE.DENON}>
                            Denon
                        </button>
                        <button onClick={handleClick}
                                className={ (selectedRemote === REMOTE.ROKU ?
                                    "nav-tab-active btn-primary-roku" : "nav-tab-inactive") }
                                value={REMOTE.ROKU}>
                            Roku
                        </button>
                        <button onClick={handleClick}
                                className={ (selectedRemote === REMOTE.PC ?
                                    "nav-tab-active btn-primary-pc" : "nav-tab-inactive") }
                                value={REMOTE.PC}>
                            HTPC
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;