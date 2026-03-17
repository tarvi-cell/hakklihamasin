"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
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
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={() => {
        onSelect(strokes);
        if (navigator.vibrate) {
          navigator.vibrate(diff <= -1 ? [50, 30, 50] : 30);
        }
      }}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-2xl transition-all overflow-hidden",
        "min-h-[80px]",
        isSelected
          ? `${colorClass} ring-2 ring-offset-2 ring-offset-background ring-gold scale-[1.05]`
          : "bg-muted/70 text-foreground hover:bg-muted"
      )}
    >
      {/* Subtle inner highlight when not selected */}
      {!isSelected && (
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none rounded-2xl" />
      )}
      <span className="text-[28px] font-extrabold leading-none">{strokes}</span>
      <span className="text-[10px] font-semibold mt-0.5 opacity-80 tracking-wide">
        {emoji} {label}
      </span>
    </motion.button>
  );
}
