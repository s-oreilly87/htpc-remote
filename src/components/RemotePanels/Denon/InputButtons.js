import {DENON_INPUTS, REMOTE} from "@/utilities/constants.js";
import KeypressButton from "@/components/UI/KeypressButton";
import {sendDenonCommand} from "@/utilities/http";

const InputSelect = ({ denonState, setDenonState, updateDenonState }) => {

    const handleClick = async (event) => {
        // For responsiveness, update denonState.input before sending.  entire state will be refreshed afterwards
        // to pick up resulting changes
        setDenonState(prevState => ({
            ...prevState,
            input: Object.values(DENON_INPUTS).find(input => input.value === event.target.value),
            powerOn: true
        }))

        const response = await sendDenonCommand(event.target)
        if (response.error) {
            return console.log(response.error)
        }
        setTimeout(updateDenonState, 2000)
    }

    return (
        <div id="avr-inputs" className="w-full flex place-content-center gap-2">
            <div className="grid grid-cols-3 grid-rows-2 gap-2 w-full">
                {Object.values(DENON_INPUTS).map(input => (
                    <KeypressButton
                            remote={REMOTE.DENON}
                            key={input.value}
                            className={`btn z-50 ${denonState.input.value === input.value ? 'btn-primary-denon' : 'btn-secondary'}`}
                            value={input.value}
                            onClick={ handleClick }>
                        { input.label }
                    </KeypressButton>
                ))
                }
            </div>
        </div>
    );
}

export default InputSelect;