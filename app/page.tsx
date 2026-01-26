"use client";
import dynamic from "next/dynamic";

const TypingTest = dynamic(() => import("@/app/_components/TypingTest"), {
  ssr: false,
});

export default function Home() {
  return (
    <section className=" flex-1 flex flex-col p-10">
      <TypingTest />
    </section>
  );
}
