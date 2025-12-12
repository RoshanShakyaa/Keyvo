"use client";
import { useKeyboardUIStore } from "@/lib/store";
import { Keyboard } from "lucide-react";

const ToolKit = () => {
  const toggleKeyboard = useKeyboardUIStore((state) => state.toggleKeyboard);
  return (
    <div className="flex items-center gap-6 justify-center bg-gray-200  py-2 px-6 rounded-md w-fit mx-auto">
      <button className="cursor-pointer" onClick={toggleKeyboard}>
        <Keyboard />
      </button>
      <p>Option 2</p>
      <p>Option 3</p>
      <p>Option 4</p>
      <p>Option 5</p>
    </div>
  );
};

export default ToolKit;
