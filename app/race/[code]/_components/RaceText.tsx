import { Caret } from "./MultiplayerCaret";

type RaceTextProps = {
  text: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  typing: any;
  selfId: string;
  getPlayerColor: (id: string) => string;
  otherProgress: Record<string, { caret: number }>;
};

export function RaceText({
  text,
  typing,
  selfId,
  getPlayerColor,
  otherProgress,
}: RaceTextProps) {
  const getCaretsAtIndex = (index: number) => {
    const carets = [];

    if (typing.caret === index) {
      carets.push({ id: selfId });
    }

    Object.entries(otherProgress).forEach(([id, data]) => {
      if (data.caret === index) carets.push({ id });
    });

    return carets;
  };

  return (
    <div className="relative font-mono text-3xl leading-relaxed max-w-4xl mx-auto">
      {text.split("").map((char, i) => {
        const typed = typing.typedChars[i];
        let color = "text-gray-600";

        if (typed) {
          color = typed.correct ? "text-white" : "text-red-500";
        }

        const carets = getCaretsAtIndex(i);

        return (
          <span key={i} className={`relative inline-block ${color}`}>
            {carets.map((caret, idx) => (
              <span
                key={caret.id}
                className="absolute left-0 top-0"
                style={{ transform: `translateX(-2px)` }}
              >
                <Caret color={getPlayerColor(caret.id)} offsetY={idx * 14} />
              </span>
            ))}
            {char === " " ? "\u00A0" : char}
          </span>
        );
      })}
    </div>
  );
}
