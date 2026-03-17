"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { ScoreButton } from "./ScoreButton";
import {
  formatRelativeScore,
  getScoreName,
  getScoreEmoji,
} from "@/lib/scoring/calculator";

interface HoleCardProps {
  holeNumber: number;
  par: number;
  maxStrokes: number;
  currentStrokes: number | null;
  onScore: (strokes: number) => void;
}

export function HoleCard({
  holeNumber,
  par,
  maxStrokes,
  currentStrokes,
  onScore,
}: HoleCardProps) {
  const minStrokes = Math.max(1, par - 2);
  const quickMax = Math.min(par + 3, maxStrokes);
  const quickOptions: number[] = [];
  for (let s = minStrokes; s <= quickMax; s++) {
    quickOptions.push(s);
  }

  const needsStepper = maxStrokes > quickMax;
  const [stepperValue, setStepperValue] = useState(quickMax + 1);

  const handleStepperChange = (delta: number) => {
    const newVal = stepperValue + delta;
    if (newVal > quickMax && newVal <= maxStrokes) {
      setStepperValue(newVal);
    }
  };

  return (
    <div className="w-full px-1">
      <div className="premium-card p-5">
        {/* Hole header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-extrabold text-lg shadow-md">
              {holeNumber}
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Auk
              </div>
              <div className="text-lg font-bold text-foreground leading-tight">
                Par {par}
              </div>
            </div>
          </div>

          {/* Current score display */}
          {currentStrokes && (
            <motion.div
              key={currentStrokes}
              initial={{ scale: 0.7, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="mt-1"
            >
              <div className="inline-flex items-baseline gap-2 px-5 py-2 rounded-2xl bg-muted/50">
                <span className="text-5xl font-extrabold tracking-tight">
                  {currentStrokes}
                </span>
                <span className="text-lg font-semibold text-muted-foreground">
                  {formatRelativeScore(currentStrokes, par)}
                </span>
                <span className="text-2xl ml-0.5">
                  {getScoreEmoji(getScoreName(currentStrokes, par))}
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Score buttons grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {quickOptions.map((strokes) => (
            <ScoreButton
              key={strokes}
              strokes={strokes}
              par={par}
              isSelected={currentStrokes === strokes}
              onSelect={onScore}
            />
          ))}
        </div>

        {/* Stepper for higher scores */}
        {needsStepper && (
          <div className="mt-4 pt-4 border-t border-dashed border-border/50">
            <p className="text-[11px] text-center text-muted-foreground mb-2.5 font-medium uppercase tracking-wider">
              Rohkem lööke
            </p>
            <div className="flex items-center justify-center gap-5">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => handleStepperChange(-1)}
                disabled={stepperValue <= quickMax + 1}
                className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center disabled:opacity-20 transition-all"
              >
                <Minus className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => onScore(stepperValue)}
                className={`w-[72px] h-[72px] rounded-2xl flex flex-col items-center justify-center transition-all ${
                  currentStrokes === stepperValue
                    ? "score-triple ring-2 ring-offset-2 ring-offset-background ring-gold"
                    : "bg-muted/70 hover:bg-muted"
                }`}
              >
                <span className="text-[28px] font-extrabold">{stepperValue}</span>
                <span className="text-[9px] font-semibold opacity-60">
                  +{stepperValue - par}
                </span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => handleStepperChange(1)}
                disabled={stepperValue >= maxStrokes}
                className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center disabled:opacity-20 transition-all"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
