"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Copy, Check, Play, Users, Share2, Plus, X,
  ClipboardList, Flag, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { EmojiPicker } from "@/components/player/EmojiPicker";
import { usePlayer } from "@/hooks/usePlayer";
import { useTournament } from "@/hooks/useTournament";

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

export default function TournamentHub({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { player } = usePlayer();
  const { tournament, players, isLoading, addPlayer, removePlayer, updateStatus } = useTournament(id);
  const [copied, setCopied] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerEmoji, setNewPlayerEmoji] = useState("🏌️");
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Laen turniiri...</span>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">Turniiri ei leitud</p>
        <Button variant="outline" onClick={() => router.push("/")}>Avalehele</Button>
      </div>
    );
  }

  const totalPar = tournament.hole_pars.reduce((a: number, b: number) => a + b, 0);
  const isTD = players.some((p) => p.id === player.id && p.is_td);

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

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return;
    await addPlayer(newPlayerName.trim(), newPlayerEmoji);
    setNewPlayerName("");
    setNewPlayerEmoji("🏌️");
    setShowAddPlayer(false);
  };

  const handleStart = async () => {
    await updateStatus("active");
    router.push(`/tournament/${id}/scorecard`);
  };

  const handleComplete = async () => {
    await updateStatus("completed");
    setShowCompleteDialog(false);
    router.push(`/tournament/${id}/leaderboard`);
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-5 pt-4 pb-6 safe-area-top">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push("/")} className="p-2 -ml-2 hover:bg-white/10 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Badge variant={tournament.status === "active" ? "default" : tournament.status === "completed" ? "secondary" : "outline"} className="text-xs">
            {tournament.status === "setup" ? "Seadistamine" : tournament.status === "active" ? "Käimas" : "Lõppenud"}
          </Badge>
        </div>
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold mb-1">{tournament.name}</h1>
        <p className="text-primary-foreground/70 text-sm">
          {tournament.course_name} — {tournament.holes_count} auku, par {totalPar}
        </p>
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* Share code */}
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Jagamiskood</p>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5 flex-1">
                  {tournament.share_code.split("").map((c: string, i: number) => (
                    <div key={i} className="flex-1 h-14 flex items-center justify-center bg-card rounded-xl border-2 border-primary/30 text-2xl font-bold font-mono">
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
                  <Users className="w-4 h-4" /> Mängijad
                </h3>
                <Badge variant="secondary" className="text-xs">{players.length}</Badge>
              </div>
              <div className="space-y-2">
                {players.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 py-1.5">
                    <span className="text-2xl">{p.emoji}</span>
                    <span className="font-medium flex-1">{p.name}</span>
                    {p.is_td && <Badge variant="secondary" className="text-[10px]">TD</Badge>}
                    {!p.is_td && tournament.status === "setup" && isTD && (
                      <button onClick={() => removePlayer(p.id)} className="p-1 text-muted-foreground hover:text-destructive">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {!showAddPlayer ? (
                <Button variant="outline" size="sm" onClick={() => setShowAddPlayer(true)} className="w-full mt-3 h-10 border-dashed">
                  <Plus className="w-4 h-4 mr-1" /> Lisa mängija
                </Button>
              ) : (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-3 pt-3 border-t space-y-3">
                  <div className="flex gap-2">
                    <div className="text-3xl flex items-center justify-center w-12 h-12 rounded-xl bg-muted">{newPlayerEmoji}</div>
                    <Input placeholder="Mängija nimi" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)}
                      className="h-12" autoFocus onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()} />
                  </div>
                  <EmojiPicker selected={newPlayerEmoji} onSelect={setNewPlayerEmoji} />
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowAddPlayer(false)} className="flex-1">Tühista</Button>
                    <Button onClick={handleAddPlayer} disabled={!newPlayerName.trim()} className="flex-1">Lisa</Button>
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
                {(tournament.formats || []).map((f: string) => (
                  <Badge key={f} variant="outline">{FORMAT_NAMES[f] || f}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action buttons */}
        {tournament.status === "setup" && isTD && (
          <Button onClick={handleStart} className="w-full h-14 text-lg font-semibold" size="lg">
            <Play className="w-5 h-5 mr-2" /> Alusta ringi ({players.length} mängijat)
          </Button>
        )}

        {tournament.status === "active" && (
          <div className="space-y-3">
            <Button onClick={() => router.push(`/tournament/${id}/scorecard`)} className="w-full h-14 text-lg font-semibold" size="lg">
              <ClipboardList className="w-5 h-5 mr-2" /> Jätka mängimist
            </Button>
            {isTD && (
              <Button variant="outline" onClick={() => setShowCompleteDialog(true)} className="w-full h-11 text-destructive border-destructive/30">
                <Flag className="w-4 h-4 mr-2" /> Lõpeta ring
              </Button>
            )}
          </div>
        )}

        {tournament.status === "completed" && (
          <Button onClick={() => router.push(`/tournament/${id}/leaderboard`)} className="w-full h-14 text-lg font-semibold" size="lg">
            Vaata tulemusi 🏆
          </Button>
        )}
      </div>

      {/* Complete confirmation dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lõpeta ring?</DialogTitle>
            <DialogDescription>Pärast lõpetamist ei saa skoore enam muuta. Lõpptulemused arvutatakse välja.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>Tühista</Button>
            <Button variant="destructive" onClick={handleComplete}>Lõpeta ring</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
