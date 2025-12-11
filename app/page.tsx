"use client";
import KeyboardUI from "./_components/KeyboardUI";
import ToolKit from "./_components/ToolKit";
import dynamic from "next/dynamic";

const TypingTest = dynamic(() => import("@/app/_components/TypingTest"), {
  ssr: false,
});

export default function Home() {
  return (
    <section className=" flex-1 flex flex-col p-10">
      <ToolKit />
      <div id="game" className=" flex-1 pt-35 ">
        <TypingTest />
        <KeyboardUI />
      </div>
    </section>
  );
}
