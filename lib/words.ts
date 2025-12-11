// lib/words.ts
import englishWords from "@/public/words/english.json";

export function getRandomWords(count: number): string[] {
  const words = englishWords.words;
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(words[Math.floor(Math.random() * words.length)]);
  }
  return result;
}
