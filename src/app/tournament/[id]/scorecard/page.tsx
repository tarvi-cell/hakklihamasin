"use client";

import { useState, useCallback, use } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, WifiOff, Loader2 } from "lucide-react";
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
import { Suspense } from "react";
import { usePlayer } from "@/hooks/usePlayer";
import { useTournament } from "@/hooks/useTournament";
import { useScores } from "@/hooks/useScores";

function ScorecardInner({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const roundId = searchParams.get("round") || undefined;
  const { player } = usePlayer();
  const { tournament, players, rounds, isLoading: tLoading } = useTournament(id);
  const { scores, setScore, getScore, isOnline, pendingCount, isLoading: sLoading } = useScores(id, roundId);

  // Find the active round's data (course, pars, formats)
  const activeRound = roundId ? rounds.find((r) => r.id === roundId) : null;
  const holePars = activeRound?.hole_pars || tournament?.hole_pars || [];
  const holesCount = activeRound?.holes_count || tournament?.holes_count || 18;
  const roundName = activeRound?.name || tournament?.name || "";
  const [currentHole, setCurrentHole] = useState(1);
  const [activePlayerId, setActivePlayerId] = useState<string>("");
  const [direction, setDirection] = useState(0);

  // Set active player to self on first load
  if (!activePlayerId && players.length > 0) {
    const self = players.find((p) => p.id === player.id);
    setActivePlayerId(self?.id || players[0].id);
  }

  if (tLoading || sLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Laen...</span>
      </div>
    );
  }

  if (!tournament) return null;

  const isCompleted = tournament.status === "completed" || activeRound?.status === "completed";
  const currentPar = holePars[currentHole - 1];
  const activePlayerScore = getScore(activePlayerId, currentHole);

  // Max strokes
  const getMaxStrokes = (par: number): number => {
    const settings = tournament.settings as Record<string, unknown> | undefined;
    if (!settings?.max_strokes_mode || settings.max_strokes_mode === "unlimited") return 20;
    if (settings.max_strokes_mode === "fixed") return Number(settings.max_strokes_value) || 12;
    return par + (Number(settings.max_strokes_value) || 3);
  };

  // Player stats
  const getPlayerStats = (playerId: string) => {
    const playerScores = scores
      .filter((s) => s.player_id === playerId)
      .map((s) => ({
        strokes: s.strokes,
        par: holePars[s.hole_number - 1],
      }));
    return {
      totalRelative: formatTotalRelativeScore(playerScores),
      thru: playerScores.length,
      totalStrokes: playerScores.reduce((sum, s) => sum + s.strokes, 0),
    };
  };

  const activeStats = getPlayerStats(activePlayerId);
  const activePlayer = players.find((p) => p.id === activePlayerId);

  const handleScore = useCallback(
    (holeNumber: number, strokes: number) => {
      if (isCompleted) return;

      setScore(activePlayerId, holeNumber, strokes, player.id);

      // Fun messages
      const par = holePars[holeNumber - 1];
      const scoreName = getScoreName(strokes, par);
      const playerName = activePlayer?.name || "Mängija";

      if (["ace", "albatross", "eagle", "birdie", "triple_plus"].includes(scoreName)) {
        const msg = getRandomMessage(scoreName, { player: playerName, hole: holeNumber, score: strokes });
        if (msg) toast(msg, { duration: 4000 });
      }

      // Undo toast
      const label = getScoreLabel(scoreName);
      const emoji = getScoreEmoji(scoreName);
      toast(`${emoji} ${playerName} auk ${holeNumber}: ${strokes} (${label})`, { duration: 3000 });

      // Auto-advance
      const playerIndex = players.findIndex((p) => p.id === activePlayerId);
      if (playerIndex < players.length - 1) {
        setTimeout(() => setActivePlayerId(players[playerIndex + 1].id), 400);
      } else if (holeNumber < holesCount) {
        setTimeout(() => {
          setDirection(1);
          setCurrentHole(holeNumber + 1);
          setActivePlayerId(players[0].id);
        }, 600);
      }
    },
    [tournament, players, activePlayerId, player.id, setScore, isCompleted, activePlayer]
  );

  const goToHole = (hole: number) => {
    if (hole < 1 || hole > holesCount) return;
    setDirection(hole > currentHole ? 1 : -1);
    setCurrentHole(hole);
  };

  // Other players on current hole
  const otherPlayers = players
    .filter((p) => p.id !== activePlayerId)
    .map((p) => ({ ...p, score: getScore(p.id, currentHole) }));

  return (
    <div className="flex flex-col h-full">
      {/* Offline indicator */}
      {(!isOnline || pendingCount > 0) && (
        <div className="bg-amber-500 text-white text-xs text-center py-1.5 px-3 flex items-center justify-center gap-1.5">
          <WifiOff className="w-3 h-3" />
          {!isOnline ? "Offline" : ""} {pendingCount > 0 ? `(${pendingCount} ootel)` : ""}
        </div>
      )}

      {/* Completed banner */}
      {isCompleted && (
        <div className="bg-primary text-primary-foreground text-xs text-center py-1.5 font-medium">
          Ring lõppenud — skoorid lukustatud 🏆
        </div>
      )}

      {/* Top status bar */}
      <div className="bg-primary text-primary-foreground px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-xs opacity-70">{roundName || tournament.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold">{activeStats.totalRelative}</span>
              <span className="text-xs opacity-60">
                {activeStats.totalStrokes} lööki / {activeStats.thru} auku
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 max-w-[120px] justify-end">
            {Array.from({ length: holesCount }, (_, i) => {
              const s = getScore(activePlayerId, i + 1);
              const par = holePars[i];
              let dotColor = "bg-white/20";
              if (s !== null) {
                const diff = s - par;
                if (diff < 0) dotColor = "bg-emerald-400";
                else if (diff === 0) dotColor = "bg-white/60";
                else if (diff === 1) dotColor = "bg-amber-400";
                else dotColor = "bg-red-400";
              }
              return (
                <button key={i} onClick={() => goToHole(i + 1)}
                  className={`w-3 h-3 rounded-full ${dotColor} ${i + 1 === currentHole ? "ring-2 ring-white ring-offset-1 ring-offset-primary" : ""} transition-all`} />
              );
            })}
          </div>
        </div>
      </div>

      {/* Player selector */}
      {players.length > 1 && (
        <div className="flex gap-1.5 px-3 py-2 bg-card border-b overflow-x-auto">
          {players.map((p) => {
            const isActive = p.id === activePlayerId;
            const hasScore = getScore(p.id, currentHole) !== null;
            return (
              <button key={p.id} onClick={() => setActivePlayerId(p.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all shrink-0",
                  isActive ? "bg-primary text-primary-foreground shadow-sm"
                    : hasScore ? "bg-birdie/15 text-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
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
        <button onClick={() => goToHole(currentHole - 1)} disabled={currentHole === 1}
          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
          <ChevronLeft className="w-7 h-7" />
        </button>
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={`${currentHole}-${activePlayerId}`}
              initial={{ x: direction * 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -80, opacity: 0 }} transition={{ duration: 0.15, ease: "easeOut" }}>
              <HoleCard holeNumber={currentHole} par={currentPar}
                maxStrokes={getMaxStrokes(currentPar)} currentStrokes={activePlayerScore}
                onScore={isCompleted ? () => {} : (strokes) => handleScore(currentHole, strokes)} />
            </motion.div>
          </AnimatePresence>
        </div>
        <button onClick={() => goToHole(currentHole + 1)} disabled={currentHole === holesCount}
          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
          <ChevronRight className="w-7 h-7" />
        </button>
      </div>

      {/* Other players on this hole */}
      {otherPlayers.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto">
            {otherPlayers.map((p) => (
              <div key={p.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-xl text-xs shrink-0">
                <span>{p.emoji}</span>
                <span className="font-medium">{p.name}</span>
                {p.score !== null ? (
                  <span className={cn("font-bold",
                    p.score < currentPar ? "text-green-600" : p.score === currentPar ? "text-foreground" : "text-orange-600")}>
                    {p.score}
                  </span>
                ) : <span className="text-muted-foreground">—</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center pb-2 text-xs text-muted-foreground">
        Auk {currentHole} / {holesCount}
        {players.length > 1 && <span className="ml-2">— {activePlayer?.name}</span>}
      </div>
    </div>
  );
}

export default function ScorecardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>}>
      <ScorecardInner id={id} />
    </Suspense>
  );
}
