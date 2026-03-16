"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourseSearch } from "@/components/tournament/CourseSearch";
import { useTournament } from "@/hooks/useTournament";
import type { FoundCourse } from "@/lib/courses/course-finder";

const FORMAT_OPTIONS = [
  { id: "stroke_play", name: "Stroke Play", emoji: "🏌️", team: false },
  { id: "stableford", name: "Stableford", emoji: "⭐", team: false },
  { id: "skins", name: "Skins", emoji: "💰", team: false },
  { id: "best_ball", name: "Best Ball", emoji: "🤝", team: true },
  { id: "match_play", name: "Match Play", emoji: "⚔️", team: false },
  { id: "scramble", name: "Scramble", emoji: "🤠", team: true },
  { id: "shamble", name: "Shamble", emoji: "🎪", team: true },
  { id: "nassau", name: "Nassau", emoji: "🎰", team: false },
  { id: "meat_grinder", name: "Hakklihamasin", emoji: "🔪", team: true },
  { id: "cha_cha_cha", name: "Cha Cha Cha", emoji: "💃", team: true },
  { id: "quota", name: "Quota", emoji: "🎯", team: false },
  { id: "wolf", name: "Wolf", emoji: "🐺", team: false },
  { id: "six_six_six", name: "6-6-6", emoji: "6️⃣", team: true },
  { id: "bloodsomes", name: "Bloodsomes", emoji: "🩸", team: true },
];

