import { cn } from "@/lib/utils";
import Cartet from "./Cartet";

interface UserTypingsProps {
  userInput: string;
  className?: string;
  words: string;
}

const UserTypings = ({ userInput, className, words }: UserTypingsProps) => {
  const typedCharacters = userInput.split("");
  return (
    <div className={className}>
      {typedCharacters.map((char, index) => (
        <Character
          actual={char}
          expected={words[index]}
          key={`${char}_${index}`}
        ></Character>
      ))}
      <Cartet />
    </div>
  );
};

const Character = ({
  actual,
  expected,
}: {
  actual: string;
  expected: string;
}) => {
  const isCorrect = actual === expected;
  const isWhiteSpace = expected === " ";
  return (
    <span
      className={cn({
        "text-red-500": !isCorrect && !isWhiteSpace,
        "text-black": isCorrect && !isWhiteSpace,
        "bg-red-500/50": !isCorrect && isWhiteSpace,
      })}
    >
      {expected}
    </span>
  );
};

export default UserTypings;
