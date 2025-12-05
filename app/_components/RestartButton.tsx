import { RefreshCcw } from "lucide-react";
import { useRef } from "react";

interface RestartProps {
  onRestart: () => void;
  className?: string;
}

const RestartButton = ({
  onRestart: handleRestart,
  className = "",
}: RestartProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    buttonRef.current?.blur();
    handleRestart();
  };
  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className={`block rounded  cursor-pointer group ${className}`}
    >
      <RefreshCcw className="size-6 group-hover:text-blue-400" />
    </button>
  );
};

export default RestartButton;
