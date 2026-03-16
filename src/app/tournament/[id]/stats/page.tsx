"use client";

import { use } from "react";
import { motion } from "framer-motion";
import { BarChart3, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getScoreName, type ScoreName } from "@/lib/scoring/calculator";
import { cn } from "@/lib/utils";
import { useTournament } from "@/hooks/useTournament";
import { useScores } from "@/hooks/useScores";

const SCORE_COLORS: Record<ScoreName, string> = {
  ace: "bg-amber-400",
  albatross: "bg-emerald-700",
  eagle: "bg-emerald-600",
  birdie: "bg-emerald-500",
  par: "bg-slate-300 dark:bg-slate-600",
  bogey: "bg-amber-400",
  double_bogey: "bg-orange-500",
  triple_plus: "bg-red-500",
};

const SCORE_LABELS: Record<ScoreName, string> = {
  ace: "Ace", albatross: "Albatross", eagle: "Eagle", birdie: "Birdie",
  par: "Par", bogey: "Bogey", double_bogey: "Double", triple_plus: "Triple+",
};

export default function StatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { tournament, players, isLoading: tLoading } = useTournament(id);
  const { scores, isLoading: sLoading } = useScores(id);

  if (tLoading || sLoading) {
    return <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  }
  if (!tournament) return null;

  if (scores.length === 0) {
    return (
      <div className="px-4 py-5">
        <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold mb-4">Statistika</h1>
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-4xl mb-2">📈</div>
          <p>Pole veel tulemusi</p>
        </div>
      </div>
    );
  }

  // Per-player scoring distribution
  const playerStats = players.map((p) => {
    const playerScores = scores
      .filter((s) => s.player_id === p.id)
      .map((s) => ({
        hole: s.hole_number,
        strokes: s.strokes,
        par: tournament.hole_pars[s.hole_number - 1],
        name: getScoreName(s.strokes, tournament.hole_pars[s.hole_number - 1]),
      }));

    const distribution: Partial<Record<ScoreName, number>> = {};
    playerScores.forEach((s) => {
      distribution[s.name] = (distribution[s.name] || 0) + 1;
    });

    const totalStrokes = playerScores.reduce((sum, s) => sum + s.strokes, 0);
    const totalPar = playerScores.reduce((sum, s) => sum + s.par, 0);

    // Front/back 9
    const front = playerScores.filter((s) => s.hole <= 9);
    const back = playerScores.filter((s) => s.hole > 9);
    const frontTotal = front.reduce((sum, s) => sum + s.strokes, 0);
    const frontPar = front.reduce((sum, s) => sum + s.par, 0);
    const backTotal = back.reduce((sum, s) => sum + s.strokes, 0);
    const backPar = back.reduce((sum, s) => sum + s.par, 0);

    // Best/worst hole
    const best = playerScores.reduce<{ hole: number; diff: number } | null>(
      (b, s) => {
        const diff = s.strokes - s.par;
        return !b || diff < b.diff ? { hole: s.hole, diff } : b;
      },
      null
    );
    const worst = playerScores.reduce<{ hole: number; diff: number } | null>(
      (w, s) => {
        const diff = s.strokes - s.par;
        return !w || diff > w.diff ? { hole: s.hole, diff } : w;
      },
      null
    );

    // Average by par type
    const avgByPar: Record<number, { total: number; count: number }> = {};
    playerScores.forEach((s) => {
      if (!avgByPar[s.par]) avgByPar[s.par] = { total: 0, count: 0 };
      avgByPar[s.par].total += s.strokes;
      avgByPar[s.par].count++;
    });

    return {
      ...p,
      scores: playerScores,
      distribution,
      totalStrokes,
      totalPar,
      relative: totalStrokes - totalPar,
      thru: playerScores.length,
      frontTotal, frontPar, backTotal, backPar,
      best, worst,
      avgByPar,
    };
  }).filter((p) => p.thru > 0);

  // Hardest/easiest holes
  const holeStats = Array.from({ length: tournament.holes_count }, (_, i) => {
    const holeScores = scores.filter((s) => s.hole_number === i + 1);
    const par = tournament.hole_pars[i];
    const avgScore = holeScores.length > 0
      ? holeScores.reduce((sum, s) => sum + s.strokes, 0) / holeScores.length
      : par;
    return { hole: i + 1, par, avgScore, avgRelative: avgScore - par };
  });

  const hardest = [...holeStats].sort((a, b) => b.avgRelative - a.avgRelative).slice(0, 3);
  const easiest = [...holeStats].sort((a, b) => a.avgRelative - b.avgRelative).slice(0, 3);

  return (
    <div className="px-4 py-4 space-y-5">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold">Statistika</h1>
      </div>

      {/* Per-player stats */}
      {playerStats.map((p, pi) => (
        <motion.div key={p.id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: pi * 0.1 }}>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{p.emoji}</span>
                <span className="font-semibold">{p.name}</span>
                <span className="text-sm text-muted-foreground ml-auto">
                  {p.totalStrokes} ({p.relative >= 0 ? "+" : ""}{p.relative}) / {p.thru} auku
                </span>
              </div>

              {/* Scoring distribution bar */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Skoorijaotus</p>
                <div className="flex h-6 rounded-lg overflow-hidden">
                  {(["eagle", "birdie", "par", "bogey", "double_bogey", "triple_plus"] as ScoreName[]).map((name) => {
                    const count = p.distribution[name] || 0;
                    if (count === 0) return null;
                    const pct = (count / p.thru) * 100;
                    return (
                      <div key={name} className={cn("flex items-center justify-center text-[9px] font-bold text-white", SCORE_COLORS[name])}
                        style={{ width: `${pct}%` }} title={`${SCORE_LABELS[name]}: ${count}`}>
                        {pct > 8 ? count : ""}
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                  {(["eagle", "birdie", "par", "bogey", "double_bogey", "triple_plus"] as ScoreName[]).map((name) => {
                    const count = p.distribution[name] || 0;
                    if (count === 0) return null;
                    return (
                      <span key={name} className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <span className={cn("w-2 h-2 rounded-full", SCORE_COLORS[name])} />
                        {SCORE_LABELS[name]}: {count}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Front vs Back */}
              {tournament.holes_count === 18 && p.scores.some((s) => s.hole > 9) && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-muted/50 rounded-xl text-center">
                    <p className="text-[10px] text-muted-foreground">Esi 9</p>
                    <p className="font-bold text-lg">{p.frontTotal}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.frontTotal - p.frontPar >= 0 ? "+" : ""}{p.frontTotal - p.frontPar}
                    </p>
                  </div>
                  <div className="p-2.5 bg-muted/50 rounded-xl text-center">
                    <p className="text-[10px] text-muted-foreground">Taga 9</p>
                    <p className="font-bold text-lg">{p.backTotal}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.backTotal - p.backPar >= 0 ? "+" : ""}{p.backTotal - p.backPar}
                    </p>
                  </div>
                </div>
              )}

              {/* Best/Worst + Avg by par */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {p.best && (
                  <div>
                    <span className="text-muted-foreground">Parim auk: </span>
                    <span className="font-semibold">#{p.best.hole} ({p.best.diff >= 0 ? "+" : ""}{p.best.diff})</span>
                  </div>
                )}
                {p.worst && (
                  <div>
                    <span className="text-muted-foreground">Halvim auk: </span>
                    <span className="font-semibold">#{p.worst.hole} (+{p.worst.diff})</span>
                  </div>
                )}
                {Object.entries(p.avgByPar).map(([par, { total, count }]) => (
                  <div key={par}>
                    <span className="text-muted-foreground">Par-{par} keskmine: </span>
                    <span className="font-semibold">{(total / count).toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Hardest / Easiest holes */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs font-semibold text-destructive mb-2">Raskemad augud</p>
            {hardest.map((h) => (
              <div key={h.hole} className="flex justify-between text-xs py-0.5">
                <span>#{h.hole} (par {h.par})</span>
                <span className="font-semibold text-destructive">+{h.avgRelative.toFixed(1)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs font-semibold text-birdie mb-2">Kergemad augud</p>
            {easiest.map((h) => (
              <div key={h.hole} className="flex justify-between text-xs py-0.5">
                <span>#{h.hole} (par {h.par})</span>
                <span className="font-semibold text-birdie">
                  {h.avgRelative >= 0 ? "+" : ""}{h.avgRelative.toFixed(1)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
