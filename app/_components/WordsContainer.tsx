import React from "react";

const WordsContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative flex-1 text-gray-600  text-2xl leading-relaxed mt-3 ">
      {children}
    </div>
  );
};

export default WordsContainer;
