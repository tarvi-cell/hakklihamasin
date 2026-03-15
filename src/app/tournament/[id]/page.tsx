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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePlayer } from "@/hooks/usePlayer";

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
  settings: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

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

  useEffect(() => {
    const stored = localStorage.getItem(`hakklihamasin-tournament-${id}`);
    if (stored) {
      setTournament(JSON.parse(stored));
    }
  }, [id]);

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

  const startRound = () => {
    const updated = { ...tournament, status: "active" as const };
    localStorage.setItem(
      `hakklihamasin-tournament-${id}`,
      JSON.stringify(updated)
    );
    setTournament(updated);
    router.push(`/tournament/${id}/scorecard`);
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-4 pb-6">
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
          {tournament.course_name} — {tournament.holes_count} auku, par{" "}
          {totalPar}
        </p>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Share code */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-2">
                Jagamiskood — teised saavad sellega liituda
              </p>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5 flex-1">
                  {tournament.share_code.split("").map((c, i) => (
                    <div
                      key={i}
                      className="w-12 h-14 flex items-center justify-center bg-card rounded-lg border-2 border-primary/30 text-2xl font-bold font-mono"
                    >
                      {c}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyCode}
                    className="h-8"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareCode}
                    className="h-8"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Players */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Mängijad
                </h3>
                <span className="text-sm text-muted-foreground">
                  1 mängija
                </span>
              </div>
              <div className="flex items-center gap-3 py-2">
                <span className="text-2xl">{player.emoji}</span>
                <div>
                  <span className="font-medium">{player.name}</span>
                  {isTD && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      TD
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Jaga koodi, et teised saaksid liituda
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Formats */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Formaadid</h3>
              <div className="flex flex-wrap gap-2">
                {tournament.formats.map((f) => (
                  <Badge key={f} variant="outline">
                    {formatName(f)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Start button */}
        {tournament.status === "setup" && isTD && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={startRound}
              className="w-full h-14 text-lg font-semibold"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Alusta ringi
            </Button>
          </motion.div>
        )}

        {tournament.status === "active" && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
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

function formatName(type: string): string {
  const names: Record<string, string> = {
    stroke_play: "Stroke Play",
    stableford: "Stableford",
    skins: "Skins",
    best_ball: "Best Ball",
    match_play: "Match Play",
    scramble: "Scramble",
    meat_grinder: "Hakklihamasin",
    nassau: "Nassau",
  };
  return names[type] || type;
}

// Import for the button icon
import { ClipboardList } from "lucide-react";
