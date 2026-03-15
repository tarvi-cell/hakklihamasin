"use client";

import { useEffect, useState, useCallback, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HoleCard } from "@/components/scorecard/HoleCard";
import {
  formatTotalRelativeScore,
  getScoreName,
  getScoreEmoji,
  getScoreLabel,
} from "@/lib/scoring/calculator";
import { getRandomMessage } from "@/lib/messages/templates";
import { toast } from "sonner";
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
  settings?: {
    max_strokes_mode?: "par_plus" | "fixed" | "unlimited";
    max_strokes_value?: number | null;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface ScoreEntry {
  playerId: string;
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
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [currentHole, setCurrentHole] = useState(1);
  const [activePlayerId, setActivePlayerId] = useState<string>("");
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem(`hakklihamasin-tournament-${id}`);
    if (stored) {
      const t = JSON.parse(stored);
      setTournament(t);
      if (t.players?.length > 0) {
        setActivePlayerId(t.players[0].id);
      }
    }
    const storedScores = localStorage.getItem(`hakklihamasin-scores-${id}`);
    if (storedScores) {
      const parsed = JSON.parse(storedScores);
      // Migrate old format (without playerId)
      if (parsed.length > 0 && !parsed[0].playerId) {
        const playerId =
          JSON.parse(localStorage.getItem(`hakklihamasin-tournament-${id}`) || "{}")
            ?.players?.[0]?.id || "default";
        const migrated = parsed.map((s: { hole: number; strokes: number; timestamp: string }) => ({
          ...s,
          playerId,
        }));
        setScores(migrated);
        localStorage.setItem(`hakklihamasin-scores-${id}`, JSON.stringify(migrated));
      } else {
        setScores(parsed);
      }
    }
  }, [id]);

  const saveScores = useCallback(
    (newScores: ScoreEntry[]) => {
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
      if (!tournament || !activePlayerId) return;

      const existing = scores.find(
        (s) => s.playerId === activePlayerId && s.hole === holeNumber
      );
      const newScore: ScoreEntry = {
        playerId: activePlayerId,
        hole: holeNumber,
        strokes,
        timestamp: new Date().toISOString(),
      };

      let newScores: ScoreEntry[];
      if (existing) {
        newScores = scores.map((s) =>
          s.playerId === activePlayerId && s.hole === holeNumber
            ? newScore
            : s
        );
      } else {
        newScores = [...scores, newScore];
      }
      saveScores(newScores);

      // Get active player info
      const activePlayer = tournament.players.find(
        (p) => p.id === activePlayerId
      );
      const playerName = activePlayer?.name || "Mängija";

      // Trigger fun message
      const par = tournament.hole_pars[holeNumber - 1];
      const scoreName = getScoreName(strokes, par);

      if (["ace", "albatross", "eagle", "birdie", "triple_plus"].includes(scoreName)) {
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

      // Bounce-back check
      const playerScores = newScores.filter((s) => s.playerId === activePlayerId);
      if ((scoreName === "birdie" || scoreName === "eagle") && holeNumber > 1) {
        const prevScore = playerScores.find((s) => s.hole === holeNumber - 1);
        if (prevScore) {
          const prevDiff = prevScore.strokes - tournament.hole_pars[holeNumber - 2];
          if (prevDiff >= 2) {
            const msg = getRandomMessage("bounce_back", { player: playerName });
            if (msg) setTimeout(() => toast(msg, { duration: 3000 }), 1500);
          }
        }
      }

      // Undo toast
      const label = getScoreLabel(scoreName);
      const emoji = getScoreEmoji(scoreName);
      toast(`${emoji} ${playerName} auk ${holeNumber}: ${strokes} (${label})`, {
        duration: 4000,
        action: {
          label: "Tühista",
          onClick: () => {
            if (existing) {
              saveScores(
                newScores.map((s) =>
                  s.playerId === activePlayerId && s.hole === holeNumber
                    ? existing
                    : s
                )
              );
            } else {
              saveScores(
                newScores.filter(
                  (s) => !(s.playerId === activePlayerId && s.hole === holeNumber)
                )
              );
            }
          },
        },
      });

      // Auto-advance: next player or next hole
      const playerIndex = tournament.players.findIndex(
        (p) => p.id === activePlayerId
      );
      if (playerIndex < tournament.players.length - 1) {
        // Move to next player on same hole
        setTimeout(() => {
          setActivePlayerId(tournament.players[playerIndex + 1].id);
        }, 400);
      } else if (holeNumber < tournament.holes_count) {
        // All players scored this hole — move to next hole, first player
        setTimeout(() => {
          setDirection(1);
          setCurrentHole(holeNumber + 1);
          setActivePlayerId(tournament.players[0].id);
        }, 600);
      }
    },
    [tournament, scores, saveScores, activePlayerId]
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
  const activePlayerScore = scores.find(
    (s) => s.playerId === activePlayerId && s.hole === currentHole
  );

  // Max strokes
  const getMaxStrokes = (par: number): number => {
    const settings = tournament.settings;
    if (!settings?.max_strokes_mode || settings.max_strokes_mode === "unlimited")
      return 20;
    if (settings.max_strokes_mode === "fixed")
      return Number(settings.max_strokes_value) || 12;
    return par + (Number(settings.max_strokes_value) || 3);
  };

  // Stats for all players
  const getPlayerStats = (playerId: string) => {
    const playerScores = scores
      .filter((s) => s.playerId === playerId && s.hole <= tournament.holes_count)
      .map((s) => ({
        strokes: s.strokes,
        par: tournament.hole_pars[s.hole - 1],
      }));
    return {
      totalRelative: formatTotalRelativeScore(playerScores),
      thru: playerScores.length,
      totalStrokes: playerScores.reduce((sum, s) => sum + s.strokes, 0),
    };
  };

  // Active player stats
  const activeStats = getPlayerStats(activePlayerId);

  // Other players' scores on current hole
  const otherPlayersOnHole = tournament.players
    .filter((p) => p.id !== activePlayerId)
    .map((p) => {
      const s = scores.find(
        (sc) => sc.playerId === p.id && sc.hole === currentHole
      );
      return { ...p, score: s?.strokes ?? null };
    });

  return (
    <div className="flex flex-col h-full">
      {/* Top status bar */}
      <div className="bg-primary text-primary-foreground px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-xs opacity-70">
              {tournament.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold">{activeStats.totalRelative}</span>
              <span className="text-xs opacity-60">
                {activeStats.totalStrokes} löök{activeStats.totalStrokes !== 1 ? "i" : ""} / {activeStats.thru} auku
              </span>
            </div>
          </div>
          {/* Mini scorecard dots */}
          <div className="flex flex-wrap gap-1 max-w-[120px] justify-end">
            {Array.from({ length: tournament.holes_count }, (_, i) => {
              const score = scores.find(
                (s) => s.playerId === activePlayerId && s.hole === i + 1
              );
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
                  className={`w-3 h-3 rounded-full ${dotColor} ${
                    i + 1 === currentHole ? "ring-2 ring-white ring-offset-1 ring-offset-primary" : ""
                  } transition-all`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Player selector */}
      {tournament.players.length > 1 && (
        <div className="flex gap-1.5 px-3 py-2 bg-card border-b overflow-x-auto">
          {tournament.players.map((p) => {
            const isActive = p.id === activePlayerId;
            const hasScore = scores.some(
              (s) => s.playerId === p.id && s.hole === currentHole
            );
            return (
              <button
                key={p.id}
                onClick={() => setActivePlayerId(p.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all shrink-0",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : hasScore
                    ? "bg-birdie/15 text-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <span className="text-base">{p.emoji}</span>
                <span className="font-medium text-xs">{p.name}</span>
                {hasScore && !isActive && <span className="text-[10px]">✓</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Hole card */}
      <div className="flex-1 flex items-center px-2 py-3">
        <button
          onClick={() => goToHole(currentHole - 1)}
          disabled={currentHole === 1}
          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${currentHole}-${activePlayerId}`}
              initial={{ x: direction * 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -80, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <HoleCard
                holeNumber={currentHole}
                par={currentPar}
                maxStrokes={getMaxStrokes(currentPar)}
                currentStrokes={activePlayerScore?.strokes ?? null}
                onScore={(strokes) => handleScore(currentHole, strokes)}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          onClick={() => goToHole(currentHole + 1)}
          disabled={currentHole === tournament.holes_count}
          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      </div>

      {/* Other players' scores on this hole */}
      {otherPlayersOnHole.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto">
            {otherPlayersOnHole.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-xl text-xs shrink-0"
              >
                <span>{p.emoji}</span>
                <span className="font-medium">{p.name}</span>
                {p.score !== null ? (
                  <span className={cn(
                    "font-bold",
                    p.score < currentPar ? "text-green-600" :
                    p.score === currentPar ? "text-foreground" :
                    "text-orange-600"
                  )}>
                    {p.score}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hole number */}
      <div className="text-center pb-2 text-xs text-muted-foreground">
        Auk {currentHole} / {tournament.holes_count}
        {tournament.players.length > 1 && (
          <span className="ml-2">
            — {tournament.players.find((p) => p.id === activePlayerId)?.name}
          </span>
        )}
      </div>
    </div>
  );
}
