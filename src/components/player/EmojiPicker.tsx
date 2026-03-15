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
    <div className="grid grid-cols-6 gap-2.5">
      {GOLF_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className={cn(
            "flex items-center justify-center aspect-square rounded-2xl text-2xl transition-all",
            "active:scale-90",
            selected === emoji
              ? "bg-primary/15 ring-2 ring-primary shadow-md scale-110"
              : "bg-muted/50 hover:bg-muted"
          )}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
