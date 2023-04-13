import Constants from "@/utilities/constants.js";
import RemoteButton from "@/components/UI/RemoteButton";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faMinus, faPlus} from "@fortawesome/free-solid-svg-icons";
import {useState} from "react";
import {sendDenonCommand} from "@/utilities/http";
import {buttonPress} from "@/utilities/utils.js";

const remote = Constants.REMOTE.DENON
const LevelsControl = ({ denonState, setDenonState, setDialogueAdjustFromResponseValue }) => {

    const [buttonPressTimer, setButtonPressTimer] = useState()

    const handleClick = async (event) => {
        const command = event.currentTarget.value
        const splitCommand = command.split(" ")

        // Update denon state before sending command for responsiveness
        // Maybe if telnet speed is sorted out this is unnecessary
        //  - it will update again after response for accuracy
        if (splitCommand[0] === "PSDIL") {
            const increment = splitCommand[1] === "UP" ? 0.5 : -0.5
            setDenonState(prevState => ({
                ...prevState,
                PSDIL: prevState.PSDIL + increment
            }))
        } else if (denonState.hasOwnProperty(splitCommand[0])) {
            setDenonState(prevState => ({
                ...prevState,
                [splitCommand[0]] : splitCommand[1]
            }))
        } else {
            console.info(`Unknown response type: ${command}`)
        }

        const response = await sendDenonCommand(event.target)
        if (response.error) {
           return console.log(response.error)
        }

        // Update denonState based on the response
        // PSDIL comes in as an array of [PSDIL ON/OFF, PSDIL LEVEL]
        for (const line of response.data) {
            const splitData = line.split(" ")

            if (splitData[0] === "PSDIL" && ["ON", "OFF"].includes(splitData[1])) {
                setDenonState(prevState => ({
                    ...prevState,
                    psDilOn: splitData[1] === "ON"
                }))
            } else if (splitData[0] === "PSDIL") {
                // PSDIL LEVEL needs special processing
                 setDialogueAdjustFromResponseValue(splitData[1])
            } else {
                setDenonState(prevState => ({
                    ...prevState,
                    [splitData[0]]: splitData[1]
                }))
            }
        }
        buttonPress(event.target, buttonPressTimer, setButtonPressTimer)
    }


    return (
        <div className="flex gap-4 w-full max-h-18">
            <div className="flex flex-col w-1/3 items-center justify-center">
                <label htmlFor="dialog-level" className="text-center"
                       style={{color:'#00be9f'}}>
                    Dialog Level<br />
                       <span className="font-light font-mono">{
                           denonState.PSDIL > 0 ?
                               "+" + denonState.PSDIL.toFixed(1)
                               : denonState.PSDIL.toFixed(1)
                       }</span>
                </label>

                <div id="dialog-level" className="flex w-full p-2 space-x-1" role="group">
                    <RemoteButton remote={Constants.REMOTE.DENON}
                                  className="btn-secondary w-1/2 items-center justify-center"
                                  value="PSDIL DOWN"
                                  onClick={handleClick}>
                        <FontAwesomeIcon icon={faMinus} />
                    </RemoteButton>
                    <RemoteButton remote={Constants.REMOTE.DENON}
                                  className="btn-secondary w-1/2 items-center justify-center"
                                  value="PSDIL UP"
                                  onClick={handleClick}>
                        <FontAwesomeIcon icon={faPlus} />
                    </RemoteButton>
                </div>
            </div>

            <div className="flex flex-col w-2/3 justify-end">
                <div className="flex flex-col justify-center items-center ">
                    <label htmlFor="dynamic-eq" className="text-center"
                           style={{color:'#00be9f', width:'80%', paddingBottom:'5px'}}>Dynamic EQ</label>
                    <div id="dynamic-eq" className="flex" role="group">
                        <RemoteButton remote={ remote }
                                      className={denonState.PSREFLEV === "0" ? 'btn-primary-denon' : 'btn-secondary'}
                                      value="PSREFLEV 0"
                                      onClick={handleClick}>
                            0db
                        </RemoteButton>
                        <RemoteButton remote={ remote }
                                      className={denonState.PSREFLEV === "5" ? 'btn-primary-denon' : 'btn-secondary'}
                                      value="PSREFLEV 5"
                                      onClick={handleClick}>
                            5db
                        </RemoteButton>
                        <RemoteButton remote={ remote }
                                      className={denonState.PSREFLEV === "10" ? 'btn-primary-denon' : 'btn-secondary'}
                                      value="PSREFLEV 10"
                                      onClick={handleClick}>
                            10db
                        </RemoteButton>
                        <RemoteButton remote={ remote }
                                      className={denonState.PSREFLEV === "15" ? 'btn-primary-denon' : 'btn-secondary'}
                                      value="PSREFLEV 15"
                                      onClick={handleClick}>
                            15db
                        </RemoteButton>
                    </div>
                </div>

                <div className="flex flex-col justify-center items-center ">
                    <label htmlFor="dynamic-volume" className="text-center"
                           style={{color:'#00be9f'}}>Dynamic Volume</label>
                    <div id="dynamic-volume" className="flex" role="group">
                        <RemoteButton remote={ remote }
                                      className={(denonState.PSDYNVOL === "OFF" ? 'btn-primary-denon' : 'btn-secondary')
                                          + ' w-1/2 items-center justify-center'}
                                      value="PSDYNVOL OFF"
                                      onClick={handleClick}>
                            Off
                        </RemoteButton>
                        <RemoteButton remote={ remote }
                                      className={(denonState.PSDYNVOL === "LIT" ? 'btn-primary-denon' : 'btn-secondary')
                                          + ' w-1/2 items-center justify-center'}
                                      value="PSDYNVOL LIT"
                                      onClick={handleClick}>
                            Low
                        </RemoteButton>
                        <RemoteButton remote={ remote }
                                      className={(denonState.PSDYNVOL === "MED" ? 'btn-primary-denon' : 'btn-secondary')
                                          + ' w-1/2 items-center justify-center'}
                                      value="PSDYNVOL MED"
                                      onClick={handleClick}>
                            Med
                        </RemoteButton>
                        <RemoteButton remote={ remote }
                                      className={(denonState.PSDYNVOL === "HEV" ? 'btn-primary-denon' : 'btn-secondary')
                                          + ' w-1/2 items-center justify-center'}
                                      value="PSDYNVOL HEV"
                                      onClick={handleClick}>
                            High
                        </RemoteButton>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default LevelsControl;