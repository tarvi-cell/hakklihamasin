"use client";

import { cn } from "@/lib/utils";
import {
  getScoreName,
  getScoreEmoji,
  getScoreColorClass,
} from "@/lib/scoring/calculator";

interface ScoreButtonProps {
  strokes: number;
  par: number;
  isSelected: boolean;
  onSelect: (strokes: number) => void;
}

export function ScoreButton({
  strokes,
  par,
  isSelected,
  onSelect,
}: ScoreButtonProps) {
  const name = getScoreName(strokes, par);
  const emoji = getScoreEmoji(name);
  const colorClass = getScoreColorClass(name);
  const diff = strokes - par;

  const label =
    diff === 0
      ? "Par"
      : diff === -1
      ? "Birdie"
      : diff === -2
      ? "Eagle"
      : diff <= -3
      ? "Albatross"
      : diff === 1
      ? "Bogey"
      : diff === 2
      ? "Double"
      : "Triple+";

  return (
    <button
      onClick={() => {
        onSelect(strokes);
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(diff <= -1 ? [50, 30, 50] : 30);
        }
      }}
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl transition-all",
        "min-h-[72px] min-w-[72px]",
        "active:scale-90",
        isSelected
          ? `${colorClass} ring-2 ring-offset-2 ring-primary shadow-lg scale-105`
          : "bg-muted/60 hover:bg-muted text-foreground"
      )}
    >
      <span className="text-2xl font-bold">{strokes}</span>
      <span className="text-[10px] font-medium opacity-80">
        {emoji} {label}
      </span>
    </button>
  );
}
