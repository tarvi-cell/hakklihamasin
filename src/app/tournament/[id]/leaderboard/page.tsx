"use client";

import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatRelativeScore,
  formatTotalRelativeScore,
  getScoreName,
  getScoreColorClass,
  calculateStablefordPoints,
} from "@/lib/scoring/calculator";
import { cn } from "@/lib/utils";

interface TournamentPlayer {
  id: string;
  name: string;
  emoji: string;
  handicap: number | null;
}

interface LocalTournament {
  id: string;
  name: string;
  holes_count: number;
  hole_pars: number[];
  players: TournamentPlayer[];
  formats: string[];
  [key: string]: unknown;
}

interface ScoreEntry {
  playerId: string;
  hole: number;
  strokes: number;
}

const FORMAT_NAMES: Record<string, string> = {
  stroke_play: "Stroke Play", stableford: "Stableford", skins: "Skins",
  best_ball: "Best Ball", match_play: "Match Play", scramble: "Scramble",
  meat_grinder: "Hakklihamasin", nassau: "Nassau", quota: "Quota",
  shamble: "Shamble", wolf: "Wolf", hammer: "Hammer",
  bloodsomes: "Bloodsomes", cha_cha_cha: "Cha Cha Cha",
  six_six_six: "6-6-6", dots: "Dots", snake: "Snake", rabbit: "Rabbit",
  string_game: "String", three_club: "3-Club", foot_wedge: "Foot Wedge",
  bingo_bango_bongo: "BBB",
};

