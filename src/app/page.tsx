"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, LogIn, Trophy, Settings, Play, ChevronRight } from "lucide-react";
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

  useEffect(() => {
    if (!player.id) return;
    async function load() {
      try {
        const res = await fetch(`/api/tournaments?player_id=${player.id}`);
        if (res.ok) {
          const data = await res.json();
          setRecentTournaments(
            (data.tournaments || []).map((t: Record<string, unknown>) => ({
              id: t.id as string, name: t.name as string,
              course_name: (t.course_name as string) || "Nimetamata",
              holes_count: (t.holes_count as number) || 18,
              status: (t.status as string) || "setup",
              created_at: (t.created_at as string) || "",
            }))
          );
        }
      } catch {
        const tournaments: RecentTournament[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith("hakklihamasin-tournament-")) {
            try {
              const t = JSON.parse(localStorage.getItem(key)!);
              tournaments.push({ id: t.id, name: t.name, course_name: t.course_name, holes_count: t.holes_count, status: t.status, created_at: t.created_at });
            } catch { /* ignore */ }
          }
        }
        setRecentTournaments(tournaments);
      }
    }
    load();
  }, [player.id]);

  // Splash
  if (!isLoaded) {
    return (
      <div className="min-h-dvh flex items-center justify-center hero-gradient">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="text-center relative z-10"
        >
          <div className="text-8xl mb-4">⛳</div>
          <div className="text-cream/50 text-sm font-medium tracking-[0.3em] uppercase">
            Hakklihamasin
          </div>
        </motion.div>
      </div>
    );
  }

  // Setup
  if (!isSetUp || showSetup) {
    return (
      <div className="min-h-dvh flex flex-col bg-background">
        <div className="hero-gradient text-cream px-5 pt-4 pb-5 safe-area-top">
          <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold tracking-tight text-center relative z-10">
            Hakklihamasin
          </h1>
        </div>
        <div className="flex-1 px-5 py-6 overflow-y-auto">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}>
            <PlayerSetup
              initialPlayer={player}
              onComplete={(p: LocalPlayer) => { savePlayer(p); setShowSetup(false); }}
            />
          </motion.div>
        </div>
      </div>
    );
  }

  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } } as const;
  const fadeUp = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } } as const;

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Immersive Hero Header */}
      <header className="hero-gradient text-cream safe-area-top">
        <div className="relative z-10 px-5 pt-10 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-[family-name:var(--font-heading)] text-[28px] font-bold tracking-tight leading-none">
                Hakklihamasin
              </h1>
              <p className="text-cream/40 text-[13px] mt-1 font-medium tracking-wide">
                Golfiturniiri äpp
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowSetup(true)}
              className="flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-2xl glass-card"
            >
              <span className="text-2xl drop-shadow-sm">{player.emoji}</span>
              <span className="text-sm font-semibold text-cream/90 max-w-[80px] truncate">
                {player.name}
              </span>
            </motion.button>
          </div>

          {/* Stats row */}
          <div className="flex gap-2.5">
            {[
              { value: recentTournaments.length, label: "Turniire" },
              { value: "—", label: "Parim ring" },
              { value: "0", label: "Birdie'd" },
            ].map((stat) => (
              <div key={stat.label} className="flex-1 glass-card px-3 py-3 text-center">
                <div className="stat-value text-cream">{stat.value}</div>
                <div className="text-[9px] text-cream/40 font-semibold uppercase tracking-[0.15em] mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main */}
      <motion.main
        variants={stagger}
        initial="hidden"
        animate="show"
        className="flex-1 px-5 py-5 space-y-3"
      >
        {/* Primary CTA */}
        <motion.div variants={fadeUp}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/create")}
            className="w-full premium-card p-4 flex items-center gap-4 text-left border-2 border-dashed border-primary/25 cursor-pointer"
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <Plus className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-[15px]">Loo turniir</h2>
              <p className="text-muted-foreground text-[13px]">Seadista uus ring seltskonnale</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
          </motion.button>
        </motion.div>

        <motion.div variants={fadeUp}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/join")}
            className="w-full premium-card p-4 flex items-center gap-4 text-left cursor-pointer"
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gold/15 text-gold shadow-sm">
              <LogIn className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-[15px]">Liitu turniiriga</h2>
              <p className="text-muted-foreground text-[13px]">Sisesta 4-täheline kood</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
          </motion.button>
        </motion.div>

        <motion.div variants={fadeUp}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/formats")}
            className="w-full premium-card p-4 flex items-center gap-4 text-left cursor-pointer"
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-birdie/12 text-birdie shadow-sm">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-[15px]">Mänguformaadid</h2>
              <p className="text-muted-foreground text-[13px]">50+ formaati — leia oma lemmik</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
          </motion.button>
        </motion.div>

        {/* Recent tournaments */}
        {recentTournaments.length > 0 && (
          <motion.div variants={fadeUp} className="pt-2">
            <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold mb-3">
              Viimased turniirid
            </h3>
            <div className="space-y-2.5">
              {recentTournaments.slice(0, 5).map((t) => (
                <motion.button
                  key={t.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push(`/tournament/${t.id}`)}
                  className="w-full premium-card p-4 flex items-center gap-3 text-left cursor-pointer"
                >
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-forest/10 text-forest">
                    <Play className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm truncate">{t.name}</h4>
                      <Badge
                        variant={t.status === "active" ? "default" : t.status === "completed" ? "secondary" : "outline"}
                        className="text-[10px] shrink-0"
                      >
                        {t.status === "setup" ? "Seadistamine" : t.status === "active" ? "Käimas" : "Lõppenud"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {t.course_name} — {t.holes_count} auku
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {recentTournaments.length === 0 && (
          <motion.div variants={fadeUp} className="text-center py-12 text-muted-foreground">
            <div className="text-6xl mb-3 opacity-80">🏌️</div>
            <p className="font-semibold text-foreground/80">Pole veel turniire</p>
            <p className="text-sm mt-0.5">Loo esimene!</p>
          </motion.div>
        )}
      </motion.main>

      {/* Footer */}
      <footer
        className="px-4 py-3 text-center text-xs text-muted-foreground/60"
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
