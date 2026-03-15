"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, LogIn, Trophy, Settings, Play, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerSetup } from "@/components/player/PlayerSetup";
import { usePlayer } from "@/hooks/usePlayer";
import type { LocalPlayer } from "@/hooks/usePlayer";

interface RecentTournament {
  id: string;
  name: string;
  course_name: string;
  holes_count: number;
  status: string;
  created_at: string;
}

export default function Home() {
  const router = useRouter();
  const { player, isLoaded, isSetUp, savePlayer } = usePlayer();
  const [showSetup, setShowSetup] = useState(false);
  const [recentTournaments, setRecentTournaments] = useState<RecentTournament[]>([]);

  // Load recent tournaments from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tournaments: RecentTournament[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("hakklihamasin-tournament-")) {
        try {
          const t = JSON.parse(localStorage.getItem(key)!);
          tournaments.push({
            id: t.id,
            name: t.name,
            course_name: t.course_name,
            holes_count: t.holes_count,
            status: t.status,
            created_at: t.created_at,
          });
        } catch {
          // ignore
        }
      }
    }
    tournaments.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setRecentTournaments(tournaments);
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-primary">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="text-center"
        >
          <div className="text-7xl mb-3">⛳</div>
          <div className="text-primary-foreground/60 text-sm font-medium">
            Hakklihamasin
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isSetUp || showSetup) {
    return (
      <div className="min-h-dvh flex flex-col bg-background">
        {/* Green header bar */}
        <div
          className="bg-primary text-primary-foreground px-5 pt-3 pb-4 safe-area-top"
          style={{
            backgroundImage: `radial-gradient(ellipse at 30% 0%, rgba(218,165,32,0.15) 0%, transparent 60%)`,
          }}
        >
          <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold tracking-tight text-center">
            Hakklihamasin
          </h1>
        </div>

        {/* Setup form — fills the screen */}
        <div className="flex-1 px-5 py-6 overflow-y-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <PlayerSetup
              initialPlayer={player}
              onComplete={(p: LocalPlayer) => {
                savePlayer(p);
                setShowSetup(false);
              }}
            />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Header */}
      <header className="relative overflow-hidden bg-primary text-primary-foreground safe-area-top">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(ellipse at 30% 0%, rgba(218,165,32,0.15) 0%, transparent 60%),
                              radial-gradient(ellipse at 90% 80%, rgba(255,255,255,0.06) 0%, transparent 50%)`,
          }}
        />
        <div className="relative px-5 pt-10 pb-7">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight">
                Hakklihamasin
              </h1>
              <p className="text-primary-foreground/60 text-sm mt-0.5">
                Golfiturniiri äpp
              </p>
            </div>
            <button
              onClick={() => setShowSetup(true)}
              className="flex items-center gap-2 pl-3 pr-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 active:bg-white/20 transition-colors"
            >
              <span className="text-2xl">{player.emoji}</span>
              <span className="text-sm font-medium max-w-[80px] truncate">
                {player.name}
              </span>
            </button>
          </div>

          {/* Quick stats */}
          <div className="flex gap-2.5">
            {[
              { value: recentTournaments.length, label: "Turniire" },
              { value: "-", label: "Parim ring" },
              { value: "0", label: "Birdie'd" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex-1 rounded-2xl bg-white/8 backdrop-blur-sm px-3 py-2.5 text-center"
              >
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-[10px] text-primary-foreground/60 font-medium uppercase tracking-wide">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-5 py-5 space-y-3">
        {/* Action cards */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          <Card
            className="cursor-pointer border-2 border-dashed border-primary/30 hover:border-primary/50 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            onClick={() => router.push("/create")}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex items-center justify-center w-13 h-13 rounded-2xl bg-primary text-primary-foreground">
                <Plus className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-[15px]">Loo turniir</h2>
                <p className="text-muted-foreground text-[13px]">
                  Seadista uus ring seltskonnale
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card
            className="cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            onClick={() => router.push("/join")}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex items-center justify-center w-13 h-13 rounded-2xl bg-accent text-accent-foreground">
                <LogIn className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-[15px]">Liitu turniiriga</h2>
                <p className="text-muted-foreground text-[13px]">
                  Sisesta 4-täheline kood
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Card
            className="cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            onClick={() => router.push("/formats")}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex items-center justify-center w-13 h-13 rounded-2xl bg-secondary text-secondary-foreground">
                <Trophy className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-[15px]">Mänguformaadid</h2>
                <p className="text-muted-foreground text-[13px]">
                  50+ formaati — leia oma lemmik
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent tournaments */}
        {recentTournaments.length > 0 && (
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="pt-3"
          >
            <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold mb-3">
              Viimased turniirid
            </h3>
            <div className="space-y-2.5">
              {recentTournaments.slice(0, 5).map((t) => (
                <Card
                  key={t.id}
                  className="cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                  onClick={() => router.push(`/tournament/${t.id}`)}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 text-primary">
                      <Play className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm truncate">
                          {t.name}
                        </h4>
                        <Badge
                          variant={
                            t.status === "active"
                              ? "default"
                              : t.status === "completed"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-[10px] shrink-0"
                        >
                          {t.status === "setup"
                            ? "Seadistamine"
                            : t.status === "active"
                            ? "Käimas"
                            : "Lõppenud"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {t.course_name} — {t.holes_count} auku
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {recentTournaments.length === 0 && (
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-10 text-muted-foreground"
          >
            <div className="text-5xl mb-2">🏌️</div>
            <p className="font-medium">Pole veel turniire</p>
            <p className="text-sm">Loo esimene!</p>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="px-4 py-3 text-center text-xs text-muted-foreground border-t"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)" }}
      >
        <button
          onClick={() => router.push("/settings")}
          className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors py-1"
        >
          <Settings className="w-3.5 h-3.5" />
          Seaded
        </button>
      </footer>
    </div>
  );
}
