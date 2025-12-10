"use client";
import useEngine from "@/hooks/useEngine";
import { GeneratedWords } from "./_components/GenerateWords";
import KeyboardUI from "./_components/KeyboardUI";
import Result from "./_components/Result";
import ToolKit from "./_components/ToolKit";
import { calculateAccuracyPercentage } from "@/utils/helpers";

export default function Home() {
  const { state, timeLeft, totalTyped, errors } = useEngine();

  return (
    <section className=" flex-1 flex flex-col p-10">
      <ToolKit />
      <div id="game" className=" flex-1 pt-35 ">
        <CountdownTimer timeLeft={timeLeft} />

        <GeneratedWords />

        <Result
          state={state}
          accuracyPercentage={calculateAccuracyPercentage(errors, totalTyped)}
          errors={errors}
          total={totalTyped}
        />
        <KeyboardUI />
      </div>
    </section>
  );
}

const CountdownTimer = ({ timeLeft }: { timeLeft: number }) => {
  return (
    <div className="text-primary text-xl font-medium mb-4">{timeLeft}</div>
  );
};
