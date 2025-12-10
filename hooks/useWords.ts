import { faker } from "@faker-js/faker";
import { useCallback, useEffect, useState } from "react";

const generateWords = (count: number) => {
  return faker.word
    .words({
      count: count,
    })
    .toLowerCase();
};

const useWords = (count: number) => {
  const [words, setWords] = useState<string>("");

  useEffect(() => {
    setWords(generateWords(count));
  }, [count]);

  const updateWords = useCallback(() => {
    setWords(generateWords(count));
  }, [count]);

  return { words, updateWords };
};

export default useWords;
