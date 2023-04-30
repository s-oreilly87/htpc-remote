import {DENON_INPUTS, REMOTE} from "@/utilities/constants.js";
import KeypressButton from "@/components/UI/KeypressButton";
import {sendDenonCommand} from "@/utilities/http";

const InputSelect = ({ denonState, setDenonState, updateDenonState }) => {

    const handleClick = async (event) => {
        //TODO: figure out why loading isnt set right away, (not getting set until updateState is called after timeout)
        console.log('handleclick - setting loading true')
        setLoading(true)   // why isnt this working?
        // For responsiveness, update denonState.input before sending.  entire state will be refreshed afterwards
        // to pick up resulting changes
        setDenonState(prevState => ({
            ...prevState,
            input: Object.values(DENON_INPUTS).find(input => input.value === event.target.value),
            powerOn: true,
            loading: true
        }))

        const response = await sendDenonCommand(event.target)
        if (response.error) {
            setLoading(false)
            console.log(response.error)
            return
        }
        setTimeout(updateDenonState, 2500)
        setLoading(false)
    }

    const setLoading = (bool) => {
        setDenonState(prevState => ({
                ...prevState,
                loading: bool
            })
        )
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