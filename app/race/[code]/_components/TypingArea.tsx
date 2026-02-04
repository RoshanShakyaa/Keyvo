// _components/TypingArea.tsx
import { useRef, useLayoutEffect, useState } from "react";
import { Caret } from "./MultiplayerCaret";

interface TypingAreaProps {
  text: string;
  typedChars: { char: string; correct: boolean | null }[];
  caretIndex: number;
  otherCarets: Record<string, { caret: number; color: string }>;
  containerHeight?: number;
}

export function TypingArea({
  text,
  typedChars,
  caretIndex,
  otherCarets,
  containerHeight = 117,
}: TypingAreaProps) {
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const textWrapperRef = useRef<HTMLDivElement>(null);
  const otherCaretRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [caretPos, setCaretPos] = useState({ top: 0, left: 0 });
  const [scrollOffset, setScrollOffset] = useState(0);

  // Handle local player caret position (matches single-player logic exactly)
  useLayoutEffect(() => {
    const currentChar = charRefs.current[caretIndex];

    if (currentChar && containerRef.current && textWrapperRef.current) {
      // Get positions relative to the wrapper (not container)
      const wrapperRect = textWrapperRef.current.getBoundingClientRect();
      const charRect = currentChar.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      // Calculate position within the scrollable content
      const absoluteTop = charRect.top - wrapperRect.top;
      const relativeLeft = charRect.left - containerRect.left;

      // Line height = text-2xl × leading-relaxed = ~39px
      const lineHeight = 39;
      const currentLine = Math.floor(absoluteTop / lineHeight);

      // Calculate scroll offset to keep current line at line 1 (second visible line)
      // When you reach line 2 or beyond, start scrolling
      if (currentLine >= 2) {
        const newOffset = (currentLine - 1) * lineHeight;
        setScrollOffset(newOffset);
      }

      // Set caret position relative to visible area (accounting for scroll)
      setCaretPos({
        top: absoluteTop - scrollOffset,
        left: relativeLeft,
      });
    }
  }, [caretIndex, scrollOffset]);

  // Handle other players' caret positions using refs and direct style updates
  useLayoutEffect(() => {
    Object.entries(otherCarets).forEach(([id, data]) => {
      const targetChar = charRefs.current[data.caret];
      const caretElement = otherCaretRefs.current.get(id);

      if (
        targetChar &&
        containerRef.current &&
        textWrapperRef.current &&
        caretElement
      ) {
        const wrapperRect = textWrapperRef.current.getBoundingClientRect();
        const charRect = targetChar.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();

        const absoluteTop = charRect.top - wrapperRect.top;
        const relativeLeft = charRect.left - containerRect.left;

        const top = absoluteTop - scrollOffset;
        const left = relativeLeft;

        // Update via CSS custom properties that Framer Motion will animate
        caretElement.style.setProperty("--caret-x", `${left}px`);
        caretElement.style.setProperty("--caret-y", `${top}px`);
      }
    });
  }, [otherCarets, scrollOffset]);

  return (
    <div
      ref={containerRef}
      className="relative rounded-lg text-2xl leading-relaxed font-mono select-none overflow-hidden"
      style={{
        height: `${containerHeight}px`,
      }}
    >
      {/* Local Player Caret */}
      <Caret color="var(--primary)" top={caretPos.top} left={caretPos.left} />

      {/* Other Players' Carets */}
      {Object.entries(otherCarets).map(([id, data]) => (
        <div
          key={id}
          ref={(el) => {
            if (el) {
              otherCaretRefs.current.set(id, el);
            } else {
              otherCaretRefs.current.delete(id);
            }
          }}
          style={
            {
              position: "absolute",
              transform: "translate(var(--caret-x, 0px), var(--caret-y, 0px))",
              transition: "transform 0.15s ease-out",
              "--caret-x": "0px",
              "--caret-y": "0px",
            } as React.CSSProperties
          }
        >
          <Caret color={data.color} top={0} left={0} isMultiplayer />
        </div>
      ))}

      {/* The Text Content */}
      <div
        ref={textWrapperRef}
        className="relative transition-transform duration-150 ease-out"
        style={{
          transform: `translateY(-${scrollOffset}px)`,
        }}
      >
        {text.split("").map((char, i) => {
          const typed = typedChars[i];
          let color = "text-gray-500";

          if (typed) {
            color = typed.correct ? "text-primary" : "text-red-900";
          }

          return (
            <span
              key={i}
              ref={(el) => {
                charRefs.current[i] = el;
              }}
              className={`${color} transition-colors`}
            >
              {char}
            </span>
          );
        })}
      </div>
    </div>
  );
}
