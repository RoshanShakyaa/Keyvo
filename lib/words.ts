// lib/words.ts
import englishWords from "@/public/words/english.json";

export function getRandomWords(
  count: number,
  options?: {
    punctuation?: boolean;
    numbers?: boolean;
  }
): string[] {
  const words = englishWords.words;
  const result: string[] = [];

  const punctuationMarks = [".", ",", "!", "?", ";", ":"];
  const shouldAddPunctuation = options?.punctuation ?? false;
  const shouldAddNumbers = options?.numbers ?? false;

  // Calculate how many numbers to add (at least 15% of total words, rounded up)
  const numNumberWords = shouldAddNumbers ? Math.ceil(count * 0.15) : 0;

  // Create array of indices where numbers should appear
  const numberIndices = new Set<number>();
  if (shouldAddNumbers) {
    while (numberIndices.size < numNumberWords) {
      numberIndices.add(Math.floor(Math.random() * count));
    }
  }

  let shouldCapitalize = true; // First word is always capitalized if punctuation is on

  for (let i = 0; i < count; i++) {
    let word: string;

    // Add number at predetermined indices
    if (numberIndices.has(i)) {
      const number = Math.floor(Math.random() * 1000);
      word = number.toString();
      shouldCapitalize = false; // Don't capitalize after number
    } else {
      word = words[Math.floor(Math.random() * words.length)];

      // Capitalize if needed
      if (shouldAddPunctuation && shouldCapitalize) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
        shouldCapitalize = false;
      }
    }

    // Add punctuation randomly (about 20% of words, but not on numbers)
    if (shouldAddPunctuation && !numberIndices.has(i) && Math.random() < 0.2) {
      const punctuation =
        punctuationMarks[Math.floor(Math.random() * punctuationMarks.length)];
      word = word + punctuation;

      // Capitalize next word if it's a sentence-ending punctuation
      if ([".", "!", "?"].includes(punctuation)) {
        shouldCapitalize = true;
      }
    }

    result.push(word);
  }

  return result;
}
