"use client";
import { BigKeyboard } from "@/components/keyboard";
import { useKeyboardUIStore } from "@/lib/store";

export default function Home() {
  const keyboard = useKeyboardUIStore((state) => state.display);
  const toggleKeyboard = useKeyboardUIStore((state) => state.toggleKeyboard);
  return (
    <section className=" flex flex-col p-10">
      <div className="flex items-center gap-6 justify-center bg-gray-300 py-2 px-6 rounded-md w-fit mx-auto">
        <button className="cursor-pointer" onClick={toggleKeyboard}>
          keyboard
        </button>
        <p>Option 2</p>
        <p>Option 3</p>
        <p>Option 4</p>
        <p>Option 5</p>
      </div>
      <div id="game">
        <div className="flex-1 p-6 text-2xl pt-40">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolore dolor
          ratione rem corporis numquam enim possimus nulla exercitationem
          ducimus laborum?
        </div>

        {keyboard && <BigKeyboard />}
      </div>
    </section>
  );
}
