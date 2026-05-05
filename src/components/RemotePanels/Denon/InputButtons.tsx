import { RemoteType } from "@/constants/remotes";
import { DENON_INPUTS } from "@/constants/denon";
import KeypressButton from "@/components/UI/KeypressButton";
import { sendDenonCommand } from "@/utilities/http";
import { useDenonContext } from "@/context/denon";

const InputButtons = ({}) => {
  const { denonState, updateDenonState, invalidateDenonState } = useDenonContext();

  const handleClick = async (event) => {
    // Optimistically reflect the input switch immediately for responsiveness.
    // The delayed invalidation will sync the full AVR state once it settles.
    updateDenonState({
      input: Object.values(DENON_INPUTS).find(
        (input) => input.value === event.target.value,
      ),
      powerOn: true,
    });

    const response = await sendDenonCommand(event.target);
    if (response.error) {
      return console.error(response.error);
    }

    // AVR takes ~2.5s to finish switching inputs before state is stable
    setTimeout(invalidateDenonState, 2500);
  };

  return (
    <div id="avr-inputs" className="w-full flex place-content-center gap-2">
      <div className="grid grid-cols-3 grid-rows-2 gap-2 w-full">
        {Object.values(DENON_INPUTS).map((input) => (
          <KeypressButton
            remote={RemoteType.DENON}
            key={input.value}
            className={`btn text-sm z-50 ${
              denonState.input?.value === input.value
                ? "btn-primary-denon"
                : "btn-secondary"
            }`}
            value={input.value}
            onClick={handleClick}
          >
            {input.label}
          </KeypressButton>
        ))}
      </div>
    </div>
  );
};

export default InputButtons;
