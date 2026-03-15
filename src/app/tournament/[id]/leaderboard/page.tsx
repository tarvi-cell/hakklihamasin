"use client";

import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatRelativeScore,
  formatTotalRelativeScore,
  getScoreName,
  getScoreColorClass,
} from "@/lib/scoring/calculator";

interface LocalTournament {
  id: string;
  name: string;
  holes_count: number;
  hole_pars: number[];
  [key: string]: unknown;
}

interface LocalScore {
  hole: number;
  strokes: number;
}

export default function LeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tournament, setTournament] = useState<LocalTournament | null>(null);
  const [scores, setScores] = useState<LocalScore[]>([]);
  const [playerName, setPlayerName] = useState("Mängija");
  const [playerEmoji, setPlayerEmoji] = useState("🏌️");

  useEffect(() => {
    const stored = localStorage.getItem(`hakklihamasin-tournament-${id}`);
    if (stored) setTournament(JSON.parse(stored));
    const storedScores = localStorage.getItem(`hakklihamasin-scores-${id}`);
    if (storedScores) setScores(JSON.parse(storedScores));
    try {
      const p = JSON.parse(
        localStorage.getItem("hakklihamasin-player") || "{}"
      );
      if (p.name) setPlayerName(p.name);
      if (p.emoji) setPlayerEmoji(p.emoji);
    } catch {
      // ignore
    }
  }, [id]);

  if (!tournament) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Laen...</div>
      </div>
    );
  }

  const completedScores = scores.filter(
    (s) => s.hole <= tournament.holes_count
  );
  const totalRelative = formatTotalRelativeScore(
    completedScores.map((s) => ({
      strokes: s.strokes,
      par: tournament.hole_pars[s.hole - 1],
    }))
  );
  const totalStrokes = completedScores.reduce(
    (sum, s) => sum + s.strokes,
    0
  );

  return (
    <div className="px-4 py-5">
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="w-5 h-5 text-gold" />
        <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold">
          Edetabel
        </h1>
      </div>

      {/* Current player card */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gold/20 text-gold font-bold text-sm">
                1
              </div>
              <span className="text-2xl">{playerEmoji}</span>
              <div className="flex-1">
                <div className="font-semibold">{playerName}</div>
                <div className="text-sm text-muted-foreground">
                  {completedScores.length} auku läbitud
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{totalRelative}</div>
                <div className="text-xs text-muted-foreground">
                  {totalStrokes} lööki
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Hole-by-hole breakdown */}
      <h3 className="font-semibold mb-3">Auguti tulemused</h3>
      <div className="grid grid-cols-9 gap-1.5">
        {/* Headers - front 9 */}
        {Array.from(
          { length: Math.min(9, tournament.holes_count) },
          (_, i) => (
            <div
              key={`h-${i}`}
              className="text-center text-xs text-muted-foreground font-mono"
            >
              {i + 1}
            </div>
          )
        )}

        {/* Pars - front 9 */}
        {Array.from(
          { length: Math.min(9, tournament.holes_count) },
          (_, i) => (
            <div
              key={`p-${i}`}
              className="text-center text-xs text-muted-foreground bg-muted/50 rounded py-0.5"
            >
              {tournament.hole_pars[i]}
            </div>
          )
        )}

        {/* Scores - front 9 */}
        {Array.from(
          { length: Math.min(9, tournament.holes_count) },
          (_, i) => {
            const score = scores.find((s) => s.hole === i + 1);
            const par = tournament.hole_pars[i];
            if (!score) {
              return (
                <div
                  key={`s-${i}`}
                  className="text-center text-xs text-muted-foreground/40 rounded py-0.5"
                >
                  -
                </div>
              );
            }
            const name = getScoreName(score.strokes, par);
            const colorClass = getScoreColorClass(name);
            return (
              <div
                key={`s-${i}`}
                className={`text-center text-xs font-bold rounded py-0.5 ${colorClass}`}
              >
                {score.strokes}
              </div>
            );
          }
        )}
      </div>

      {/* Back 9 */}
      {tournament.holes_count === 18 && (
        <div className="grid grid-cols-9 gap-1.5 mt-3">
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={`h2-${i}`}
              className="text-center text-xs text-muted-foreground font-mono"
            >
              {i + 10}
            </div>
          ))}
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={`p2-${i}`}
              className="text-center text-xs text-muted-foreground bg-muted/50 rounded py-0.5"
            >
              {tournament.hole_pars[i + 9]}
            </div>
          ))}
          {Array.from({ length: 9 }, (_, i) => {
            const score = scores.find((s) => s.hole === i + 10);
            const par = tournament.hole_pars[i + 9];
            if (!score) {
              return (
                <div
                  key={`s2-${i}`}
                  className="text-center text-xs text-muted-foreground/40 rounded py-0.5"
                >
                  -
                </div>
              );
            }
            const name = getScoreName(score.strokes, par);
            const colorClass = getScoreColorClass(name);
            return (
              <div
                key={`s2-${i}`}
                className={`text-center text-xs font-bold rounded py-0.5 ${colorClass}`}
              >
                {score.strokes}
              </div>
            );
          })}
        </div>
      )}

      {completedScores.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-4xl mb-2">📊</div>
          <p>Pole veel tulemusi</p>
          <p className="text-sm">Alusta mängimist scorecard lehel!</p>
        </div>
      )}
    </div>
  );
}
