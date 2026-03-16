"use client";

import { use } from "react";
import { motion } from "framer-motion";
import { Trophy, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getScoreName, getScoreColorClass } from "@/lib/scoring/calculator";
import { cn } from "@/lib/utils";
import { useTournament } from "@/hooks/useTournament";
import { useScores } from "@/hooks/useScores";
import { getFormatEngine } from "@/lib/formats/registry";
import type { PlayerScores } from "@/lib/formats/types";

const FORMAT_NAMES: Record<string, string> = {
  stroke_play: "Stroke Play", stableford: "Stableford", skins: "Skins",
  best_ball: "Best Ball", match_play: "Match Play", scramble: "Scramble",
  meat_grinder: "Hakklihamasin", nassau: "Nassau", quota: "Quota",
  shamble: "Shamble", wolf: "Wolf", hammer: "Hammer", dots: "Dots",
  bloodsomes: "Bloodsomes", cha_cha_cha: "Cha Cha Cha", six_six_six: "6-6-6",
  bingo_bango_bongo: "BBB", snake: "Snake", rabbit: "Rabbit",
  string_game: "String", three_club: "3-Club", foot_wedge: "Foot Wedge",
};

export default function LeaderboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { tournament, players, isLoading: tLoading } = useTournament(id);
  const { scores, isLoading: sLoading } = useScores(id);

  if (tLoading || sLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (!tournament) return null;

  const activeFormats = tournament.formats || ["stroke_play"];
  const isCompleted = tournament.status === "completed";

  // Convert scores to format engine input
  const playerScoresData: PlayerScores[] = players.map((p) => ({
    playerId: p.id,
    playerName: p.name,
    playerEmoji: p.emoji,
    scores: scores
      .filter((s) => s.player_id === p.id)
      .map((s) => ({ hole: s.hole_number, strokes: s.strokes })),
  }));

  // Calculate leaderboard for each format
  const formatResults = activeFormats.map((formatType: string) => {
    const engine = getFormatEngine(formatType);
    if (engine) {
      try {
        const entries = engine.calculate(playerScoresData, tournament.hole_pars, {});
        return { formatType, entries, engine };
      } catch {
        // Fallback
      }
    }
    // Fallback to simple stroke play
    const fallbackEngine = getFormatEngine("stroke_play");
    const entries = fallbackEngine
      ? fallbackEngine.calculate(playerScoresData, tournament.hole_pars, {})
      : [];
    return { formatType, entries, engine: fallbackEngine };
  });

  const renderBoard = (entries: { name: string; emoji: string; display: string; thru: number; detail?: string }[]) => (
    <div className="space-y-2">
      {entries.map((entry, i) => (
        <motion.div key={entry.name + i} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}>
          <Card className={i === 0 && entry.display !== "—" ? "border-gold/50 bg-gold/5" : ""}>
            <CardContent className="flex items-center gap-3 p-3.5">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm",
                i === 0 && entry.display !== "—" ? "bg-gold/20 text-gold"
                  : i === 1 ? "bg-muted text-foreground"
                  : i === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30"
                  : "bg-muted/50 text-muted-foreground"
              )}>
                {entry.display === "—" ? "—" : i + 1}
              </div>
              <span className="text-xl">{entry.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{entry.name}</div>
                <div className="text-xs text-muted-foreground">
                  {entry.thru} auku{entry.detail ? ` · ${entry.detail}` : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">{entry.display}</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
      {entries.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Pole veel tulemusi</p>
        </div>
      )}
    </div>
  );

  // Scorecard grid per player
  const renderScorecard = (playerId: string) => {
    const playerScores = scores.filter((s) => s.player_id === playerId);
    const front = Math.min(9, tournament.holes_count);
    return (
      <div className="overflow-x-auto -mx-1">
        <div className="grid gap-1 min-w-[280px]" style={{ gridTemplateColumns: `repeat(${front}, 1fr)` }}>
          {Array.from({ length: front }, (_, i) => (
            <div key={`h-${i}`} className="text-center text-[10px] text-muted-foreground font-mono">{i + 1}</div>
          ))}
          {Array.from({ length: front }, (_, i) => (
            <div key={`p-${i}`} className="text-center text-[10px] text-muted-foreground bg-muted/50 rounded py-0.5">{tournament.hole_pars[i]}</div>
          ))}
          {Array.from({ length: front }, (_, i) => {
            const score = playerScores.find((s) => s.hole_number === i + 1);
            if (!score) return <div key={`s-${i}`} className="text-center text-[10px] text-muted-foreground/40 py-0.5">-</div>;
            const name = getScoreName(score.strokes, tournament.hole_pars[i]);
            return <div key={`s-${i}`} className={`text-center text-[10px] font-bold rounded py-0.5 ${getScoreColorClass(name)}`}>{score.strokes}</div>;
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
              const score = playerScores.find((s) => s.hole_number === i + 10);
              if (!score) return <div key={`s2-${i}`} className="text-center text-[10px] text-muted-foreground/40 py-0.5">-</div>;
              const name = getScoreName(score.strokes, tournament.hole_pars[i + 9]);
              return <div key={`s2-${i}`} className={`text-center text-[10px] font-bold rounded py-0.5 ${getScoreColorClass(name)}`}>{score.strokes}</div>;
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
          {isCompleted ? "Lõpptulemused" : "Edetabel"}
        </h1>
        {isCompleted && <Badge variant="secondary" className="text-xs">🏆 Lõppenud</Badge>}
      </div>

      {activeFormats.length > 1 ? (
        <Tabs defaultValue={activeFormats[0]} className="w-full">
          <TabsList className="w-full mb-4 flex overflow-x-auto">
            {activeFormats.map((f: string) => (
              <TabsTrigger key={f} value={f} className="flex-1 text-xs">
                {FORMAT_NAMES[f] || f}
              </TabsTrigger>
            ))}
          </TabsList>
          {formatResults.map(({ formatType, entries }) => (
            <TabsContent key={formatType} value={formatType}>
              {renderBoard(entries)}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        renderBoard(formatResults[0]?.entries || [])
      )}

      {/* Scorecards */}
      {players.length > 0 && scores.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="font-semibold text-sm">Skoorikaardid</h3>
          {players.map((p) => (
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
