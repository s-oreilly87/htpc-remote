import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

interface ModalCloseButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  className?: string;
}

export default function ModalCloseButton({
  onClick,
  ariaLabel = "Close modal",
  className = "",
}: ModalCloseButtonProps) {
  return (
    <button
      type="button"
      className={`absolute -right-3 -top-4 z-50 inline-flex h-8 w-10 items-center justify-center rounded-md border border-transparent bg-red-700 text-sm font-medium text-white shadow-2xl hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${className}`}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <FontAwesomeIcon icon={faXmark} />
    </button>
  );
}
