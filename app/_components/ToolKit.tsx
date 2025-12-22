"use client";

import { useState } from "react";
import { useKeyboardUIStore, useToolkitStore } from "@/lib/store";
import { CaseUpper, Keyboard, Timer, Settings, X } from "lucide-react";

const ToolKit = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleKeyboard = useKeyboardUIStore((s) => s.toggleKeyboard);

  const {
    number,
    punctuation,
    toggleNumber,
    togglePunctuation,
    setTime,
    setWords,
    words,
    time,
  } = useToolkitStore();

  const active = "font-semibold text-primary cursor-pointer";
  const inactive =
    "font-normal text-muted-foreground cursor-pointer hover:text-foreground";

  return (
    <>
      {/* Mobile: Settings button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden flex items-center gap-2 bg-secondary/50 py-2 px-4 rounded-md mx-auto hover:bg-secondary transition-colors"
      >
        <Settings className="size-5" />
        <span className="text-sm font-medium">Settings</span>
      </button>

      {/* Mobile: Overlay modal */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 w-full max-w-sm relative shadow-xl">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </button>

            <h2 className="text-lg font-semibold mb-6">Typing Settings</h2>

            <div className="space-y-6">
              {/* Keyboard toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Show Keyboard</span>
                <button
                  onClick={toggleKeyboard}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Keyboard className="size-5" />
                </button>
              </div>

              {/* Punctuation */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Punctuation</span>
                <button
                  className={`px-4 py-2 rounded-md transition-colors ${
                    punctuation
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                  onClick={togglePunctuation}
                >
                  {punctuation ? "On" : "Off"}
                </button>
              </div>

              {/* Numbers */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Numbers</span>
                <button
                  className={`px-4 py-2 rounded-md transition-colors ${
                    number
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                  onClick={toggleNumber}
                >
                  {number ? "On" : "Off"}
                </button>
              </div>

              {/* Time */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Timer className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Time (seconds)</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    className={`py-2 rounded-md transition-colors ${
                      time === 15
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                    onClick={() => setTime(15)}
                  >
                    15
                  </button>
                  <button
                    className={`py-2 rounded-md transition-colors ${
                      time === 30
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                    onClick={() => setTime(30)}
                  >
                    30
                  </button>
                  <button
                    className={`py-2 rounded-md transition-colors ${
                      time === 60
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                    onClick={() => setTime(60)}
                  >
                    60
                  </button>
                  <button
                    className={`py-2 rounded-md transition-colors ${
                      time === 120
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                    onClick={() => setTime(120)}
                  >
                    120
                  </button>
                </div>
              </div>

              {/* Words */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CaseUpper className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Words</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    className={`py-2 rounded-md transition-colors ${
                      words === 15
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                    onClick={() => setWords(15)}
                  >
                    15
                  </button>
                  <button
                    className={`py-2 rounded-md transition-colors ${
                      words === 25
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                    onClick={() => setWords(25)}
                  >
                    25
                  </button>
                  <button
                    className={`py-2 rounded-md transition-colors ${
                      words === 50
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                    onClick={() => setWords(50)}
                  >
                    50
                  </button>
                  <button
                    className={`py-2 rounded-md transition-colors ${
                      words === 100
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                    onClick={() => setWords(100)}
                  >
                    100
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop: Original horizontal layout */}
      <div className="hidden md:flex items-center gap-4 justify-center bg-secondary/50 py-2 px-6 rounded-md w-fit mx-auto">
        <button
          onClick={toggleKeyboard}
          className="text-muted-foreground hover:text-primary transition-colors"
          aria-label="Toggle keyboard"
        >
          <Keyboard />
        </button>

        <button
          className={`cursor-pointer transition-colors ${
            punctuation
              ? "font-semibold text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={togglePunctuation}
        >
          punctuation
        </button>

        <button
          className={`cursor-pointer transition-colors ${
            number
              ? "font-semibold text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={toggleNumber}
        >
          numbers
        </button>

        <span className="text-border">|</span>
        <Timer className="size-4 text-muted-foreground" />
        <button
          className={time === 15 ? active : inactive}
          onClick={() => setTime(15)}
        >
          15
        </button>

        <button
          className={time === 30 ? active : inactive}
          onClick={() => setTime(30)}
        >
          30
        </button>

        <button
          className={time === 60 ? active : inactive}
          onClick={() => setTime(60)}
        >
          60
        </button>

        <button
          className={time === 120 ? active : inactive}
          onClick={() => setTime(120)}
        >
          120
        </button>

        <span className="text-border">|</span>
        <CaseUpper className="size-4 text-muted-foreground" />
        <button
          className={words === 15 ? active : inactive}
          onClick={() => setWords(15)}
        >
          15
        </button>

        <button
          className={words === 25 ? active : inactive}
          onClick={() => setWords(25)}
        >
          25
        </button>

        <button
          className={words === 50 ? active : inactive}
          onClick={() => setWords(50)}
        >
          50
        </button>

        <button
          className={words === 100 ? active : inactive}
          onClick={() => setWords(100)}
        >
          100
        </button>
      </div>
    </>
  );
};

export default ToolKit;
