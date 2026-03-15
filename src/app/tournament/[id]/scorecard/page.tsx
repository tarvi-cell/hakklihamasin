"use client";

import { useEffect, useState, useCallback, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Grid3X3 } from "lucide-react";
import { HoleCard } from "@/components/scorecard/HoleCard";
import {
  formatTotalRelativeScore,
  getScoreName,
  getScoreEmoji,
  getScoreLabel,
} from "@/lib/scoring/calculator";
import { getRandomMessage } from "@/lib/messages/templates";
import { toast } from "sonner";

interface LocalTournament {
  id: string;
  name: string;
  holes_count: number;
  hole_pars: number[];
  settings?: {
    max_strokes_mode?: "par_plus" | "fixed" | "unlimited";
    max_strokes_value?: number | null;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface LocalScore {
  hole: number;
  strokes: number;
  timestamp: string;
}

export default function ScorecardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tournament, setTournament] = useState<LocalTournament | null>(null);
  const [scores, setScores] = useState<LocalScore[]>([]);
  const [currentHole, setCurrentHole] = useState(1);
  const [direction, setDirection] = useState(0);
  const [lastUndo, setLastUndo] = useState<LocalScore | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`hakklihamasin-tournament-${id}`);
    if (stored) {
      setTournament(JSON.parse(stored));
    }
    const storedScores = localStorage.getItem(
      `hakklihamasin-scores-${id}`
    );
    if (storedScores) {
      setScores(JSON.parse(storedScores));
    }
  }, [id]);

  const saveScores = useCallback(
    (newScores: LocalScore[]) => {
      setScores(newScores);
      localStorage.setItem(
        `hakklihamasin-scores-${id}`,
        JSON.stringify(newScores)
      );
    },
    [id]
  );

  const handleScore = useCallback(
    (holeNumber: number, strokes: number) => {
      if (!tournament) return;

      const existing = scores.find((s) => s.hole === holeNumber);
      const newScore: LocalScore = {
        hole: holeNumber,
        strokes,
        timestamp: new Date().toISOString(),
      };

      let newScores: LocalScore[];
      if (existing) {
        newScores = scores.map((s) =>
          s.hole === holeNumber ? newScore : s
        );
      } else {
        newScores = [...scores, newScore];
      }
      saveScores(newScores);

      // Set undo target
      setLastUndo(existing || null);

      // Trigger fun message
      const par = tournament.hole_pars[holeNumber - 1];
      const scoreName = getScoreName(strokes, par);
      const playerName = (() => {
        try {
          const p = JSON.parse(
            localStorage.getItem("hakklihamasin-player") || "{}"
          );
          return p.name || "Mängija";
        } catch {
          return "Mängija";
        }
      })();

      // Show message for notable scores
      if (
        scoreName === "ace" ||
        scoreName === "albatross" ||
        scoreName === "eagle" ||
        scoreName === "birdie" ||
        scoreName === "triple_plus"
      ) {
        const msg = getRandomMessage(scoreName, {
          player: playerName,
          hole: holeNumber,
          score: strokes,
        });
        if (msg) {
          toast(msg, {
            duration: 4000,
            className:
              scoreName === "triple_plus"
                ? "!bg-orange-50 !border-orange-200"
                : "!bg-emerald-50 !border-emerald-200",
          });
        }
      }

      // Check for bounce-back
      if (scoreName === "birdie" || scoreName === "eagle") {
        const prevScore = scores.find((s) => s.hole === holeNumber - 1);
        if (prevScore) {
          const prevPar = tournament.hole_pars[holeNumber - 2];
          const prevDiff = prevScore.strokes - prevPar;
          if (prevDiff >= 2) {
            const msg = getRandomMessage("bounce_back", {
              player: playerName,
            });
            if (msg) {
              setTimeout(() => {
                toast(msg, {
                  duration: 3000,
                  className: "!bg-amber-50 !border-amber-200",
                });
              }, 1500);
            }
          }
        }
      }

      // Check for first birdie
      const hasPriorBirdie = scores.some((s) => {
        const p = tournament.hole_pars[s.hole - 1];
        return s.strokes < p && s.hole !== holeNumber;
      });
      if ((scoreName === "birdie" || scoreName === "eagle") && !hasPriorBirdie) {
        const msg = getRandomMessage("first_birdie", {
          player: playerName,
        });
        if (msg) {
          setTimeout(() => {
            toast(msg, { duration: 3000 });
          }, 2000);
        }
      }

      // Auto-advance to next hole after scoring
      if (holeNumber < tournament.holes_count) {
        setTimeout(() => {
          setDirection(1);
          setCurrentHole(holeNumber + 1);
        }, 600);
      }

      // Show undo toast
      const label = getScoreLabel(scoreName);
      const emoji = getScoreEmoji(scoreName);
      toast(`${emoji} Auk ${holeNumber}: ${strokes} (${label})`, {
        duration: 5000,
        action: {
          label: "Tühista",
          onClick: () => {
            if (existing) {
              const reverted = newScores.map((s) =>
                s.hole === holeNumber ? existing : s
              );
              saveScores(reverted);
            } else {
              saveScores(newScores.filter((s) => s.hole !== holeNumber));
            }
            toast.dismiss();
          },
        },
      });
    },
    [tournament, scores, saveScores]
  );

  const goToHole = (hole: number) => {
    if (!tournament || hole < 1 || hole > tournament.holes_count) return;
    setDirection(hole > currentHole ? 1 : -1);
    setCurrentHole(hole);
  };

  if (!tournament) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Laen...</div>
      </div>
    );
  }

  const currentPar = tournament.hole_pars[currentHole - 1];
  const currentScore = scores.find((s) => s.hole === currentHole);

  // Max strokes calculation from tournament settings
  const getMaxStrokes = (par: number): number => {
    const settings = tournament.settings;
    if (!settings?.max_strokes_mode || settings.max_strokes_mode === "unlimited") return 20;
    if (settings.max_strokes_mode === "fixed") return Number(settings.max_strokes_value) || 12;
    // par_plus
    return par + (Number(settings.max_strokes_value) || 3);
  };
  const currentMaxStrokes = getMaxStrokes(currentPar);
  const completedScores = scores
    .filter((s) => s.hole <= tournament.holes_count)
    .map((s) => ({
      strokes: s.strokes,
      par: tournament.hole_pars[s.hole - 1],
    }));
  const totalRelative = formatTotalRelativeScore(completedScores);
  const totalStrokes = completedScores.reduce((sum, s) => sum + s.strokes, 0);
  const totalPar = completedScores.reduce((sum, s) => sum + s.par, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Top status bar */}
      <div className="bg-primary text-primary-foreground px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm opacity-80">
              {tournament.name}
            </h2>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-2xl font-bold">{totalRelative}</span>
              <span className="text-sm opacity-70">
                {totalStrokes} löök{totalStrokes !== 1 ? "i" : ""} /{" "}
                {scores.length} auku läbitud
              </span>
            </div>
          </div>
          {/* Mini scorecard dots */}
          <div className="flex flex-wrap gap-1 max-w-[120px] justify-end">
            {Array.from({ length: tournament.holes_count }, (_, i) => {
              const score = scores.find((s) => s.hole === i + 1);
              const par = tournament.hole_pars[i];
              let dotColor = "bg-white/20";
              if (score) {
                const diff = score.strokes - par;
                if (diff < 0) dotColor = "bg-emerald-400";
                else if (diff === 0) dotColor = "bg-white/60";
                else if (diff === 1) dotColor = "bg-amber-400";
                else dotColor = "bg-red-400";
              }
              return (
                <button
                  key={i}
                  onClick={() => goToHole(i + 1)}
                  className={`w-3.5 h-3.5 rounded-full ${dotColor} ${
                    i + 1 === currentHole
                      ? "ring-2 ring-white ring-offset-1 ring-offset-primary"
                      : ""
                  } transition-all`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Hole navigation arrows + card */}
      <div className="flex-1 flex items-center px-2 py-4">
        <button
          onClick={() => goToHole(currentHole - 1)}
          disabled={currentHole === 1}
          className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentHole}
              initial={{ x: direction * 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -100, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <HoleCard
                holeNumber={currentHole}
                par={currentPar}
                maxStrokes={currentMaxStrokes}
                currentStrokes={currentScore?.strokes ?? null}
                onScore={(strokes) => handleScore(currentHole, strokes)}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          onClick={() => goToHole(currentHole + 1)}
          disabled={currentHole === tournament.holes_count}
          className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* Hole number indicator */}
      <div className="text-center pb-4 text-sm text-muted-foreground">
        Auk {currentHole} / {tournament.holes_count}
      </div>
    </div>
  );
}