export default function AddRoundPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { rounds, players, addRound } = useTournament(id);

  const nextRoundNumber = (rounds?.length || 0) + 1;
  const [roundName, setRoundName] = useState(`Päev ${nextRoundNumber}`);
  const [courseName, setCourseName] = useState("");
  const [holesCount, setHolesCount] = useState<9 | 18>(18);
  const [holePars, setHolePars] = useState<number[]>(
    [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5]
  );
  const [strokeIndices, setStrokeIndices] = useState<number[] | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(["stroke_play"]);
  const [teams, setTeams] = useState<string[][]>([]); // Array of pairs: [["id1","id2"], ["id3","id4"]]
  const [isCreating, setIsCreating] = useState(false);

  // Check if any selected format needs teams
  const needsTeams = selectedFormats.some(
    (f) => FORMAT_OPTIONS.find((o) => o.id === f)?.team
  );

  const totalPar = holePars.slice(0, holesCount).reduce((a, b) => a + b, 0);

  const handleCourseSelect = (course: FoundCourse) => {
    setCourseName(course.name);
    if (course.holesCount) setHolesCount(course.holesCount);
    if (course.holes.length > 0) {
      const pars = new Array(course.holesCount || 18).fill(4);
      course.holes.forEach((h) => {
        if (h.number >= 1 && h.number <= pars.length) {
          pars[h.number - 1] = h.par;
        }
      });
      setHolePars(pars);
      if (course.holes.some((h) => h.si)) {
        const sis = new Array(course.holesCount || 18).fill(0);
        course.holes.forEach((h) => {
          if (h.si && h.number >= 1 && h.number <= sis.length) {
            sis[h.number - 1] = h.si;
          }
        });
        setStrokeIndices(sis);
      }
    }
  };

  const toggleFormat = (f: string) => {
    if (selectedFormats.includes(f)) {
      if (selectedFormats.length > 1) {
        setSelectedFormats(selectedFormats.filter((x) => x !== f));
      }
    } else {
      setSelectedFormats([...selectedFormats, f]);
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    const round = await addRound({
      round_number: nextRoundNumber,
      name: roundName || `Ring ${nextRoundNumber}`,
      course_name: courseName || undefined,
      holes_count: holesCount,
      hole_pars: holePars.slice(0, holesCount),
      stroke_indices: strokeIndices?.slice(0, holesCount) || null,
      formats: selectedFormats,
      settings: {
        ...(teams.length > 0 ? { teams } : {}),
      },
    });

    if (round) {
      // Start round immediately
      await fetch(`/api/tournaments/${id}/rounds/${round.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      router.push(`/tournament/${id}/scorecard?round=${round.id}`);
    } else {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b safe-area-top">
        <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-muted rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-semibold">Lisa ring</h1>
          <p className="text-xs text-muted-foreground">Ring {nextRoundNumber}</p>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Round name */}
        <div className="space-y-2">
          <Label className="text-base">Ringi nimi</Label>
          <Input value={roundName} onChange={(e) => setRoundName(e.target.value)}
            placeholder={`Päev ${nextRoundNumber}`} className="h-12 rounded-xl" />
        </div>

        {/* Course search */}
        <div className="space-y-2">
          <Label className="text-base">Rada</Label>
          <CourseSearch onSelect={handleCourseSelect} />
          <Input value={courseName} onChange={(e) => setCourseName(e.target.value)}
            placeholder="... või sisesta käsitsi" className="h-11 rounded-xl" />
          {courseName && strokeIndices && (
            <Badge variant="default" className="text-xs bg-birdie">
              <Check className="w-3 h-3 mr-1" /> Aukude parid laetud
            </Badge>
          )}
        </div>

        {/* Holes + Par */}
        <div>
          <Label className="text-base mb-3 block">Augud</Label>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[9, 18].map((n) => (
              <button key={n} onClick={() => {
                setHolesCount(n as 9 | 18);
                if (!strokeIndices) setHolePars(generatePars(n, n === 9 ? 36 : 72));
              }}
                className={`p-3 rounded-2xl border-2 text-center transition-all ${
                  holesCount === n ? "border-primary bg-primary/5" : "border-border"
                }`}>
                <div className="text-2xl font-bold">{n}</div>
                <div className="text-xs text-muted-foreground">auku</div>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {holePars.slice(0, holesCount).map((par, i) => (
              <button key={i} onClick={() => {
                const next = par === 5 ? 3 : par + 1;
                const newPars = [...holePars];
                newPars[i] = next;
                setHolePars(newPars);
              }}
                className={`w-9 h-9 rounded-lg text-sm font-semibold flex items-center justify-center active:scale-90 ${
                  par === 3 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : par === 5 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-muted text-foreground"
                }`}>
                {par}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Par {totalPar} · Puuduta muutmiseks</p>
        </div>

        {/* Formats */}
        <div>
          <Label className="text-base mb-3 block">Formaadid</Label>
          <div className="flex flex-wrap gap-2">
            {FORMAT_OPTIONS.map((f) => (
              <button key={f.id} onClick={() => toggleFormat(f.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all ${
                  selectedFormats.includes(f.id)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground"
                }`}>
                <span>{f.emoji}</span>
                <span>{f.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Team pairing */}
        {needsTeams && players.length >= 2 && (
          <div>
            <Label className="text-base mb-2 block">Paarid</Label>
            <p className="text-xs text-muted-foreground mb-3">
              Tiimiformaatide jaoks. Puuduta mängijat paari loomiseks.
            </p>

            {/* Auto-pair button */}
            {teams.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Auto-pair: first with second, third with fourth, etc.
                  const pairs: string[][] = [];
                  for (let i = 0; i < players.length - 1; i += 2) {
                    pairs.push([players[i].id, players[i + 1].id]);
                  }
                  // Odd player gets solo team
                  if (players.length % 2 !== 0) {
                    pairs.push([players[players.length - 1].id]);
                  }
                  setTeams(pairs);
                }}
                className="w-full mb-3 border-dashed"
              >
                🎲 Automaatsed paarid
              </Button>
            )}

            {/* Show current pairs */}
            {teams.length > 0 && (
              <div className="space-y-2 mb-3">
                {teams.map((team, ti) => (
                  <div key={ti} className="flex items-center gap-2 p-2.5 bg-primary/5 rounded-xl">
                    <span className="text-xs font-bold text-primary w-6">#{ti + 1}</span>
                    <div className="flex items-center gap-1.5 flex-1">
                      {team.map((pid) => {
                        const p = players.find((x) => x.id === pid);
                        return p ? (
                          <span key={pid} className="flex items-center gap-1 px-2 py-1 bg-card rounded-lg text-sm">
                            <span>{p.emoji}</span>
                            <span className="font-medium">{p.name}</span>
                          </span>
                        ) : null;
                      })}
                    </div>
                    <button
                      onClick={() => setTeams(teams.filter((_, i) => i !== ti))}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* Unpaired players */}
                {(() => {
                  const paired = new Set(teams.flat());
                  const unpaired = players.filter((p) => !paired.has(p.id));
                  if (unpaired.length === 0) return null;
                  return (
                    <div className="text-xs text-muted-foreground pt-1">
                      Paaritu: {unpaired.map((p) => `${p.emoji} ${p.name}`).join(", ")}
                    </div>
                  );
                })()}

                <Button variant="outline" size="sm" onClick={() => setTeams([])} className="text-xs">
                  Tühjenda paarid
                </Button>
              </div>
            )}

            {/* Manual pairing (tap-to-pair) */}
            {teams.length === 0 && (
              <div className="grid grid-cols-2 gap-2">
                {players.map((p) => (
                  <button
                    key={p.id}
                    className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-xl text-sm hover:bg-muted transition-colors"
                    onClick={() => {
                      // Find incomplete team or start new
                      const incomplete = teams.findIndex((t) => t.length < 2);
                      if (incomplete >= 0) {
                        const newTeams = [...teams];
                        newTeams[incomplete] = [...newTeams[incomplete], p.id];
                        setTeams(newTeams);
                      } else {
                        setTeams([...teams, [p.id]]);
                      }
                    }}
                  >
                    <span className="text-lg">{p.emoji}</span>
                    <span className="font-medium truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create button */}
        <Button onClick={handleCreate} disabled={isCreating}
          className="w-full h-14 text-lg font-semibold" size="lg">
          {isCreating ? "Loon..." : (
            <><Play className="w-5 h-5 mr-2" /> Alusta ringi</>
          )}
        </Button>
      </div>
    </div>
  );
}

function generatePars(holes: number, targetPar: number): number[] {
  const pars = new Array(holes).fill(4);
  let current = holes * 4;
  const par5Pos = holes === 9 ? [4, 8] : [1, 7, 12, 17];
  const par3Pos = holes === 9 ? [2, 6] : [2, 6, 11, 15];
  for (const p of par5Pos) { if (p < holes && current < targetPar) { pars[p] = 5; current++; } }
  for (const p of par3Pos) { if (p < holes && current > targetPar) { pars[p] = 3; current--; } }
  for (let i = 0; i < holes && current !== targetPar; i++) {
    if (current < targetPar && pars[i] < 5) { pars[i]++; current++; }
    else if (current > targetPar && pars[i] > 3) { pars[i]--; current--; }
  }
  return pars;
}
