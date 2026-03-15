"use client";

import { cn } from "@/lib/utils";

const GOLF_EMOJIS = [
  "🏌️", "🏌️‍♂️", "🏌️‍♀️", "⛳", "🏆", "🎯",
  "🦅", "🐦", "🐸", "🦈", "🐺", "🦁",
  "🔥", "💎", "⚡", "🎩", "🤠", "😎",
  "🧔", "👨‍🦰", "👩‍🦰", "🧑‍🦱", "👨‍🦳", "🧑",
  "🎪", "🎲", "🃏", "🍀", "🌟", "💀",
];

interface EmojiPickerProps {
  selected: string;
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ selected, onSelect }: EmojiPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {GOLF_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl text-2xl transition-all",
            "hover:scale-110 active:scale-95",
            selected === emoji
              ? "bg-primary/15 ring-2 ring-primary shadow-sm"
              : "bg-muted/50 hover:bg-muted"
          )}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
