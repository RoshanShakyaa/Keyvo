"use client";
import RestartButton from "./RestartButton";
import UserTypings from "./UserTypings";
import WordsContainer from "./WordsContainer";
import useEngine from "@/hooks/useEngine";

export const GeneratedWords = () => {
  const { words, typed, restart } = useEngine();

  return (
    <WordsContainer>
      <div className="text-gray-400">{words}</div>
      <UserTypings
        className="absolute inset-0"
        words={words}
        userInput={typed}
      />
      <RestartButton className="mx-auto mt-10 " onRestart={restart} />
    </WordsContainer>
  );
};
