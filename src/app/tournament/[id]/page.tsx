"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  Check,
  Play,
  Users,
  Share2,
  Plus,
  X,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmojiPicker } from "@/components/player/EmojiPicker";
import { usePlayer } from "@/hooks/usePlayer";

interface TournamentPlayer {
  id: string;
  name: string;
  emoji: string;
  handicap: number | null;
}

interface LocalTournament {
  id: string;
  name: string;
  course_name: string;
  holes_count: number;
  hole_pars: number[];
  use_flights: boolean;
  share_code: string;
  status: "setup" | "active" | "completed";
  formats: string[];
  players: TournamentPlayer[];
  settings: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

const FORMAT_NAMES: Record<string, string> = {
  stroke_play: "Stroke Play", stableford: "Stableford", skins: "Skins",
  best_ball: "Best Ball", match_play: "Match Play", scramble: "Scramble",
  meat_grinder: "Hakklihamasin", nassau: "Nassau", quota: "Quota",
  shamble: "Shamble", wolf: "Wolf", hammer: "Hammer",
  bloodsomes: "Bloodsomes", cha_cha_cha: "Cha Cha Cha",
  six_six_six: "6-6-6", bingo_bango_bongo: "Bingo Bango Bongo",
  dots: "Dots/Garbage", snake: "Snake", rabbit: "Rabbit",
  string_game: "String Game", three_club: "3-Club Challenge",
  foot_wedge: "Portuguese Caddie",
};

export default function TournamentHub({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { player } = usePlayer();
  const [tournament, setTournament] = useState<LocalTournament | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerEmoji, setNewPlayerEmoji] = useState("🏌️");

  useEffect(() => {
    const stored = localStorage.getItem(`hakklihamasin-tournament-${id}`);
    if (stored) {
      const t = JSON.parse(stored);
      // Migrate old tournaments without players array
      if (!t.players) {
        t.players = [{
          id: t.created_by || crypto.randomUUID(),
          name: player.name || "Mängija 1",
          emoji: player.emoji || "🏌️",
          handicap: player.handicap ?? null,
        }];
        localStorage.setItem(`hakklihamasin-tournament-${id}`, JSON.stringify(t));
      }
      setTournament(t);
    }
  }, [id, player]);

  const saveTournament = (t: LocalTournament) => {
    setTournament(t);
    localStorage.setItem(`hakklihamasin-tournament-${id}`, JSON.stringify(t));
  };

  if (!tournament) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Laen...</div>
      </div>
    );
  }

  const totalPar = tournament.hole_pars.reduce((a, b) => a + b, 0);
  const isTD = tournament.created_by === player.id;

  const copyCode = async () => {
    await navigator.clipboard.writeText(tournament.share_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareCode = async () => {
    if (navigator.share) {
      await navigator.share({
        title: tournament.name,
        text: `Liitu golfiturniiri "${tournament.name}" — kood: ${tournament.share_code}`,
      });
    } else {
      copyCode();
    }
  };

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    const newPlayer: TournamentPlayer = {
      id: crypto.randomUUID(),
      name: newPlayerName.trim(),
      emoji: newPlayerEmoji,
      handicap: null,
    };
    const updated = {
      ...tournament,
      players: [...tournament.players, newPlayer],
    };
    saveTournament(updated);
    setNewPlayerName("");
    setNewPlayerEmoji("🏌️");
    setShowAddPlayer(false);
  };

  const removePlayer = (playerId: string) => {
    if (playerId === tournament.created_by) return; // Can't remove TD
    const updated = {
      ...tournament,
      players: tournament.players.filter((p) => p.id !== playerId),
    };
    saveTournament(updated);
  };

  const startRound = () => {
    const updated = { ...tournament, status: "active" as const };
    saveTournament(updated);
    router.push(`/tournament/${id}/scorecard`);
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-5 pt-4 pb-6 safe-area-top">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push("/")}
            className="p-2 -ml-2 hover:bg-white/10 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Badge
            variant={
              tournament.status === "active"
                ? "default"
                : tournament.status === "completed"
                ? "secondary"
                : "outline"
            }
            className="text-xs"
          >
            {tournament.status === "setup"
              ? "Seadistamine"
              : tournament.status === "active"
              ? "Käimas"
              : "Lõppenud"}
          </Badge>
        </div>

        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold mb-1">
          {tournament.name}
        </h1>
        <p className="text-primary-foreground/70 text-sm">
          {tournament.course_name} — {tournament.holes_count} auku, par {totalPar}
        </p>
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* Share code */}
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-2">
                Jagamiskood
              </p>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5 flex-1">
                  {tournament.share_code.split("").map((c, i) => (
                    <div
                      key={i}
                      className="flex-1 h-14 flex items-center justify-center bg-card rounded-xl border-2 border-primary/30 text-2xl font-bold font-mono"
                    >
                      {c}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={copyCode} className="h-8">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={shareCode} className="h-8">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Players */}
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Mängijad
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {tournament.players.length}
                </Badge>
              </div>

              <div className="space-y-2">
                {tournament.players.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 py-1.5">
                    <span className="text-2xl">{p.emoji}</span>
                    <span className="font-medium flex-1">{p.name}</span>
                    {p.id === tournament.created_by && (
                      <Badge variant="secondary" className="text-[10px]">TD</Badge>
                    )}
                    {p.id !== tournament.created_by && tournament.status === "setup" && (
                      <button
                        onClick={() => removePlayer(p.id)}
                        className="p-1 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add player */}
              {!showAddPlayer ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddPlayer(true)}
                  className="w-full mt-3 h-10 border-dashed"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Lisa mängija
                </Button>
              ) : (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-3 pt-3 border-t space-y-3"
                >
                  <div className="flex gap-2">
                    <div className="text-3xl flex items-center justify-center w-12 h-12 rounded-xl bg-muted">
                      {newPlayerEmoji}
                    </div>
                    <Input
                      placeholder="Mängija nimi"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      className="h-12"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                    />
                  </div>
                  <EmojiPicker
                    selected={newPlayerEmoji}
                    onSelect={setNewPlayerEmoji}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddPlayer(false)}
                      className="flex-1"
                    >
                      Tühista
                    </Button>
                    <Button
                      onClick={addPlayer}
                      disabled={!newPlayerName.trim()}
                      className="flex-1"
                    >
                      Lisa
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Formats */}
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Formaadid</h3>
              <div className="flex flex-wrap gap-2">
                {tournament.formats.map((f) => (
                  <Badge key={f} variant="outline">
                    {FORMAT_NAMES[f] || f}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Start / Continue */}
        {tournament.status === "setup" && (
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <Button onClick={startRound} className="w-full h-14 text-lg font-semibold" size="lg">
              <Play className="w-5 h-5 mr-2" />
              Alusta ringi ({tournament.players.length} mängijat)
            </Button>
          </motion.div>
        )}

        {tournament.status === "active" && (
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <Button
              onClick={() => router.push(`/tournament/${id}/scorecard`)}
              className="w-full h-14 text-lg font-semibold"
              size="lg"
            >
              <ClipboardList className="w-5 h-5 mr-2" />
              Jätka mängimist
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