export default function LeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tournament, setTournament] = useState<LocalTournament | null>(null);
  const [scores, setScores] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(`hakklihamasin-tournament-${id}`);
    if (stored) setTournament(JSON.parse(stored));
    const storedScores = localStorage.getItem(`hakklihamasin-scores-${id}`);
    if (storedScores) setScores(JSON.parse(storedScores));
  }, [id]);

  if (!tournament) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Laen...</div>
      </div>
    );
  }

  const activeFormats = tournament.formats || ["stroke_play"];

  // Calculate stroke play leaderboard
  const strokePlayBoard = tournament.players
    .map((p) => {
      const playerScores = scores.filter(
        (s) => s.playerId === p.id && s.hole <= tournament.holes_count
      );
      const total = playerScores.reduce((sum, s) => sum + s.strokes, 0);
      const totalPar = playerScores.reduce(
        (sum, s) => sum + tournament.hole_pars[s.hole - 1],
        0
      );
      const relative = total - totalPar;
      return {
        ...p,
        total,
        relative,
        thru: playerScores.length,
        display:
          playerScores.length === 0
            ? "—"
            : `${total} (${relative === 0 ? "E" : relative > 0 ? `+${relative}` : relative})`,
      };
    })
    .sort((a, b) => {
      if (a.thru === 0) return 1;
      if (b.thru === 0) return -1;
      return a.relative - b.relative;
    });

  // Calculate stableford leaderboard
  const stablefordBoard = tournament.players
    .map((p) => {
      const playerScores = scores.filter(
        (s) => s.playerId === p.id && s.hole <= tournament.holes_count
      );
      const points = playerScores.reduce(
        (sum, s) => sum + calculateStablefordPoints(s.strokes, tournament.hole_pars[s.hole - 1]),
        0
      );
      return {
        ...p,
        points,
        thru: playerScores.length,
        display: playerScores.length === 0 ? "—" : `${points} pts`,
      };
    })
    .sort((a, b) => b.points - a.points);

  // Calculate skins
  const skinsBoard = (() => {
    const skinCounts: Record<string, number> = {};
    tournament.players.forEach((p) => (skinCounts[p.id] = 0));
    let carryOver = 0;

    for (let hole = 1; hole <= tournament.holes_count; hole++) {
      const holeScores = tournament.players
        .map((p) => ({
          playerId: p.id,
          strokes: scores.find((s) => s.playerId === p.id && s.hole === hole)?.strokes ?? null,
        }))
        .filter((s) => s.strokes !== null) as { playerId: string; strokes: number }[];

      if (holeScores.length === 0) continue;

      const minScore = Math.min(...holeScores.map((s) => s.strokes));
      const winners = holeScores.filter((s) => s.strokes === minScore);

      if (winners.length === 1) {
        skinCounts[winners[0].playerId] += 1 + carryOver;
        carryOver = 0;
      } else {
        carryOver++;
      }
    }

    return tournament.players
      .map((p) => ({
        ...p,
        skins: skinCounts[p.id],
        thru: scores.filter((s) => s.playerId === p.id).length,
        display: `${skinCounts[p.id]} skin${skinCounts[p.id] !== 1 ? "s" : ""}`,
      }))
      .sort((a, b) => b.skins - a.skins);
  })();

  const renderBoard = (
    board: { id: string; name: string; emoji: string; display: string; thru: number }[],
    format: string
  ) => (
    <div className="space-y-2">
      {board.map((entry, i) => (
        <motion.div
          key={entry.id}
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className={i === 0 && entry.display !== "—" ? "border-gold/50 bg-gold/5" : ""}>
            <CardContent className="flex items-center gap-3 p-3.5">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm",
                  i === 0 && entry.display !== "—"
                    ? "bg-gold/20 text-gold"
                    : i === 1
                    ? "bg-muted text-foreground"
                    : i === 2
                    ? "bg-orange-100 text-orange-700"
                    : "bg-muted/50 text-muted-foreground"
                )}
              >
                {entry.display === "—" ? "—" : i + 1}
              </div>
              <span className="text-xl">{entry.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{entry.name}</div>
                <div className="text-xs text-muted-foreground">
                  {entry.thru} auku läbitud
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">{entry.display}</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {board.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Pole veel tulemusi</p>
        </div>
      )}
    </div>
  );

  // Scorecard grid for a player
  const renderScorecard = (playerId: string) => {
    const playerScores = scores.filter((s) => s.playerId === playerId);
    return (
      <div className="overflow-x-auto -mx-1">
        <div className="grid grid-cols-9 gap-1 min-w-[280px]">
          {Array.from({ length: Math.min(9, tournament.holes_count) }, (_, i) => (
            <div key={`h-${i}`} className="text-center text-[10px] text-muted-foreground font-mono">
              {i + 1}
            </div>
          ))}
          {Array.from({ length: Math.min(9, tournament.holes_count) }, (_, i) => (
            <div key={`p-${i}`} className="text-center text-[10px] text-muted-foreground bg-muted/50 rounded py-0.5">
              {tournament.hole_pars[i]}
            </div>
          ))}
          {Array.from({ length: Math.min(9, tournament.holes_count) }, (_, i) => {
            const score = playerScores.find((s) => s.hole === i + 1);
            if (!score) return <div key={`s-${i}`} className="text-center text-[10px] text-muted-foreground/40 py-0.5">-</div>;
            const name = getScoreName(score.strokes, tournament.hole_pars[i]);
            return (
              <div key={`s-${i}`} className={`text-center text-[10px] font-bold rounded py-0.5 ${getScoreColorClass(name)}`}>
                {score.strokes}
              </div>
            );
          })}
        </div>
        {tournament.holes_count === 18 && (
          <div className="grid grid-cols-9 gap-1 min-w-[280px] mt-1.5">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={`h2-${i}`} className="text-center text-[10px] text-muted-foreground font-mono">{i + 10}</div>
            ))}
            {Array.from({ length: 9 }, (_, i) => (
              <div key={`p2-${i}`} className="text-center text-[10px] text-muted-foreground bg-muted/50 rounded py-0.5">{tournament.hole_pars[i + 9]}</div>
            ))}
            {Array.from({ length: 9 }, (_, i) => {
              const score = playerScores.find((s) => s.hole === i + 10);
              if (!score) return <div key={`s2-${i}`} className="text-center text-[10px] text-muted-foreground/40 py-0.5">-</div>;
              const name = getScoreName(score.strokes, tournament.hole_pars[i + 9]);
              return (
                <div key={`s2-${i}`} className={`text-center text-[10px] font-bold rounded py-0.5 ${getScoreColorClass(name)}`}>{score.strokes}</div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-gold" />
        <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold">
          Edetabel
        </h1>
      </div>

      {activeFormats.length > 1 ? (
        <Tabs defaultValue={activeFormats[0]} className="w-full">
          <TabsList className="w-full mb-4 flex overflow-x-auto">
            {activeFormats.map((f) => (
              <TabsTrigger key={f} value={f} className="flex-1 text-xs">
                {FORMAT_NAMES[f] || f}
              </TabsTrigger>
            ))}
          </TabsList>
          {activeFormats.map((f) => (
            <TabsContent key={f} value={f}>
              {f === "stroke_play" && renderBoard(strokePlayBoard, f)}
              {f === "stableford" && renderBoard(stablefordBoard, f)}
              {f === "skins" && renderBoard(skinsBoard, f)}
              {!["stroke_play", "stableford", "skins"].includes(f) &&
                renderBoard(strokePlayBoard, f)}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        renderBoard(strokePlayBoard, activeFormats[0])
      )}

      {/* Scorecards per player */}
      {tournament.players.length > 0 && scores.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="font-semibold text-sm">Skoorikaardid</h3>
          {tournament.players.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{p.emoji}</span>
                  <span className="font-semibold text-sm">{p.name}</span>
                </div>
                {renderScorecard(p.id)}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
