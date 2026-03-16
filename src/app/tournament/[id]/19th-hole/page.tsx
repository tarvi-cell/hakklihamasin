"use client";

import { use } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getScoreName } from "@/lib/scoring/calculator";
import { useTournament } from "@/hooks/useTournament";
import { useScores } from "@/hooks/useScores";

export default function NineteenthHole({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { tournament, players, isLoading: tLoading } = useTournament(id);
  const { scores, isLoading: sLoading } = useScores(id);

  if (tLoading || sLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  if (!tournament || scores.length === 0) {
    return (
      <div className="px-4 py-5">
        <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold mb-4">19. Auk 🍺</h1>
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-4xl mb-2">🍺</div>
          <p>Lõpeta ring kõigepealt!</p>
        </div>
      </div>
    );
  }

  // Calculate awards per player
  const playerStats = players.map((p) => {
    const ps = scores
      .filter((s) => s.player_id === p.id)
      .map((s) => ({
        hole: s.hole_number,
        strokes: s.strokes,
        par: tournament.hole_pars[s.hole_number - 1],
        relative: s.strokes - tournament.hole_pars[s.hole_number - 1],
      }));

    const birdies = ps.filter((s) => s.relative < 0).length;
    const pars = ps.filter((s) => s.relative === 0).length;
    const total = ps.reduce((sum, s) => sum + s.strokes, 0);
    const totalPar = ps.reduce((sum, s) => sum + s.par, 0);
    const relative = total - totalPar;

    const best = ps.reduce<{ hole: number; diff: number } | null>(
      (b, s) => (!b || s.relative < b.diff ? { hole: s.hole, diff: s.relative } : b), null
    );
    const worst = ps.reduce<{ hole: number; diff: number } | null>(
      (w, s) => (!w || s.relative > w.diff ? { hole: s.hole, diff: s.relative } : w), null
    );

    const front9 = ps.filter((s) => s.hole <= 9).reduce((sum, s) => sum + s.relative, 0);
    const back9 = ps.filter((s) => s.hole > 9).reduce((sum, s) => sum + s.relative, 0);

    return { ...p, total, relative, birdies, pars, best, worst, front9, back9, thru: ps.length };
  }).filter((p) => p.thru > 0);

  if (playerStats.length === 0) {
    return (
      <div className="px-4 py-5 text-center py-12 text-muted-foreground">
        <div className="text-4xl mb-2">🍺</div>
        <p>Pole veel piisavalt tulemusi</p>
      </div>
    );
  }

  // Determine award winners
  const sorted = [...playerStats].sort((a, b) => a.relative - b.relative);
  const winner = sorted[0];
  const mostBirdies = [...playerStats].sort((a, b) => b.birdies - a.birdies)[0];
  const mostPars = [...playerStats].sort((a, b) => b.pars - a.pars)[0];
  const comebackKid = [...playerStats].sort((a, b) => (a.front9 - a.back9) - (b.front9 - b.back9))[0];
  const cardWrecker = [...playerStats].sort((a, b) => (b.worst?.diff || 0) - (a.worst?.diff || 0))[0];
  const roller = [...playerStats].sort((a, b) => {
    const rangeA = (a.worst?.diff || 0) - (a.best?.diff || 0);
    const rangeB = (b.worst?.diff || 0) - (b.best?.diff || 0);
    return rangeB - rangeA;
  })[0];

  const awards = [
    { emoji: "🏆", title: "Low Gross", player: winner, value: `${winner.total} (${winner.relative >= 0 ? "+" : ""}${winner.relative})` },
    { emoji: "🐦", title: "Birdie Hunter", player: mostBirdies, value: `${mostBirdies.birdies} birdie'd` },
    { emoji: "⛳", title: "Mr. Consistent", player: mostPars, value: `${mostPars.pars} par'i` },
    ...(comebackKid.front9 > comebackKid.back9 ? [{ emoji: "📈", title: "Comeback Kid", player: comebackKid, value: `Esi: +${comebackKid.front9} → Taga: ${comebackKid.back9 >= 0 ? "+" : ""}${comebackKid.back9}` }] : []),
    { emoji: "💀", title: "Card Wrecker", player: cardWrecker, value: `Auk #${cardWrecker.worst?.hole} (+${cardWrecker.worst?.diff})` },
    { emoji: "🎢", title: "Roller Coaster", player: roller, value: `Best: ${roller.best?.diff}, Worst: +${roller.worst?.diff}` },
  ];

  return (
    <div className="px-4 py-5">
      <div className="text-center mb-6">
        <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", duration: 0.8 }} className="text-6xl mb-3">
          🍺
        </motion.div>
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold">19. Auk</h1>
        <p className="text-muted-foreground text-sm mt-1">Auhinnad ja tulemused</p>
      </div>

      <div className="space-y-3">
        {awards.map((award, i) => (
          <motion.div key={award.title} initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.15 }}>
            <Card className={i === 0 ? "border-gold/50 bg-gold/5" : ""}>
              <CardContent className="flex items-center gap-4 p-4">
                <span className="text-3xl">{award.emoji}</span>
                <div className="flex-1">
                  <div className="font-semibold">{award.title}</div>
                  <div className="text-sm text-muted-foreground">{award.value}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">{award.player.emoji}</span>
                  <span className="font-medium text-sm">{award.player.name}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Final standings */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: awards.length * 0.15 + 0.2 }} className="mt-6">
        <h3 className="font-semibold mb-3">Lõplik järjestus</h3>
        {sorted.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3 py-2 border-b last:border-0">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground"}`}>
              {i + 1}
            </span>
            <span className="text-lg">{p.emoji}</span>
            <span className="font-medium flex-1">{p.name}</span>
            <span className="font-bold">{p.total} ({p.relative >= 0 ? "+" : ""}{p.relative})</span>
          </div>
        ))}
      </motion.div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: awards.length * 0.15 + 0.5 }}
        className="text-center mt-8 p-6 bg-primary/5 rounded-2xl">
        <p className="text-lg font-semibold">What a round, legends! ⛳</p>
        <p className="text-sm text-muted-foreground mt-1">See you on the first tee next time!</p>
      </motion.div>
    </div>
  );
}
