"use client";
import { BigKeyboard } from "@/components/keyboard";
import { useKeyboardUIStore } from "@/lib/store";
import { faker } from "@faker-js/faker";
import RestartButton from "./_components/RestartButton";

export default function Home() {
  const keyboard = useKeyboardUIStore((state) => state.display);
  const toggleKeyboard = useKeyboardUIStore((state) => state.toggleKeyboard);
  const words = faker.word.words({
    count: 20,
  });

  return (
    <section className=" flex-1 flex flex-col p-10">
      <div className="flex items-center gap-6 justify-center  py-2 px-6 rounded-md w-fit mx-auto">
        <button className="cursor-pointer" onClick={toggleKeyboard}>
          keyboard
        </button>
        <p>Option 2</p>
        <p>Option 3</p>
        <p>Option 4</p>
        <p>Option 5</p>
      </div>
      <div id="game" className=" flex-1 pt-35 ">
        <CountdownTimer timeLeft={30} />
        <GeneratedWords words={words} />
        <RestartButton
          className="mx-auto mt-10 text-zinc-700"
          onRestart={() => null}
        />
        <div className="mt-30">{keyboard && <BigKeyboard />}</div>
      </div>
    </section>
  );
}

const GeneratedWords = ({ words }: { words: string }) => {
  return <div className="flex-1   text-2xl ">{words}</div>;
};

const CountdownTimer = ({ timeLeft }: { timeLeft: number }) => {
  return (
    <div className="text-primary text-xl font-medium mb-4">{timeLeft}</div>
  );
};
