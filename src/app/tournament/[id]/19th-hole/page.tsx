"use client";

import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import { Beer, Trophy, TrendingUp, Frown, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getScoreName } from "@/lib/scoring/calculator";

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

export default function NineteenthHole({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tournament, setTournament] = useState<LocalTournament | null>(null);
  const [scores, setScores] = useState<LocalScore[]>([]);
  const [playerName, setPlayerName] = useState("Mängija");

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
    } catch {
      // ignore
    }
  }, [id]);

  if (!tournament || scores.length === 0) {
    return (
      <div className="px-4 py-5">
        <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold mb-4">
          19. Auk 🍺
        </h1>
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-4xl mb-2">🍺</div>
          <p>Lõpeta ring kõigepealt!</p>
          <p className="text-sm">
            Auhinnad ja statistika ilmuvad siia pärast viimast auku.
          </p>
        </div>
      </div>
    );
  }

  // Calculate awards
  const birdieCount = scores.filter((s) => {
    const par = tournament.hole_pars[s.hole - 1];
    return s.strokes < par;
  }).length;

  const parCount = scores.filter((s) => {
    const par = tournament.hole_pars[s.hole - 1];
    return s.strokes === par;
  }).length;

  const worstHole = scores.reduce<{ hole: number; diff: number; strokes: number }>(
    (worst, s) => {
      const par = tournament.hole_pars[s.hole - 1];
      const diff = s.strokes - par;
      return diff > worst.diff ? { hole: s.hole, diff, strokes: s.strokes } : worst;
    },
    { hole: 0, diff: -99, strokes: 0 }
  );

  const bestHole = scores.reduce<{ hole: number; diff: number; strokes: number }>(
    (best, s) => {
      const par = tournament.hole_pars[s.hole - 1];
      const diff = s.strokes - par;
      return diff < best.diff ? { hole: s.hole, diff, strokes: s.strokes } : best;
    },
    { hole: 0, diff: 99, strokes: 0 }
  );

  const front9 = scores
    .filter((s) => s.hole <= 9)
    .reduce((sum, s) => sum + (s.strokes - tournament.hole_pars[s.hole - 1]), 0);
  const back9 = scores
    .filter((s) => s.hole > 9)
    .reduce((sum, s) => sum + (s.strokes - tournament.hole_pars[s.hole - 1]), 0);

  const awards = [
    {
      icon: "🐦",
      title: "Birdie Hunter",
      value: `${birdieCount} birdie'd`,
      delay: 0.1,
    },
    {
      icon: "⛳",
      title: "Mr. Consistent",
      value: `${parCount} par'i`,
      delay: 0.2,
    },
    {
      icon: "🏆",
      title: "Parim auk",
      value: `#${bestHole.hole} (${bestHole.diff >= 0 ? "+" : ""}${bestHole.diff})`,
      delay: 0.3,
    },
    {
      icon: "💀",
      title: "Card Wrecker",
      value: `#${worstHole.hole} (${worstHole.strokes} lööki)`,
      delay: 0.4,
    },
    {
      icon: back9 < front9 ? "📈" : "📉",
      title: back9 < front9 ? "Comeback Kid" : "Fast Starter",
      value: `Esi 9: ${front9 >= 0 ? "+" : ""}${front9}, Taga 9: ${back9 >= 0 ? "+" : ""}${back9}`,
      delay: 0.5,
    },
  ];

  return (
    <div className="px-4 py-5">
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="text-6xl mb-3"
        >
          🍺
        </motion.div>
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold">
          19. Auk
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Suur ring on tehtud, {playerName}! Siin on su auhinnad.
        </p>
      </div>

      <div className="space-y-3">
        {awards.map((award) => (
          <motion.div
            key={award.title}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: award.delay }}
          >
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <span className="text-3xl">{award.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold">{award.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {award.value}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center mt-8 p-6 bg-primary/5 rounded-2xl"
      >
        <p className="text-lg font-semibold">
          What a round, legend! ⛳
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          See you on the first tee next time!
        </p>
      </motion.div>
    </div>
  );
}
