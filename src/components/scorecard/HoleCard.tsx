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
  // Quick buttons: eagle to double bogey (or triple if room)
  const minStrokes = Math.max(1, par - 2);
  const quickMax = Math.min(par + 3, maxStrokes);
  const quickOptions: number[] = [];
  for (let s = minStrokes; s <= quickMax; s++) {
    quickOptions.push(s);
  }

  // Show stepper for higher scores
  const needsStepper = maxStrokes > quickMax;
  const [stepperValue, setStepperValue] = useState(quickMax + 1);

  const handleStepperChange = (delta: number) => {
    const newVal = stepperValue + delta;
    if (newVal > quickMax && newVal <= maxStrokes) {
      setStepperValue(newVal);
    }
  };

  return (
    <div className="w-full px-2">
      <div className="bg-card rounded-3xl shadow-lg border p-5">
        {/* Hole info */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full mb-2">
            <span className="text-sm font-medium text-primary">
              Auk {holeNumber}
            </span>
            <span className="text-xs text-primary/70">Par {par}</span>
          </div>
          {currentStrokes && (
            <motion.div
              key={currentStrokes}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-2"
            >
              <span className="text-4xl font-bold">{currentStrokes}</span>
              <span className="text-lg ml-2 text-muted-foreground">
                ({formatRelativeScore(currentStrokes, par)})
              </span>
              <span className="ml-1">
                {getScoreEmoji(getScoreName(currentStrokes, par))}
              </span>
            </motion.div>
          )}
        </div>

        {/* Quick score buttons */}
        <div className="grid grid-cols-3 gap-3">
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

        {/* Stepper for higher scores (par+4 and above) */}
        {needsStepper && (
          <div className="mt-4 pt-4 border-t border-dashed">
            <p className="text-xs text-center text-muted-foreground mb-2">
              Rohkem lööke
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => handleStepperChange(-1)}
                disabled={stepperValue <= quickMax + 1}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center
                           hover:bg-muted/80 disabled:opacity-30 active:scale-90 transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => onScore(stepperValue)}
                className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center
                           transition-all active:scale-90 ${
                             currentStrokes === stepperValue
                               ? "score-triple ring-2 ring-offset-2 ring-primary"
                               : "bg-muted/60 hover:bg-muted"
                           }`}
              >
                <span className="text-2xl font-bold">{stepperValue}</span>
                <span className="text-[9px] opacity-70">
                  +{stepperValue - par}
                </span>
              </button>
              <button
                onClick={() => handleStepperChange(1)}
                disabled={stepperValue >= maxStrokes}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center
                           hover:bg-muted/80 disabled:opacity-30 active:scale-90 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-1">
              Max {maxStrokes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
