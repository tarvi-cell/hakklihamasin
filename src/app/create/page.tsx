"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CourseSearch } from "@/components/tournament/CourseSearch";
import { usePlayer } from "@/hooks/usePlayer";
import type { FoundCourse } from "@/lib/courses/course-finder";

const TOURNAMENT_NAMES = [
  "Hakklihamasin Open",
  "Masters of Disaster",
  "Birdie Sanders Invitational",
  "Weekend Warrior Open",
  "The Bogey Boys Classic",
  "Shankapotomus Cup",
  "The Eagle Has Landed",
  "Fore! Friends Open",
];

const PAR_PRESETS: Record<string, number[]> = {
  "Par 72 (standard)": [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5],
  "Par 70": [4, 3, 4, 5, 4, 3, 4, 3, 5, 4, 4, 3, 5, 4, 3, 4, 4, 5],
  "Par 36 (9 auku)": [4, 3, 5, 4, 4, 3, 4, 5, 4],
  "Par 27 (par-3 rada)": [3, 3, 3, 3, 3, 3, 3, 3, 3],
};

type MaxStrokesMode = "par_plus" | "fixed" | "unlimited";

const MAX_STROKES_OPTIONS: {
  mode: MaxStrokesMode;
  label: string;
  desc: string;
  value?: number;
}[] = [
  { mode: "par_plus", label: "Par + 3", desc: "Vaikimisi — piisav enamikule", value: 3 },
  { mode: "par_plus", label: "Par + 5", desc: "Mõistlik limit lõbusale seltskonnale", value: 5 },
  { mode: "par_plus", label: "Par + 7", desc: "Laiem skaala algajatele", value: 7 },
  { mode: "fixed", label: "Max 10 lööki", desc: "Fikseeritud piir igal augul", value: 10 },
  { mode: "fixed", label: "Max 12 lööki", desc: "Turvaline piir ka keerulistel aukudel", value: 12 },
  { mode: "unlimited", label: "Piiranguta", desc: "Kõik löögid loevad — ausalt mängitud!" },
];

type Step = "basics" | "course" | "formats" | "review";
const STEPS: Step[] = ["basics", "course", "formats", "review"];

export default function CreateTournament() {
  const router = useRouter();
  const { player } = usePlayer();
  const [step, setStep] = useState<Step>("basics");

  // Form state
  const [name, setName] = useState(
    TOURNAMENT_NAMES[Math.floor(Math.random() * TOURNAMENT_NAMES.length)]
  );
  const [courseName, setCourseName] = useState("");
  const [holesCount, setHolesCount] = useState<9 | 18>(18);
  const [holePars, setHolePars] = useState<number[]>(
    PAR_PRESETS["Par 72 (standard)"]
  );
  const [strokeIndices, setStrokeIndices] = useState<number[] | null>(null);
  const [useFlights, setUseFlights] = useState(true);
  const [useHandicaps, setUseHandicaps] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([
    "stroke_play",
  ]);

  // Max strokes setting
  const [maxStrokesIdx, setMaxStrokesIdx] = useState(0); // par + 3 default

  const currentStepIndex = STEPS.indexOf(step);

  const nextStep = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setStep(STEPS[currentStepIndex + 1]);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setStep(STEPS[currentStepIndex - 1]);
    } else {
      router.back();
    }
  };

  const updateHolePar = (index: number, delta: number) => {
    const newPars = [...holePars];
    const newVal = newPars[index] + delta;
    if (newVal >= 3 && newVal <= 5) {
      newPars[index] = newVal;
      setHolePars(newPars);
    }
  };

  const applyPreset = (key: string) => {
    const preset = PAR_PRESETS[key];
    setHolesCount(preset.length === 9 ? 9 : 18);
    setHolePars([...preset]);
    setStrokeIndices(null);
  };

  const handleCourseSelect = (course: FoundCourse) => {
    setCourseName(course.name);
    if (course.holesCount) {
      setHolesCount(course.holesCount);
    }
    if (course.holes.length > 0) {
      // Täida parid automaatselt
      const pars = new Array(course.holesCount || 18).fill(4);
      const sis = new Array(course.holesCount || 18).fill(0);
      let hasAnySi = false;
      course.holes.forEach((h) => {
        if (h.number >= 1 && h.number <= pars.length) {
          pars[h.number - 1] = h.par;
          if (h.si) {
            sis[h.number - 1] = h.si;
            hasAnySi = true;
          }
        }
      });
      setHolePars(pars);
      setStrokeIndices(hasAnySi ? sis : null);
    } else if (course.totalPar && course.holesCount) {
      // Kui auguti andmeid pole, arvuta keskmine
      const avgPar = Math.round(course.totalPar / course.holesCount);
      const pars = new Array(course.holesCount).fill(avgPar);
      // Kohandame, et summa klappiks
      let diff = course.totalPar - pars.reduce((a, b) => a + b, 0);
      for (let i = 0; diff !== 0 && i < pars.length; i++) {
        if (diff > 0 && pars[i] < 5) {
          pars[i]++;
          diff--;
        } else if (diff < 0 && pars[i] > 3) {
          pars[i]--;
          diff++;
        }
      }
      setHolePars(pars);
    }
  };

  const toggleFormat = (fmt: string) => {
    if (selectedFormats.includes(fmt)) {
      if (selectedFormats.length > 1) {
        setSelectedFormats(selectedFormats.filter((f) => f !== fmt));
      }
    } else {
      setSelectedFormats([...selectedFormats, fmt]);
    }
  };

  const maxStrokesSetting = MAX_STROKES_OPTIONS[maxStrokesIdx];

  const getMaxStrokesForHole = (par: number): number => {
    if (maxStrokesSetting.mode === "unlimited") return 20;
    if (maxStrokesSetting.mode === "fixed") return maxStrokesSetting.value!;
    return par + maxStrokesSetting.value!;
  };

  const getMaxStrokesLabel = (): string => {
    return maxStrokesSetting.label;
  };

  const handleCreate = async () => {
    // Create player entry for the TD
    const tdPlayer = {
      id: player.id || crypto.randomUUID(),
      name: player.name,
      emoji: player.emoji,
      handicap: player.handicap,
    };

    const tournament = {
      id: crypto.randomUUID(),
      name,
      course_name: courseName || "Nimetamata rada",
      holes_count: holesCount,
      hole_pars: holePars.slice(0, holesCount),
      stroke_indices: strokeIndices?.slice(0, holesCount) || null,
      use_flights: useFlights,
      share_code: generateShareCode(),
      status: "setup" as const,
      formats: selectedFormats,
      players: [tdPlayer], // TD is first player
      settings: {
        use_handicaps: useHandicaps,
        max_strokes_mode: maxStrokesSetting.mode,
        max_strokes_value: maxStrokesSetting.value ?? null,
      },
      created_by: tdPlayer.id,
      created_at: new Date().toISOString(),
    };

    localStorage.setItem(
      `hakklihamasin-tournament-${tournament.id}`,
      JSON.stringify(tournament)
    );
    localStorage.setItem("hakklihamasin-active-tournament", tournament.id);

    router.push(`/tournament/${tournament.id}`);
  };

  const totalPar = holePars.slice(0, holesCount).reduce((a, b) => a + b, 0);

  const FORMAT_SECTIONS = [
    {
      title: "Individuaalsed",
      formats: [
        { id: "stroke_play", name: "Stroke Play", emoji: "🏌️", desc: "Klassikaline — vähem lööke, parem tulemus" },
        { id: "stableford", name: "Stableford", emoji: "⭐", desc: "Punktid auguti — halb auk ei hävita ringi" },
        { id: "skins", name: "Skins", emoji: "💰", desc: "Iga auk on eraldi võistlus — viigid lähevad edasi" },
        { id: "match_play", name: "Match Play", emoji: "⚔️", desc: "Üks-ühele — iga auk eraldi võistlus" },
        { id: "nassau", name: "Nassau", emoji: "🎰", desc: "Kolm matši ühes — esi 9, taga 9, kokku" },
        { id: "quota", name: "Quota", emoji: "🎯", desc: "Igaüks saab isikliku sihtmärgi HCP järgi" },
      ],
    },
    {
      title: "Tiimi formaadid",
      formats: [
        { id: "best_ball", name: "Best Ball", emoji: "🤝", desc: "Tiimi parim tulemus igal augul loeb" },
        { id: "scramble", name: "Scramble", emoji: "🤠", desc: "Kõik löövad, valige parim — koos on lihtsam" },
        { id: "shamble", name: "Shamble", emoji: "🎪", desc: "Parim drive, siis igaüks oma palli" },
        { id: "cha_cha_cha", name: "Cha Cha Cha", emoji: "💃", desc: "1, 2 või 3 parimat skoori loevad — vaheldub" },
        { id: "six_six_six", name: "6-6-6", emoji: "6️⃣", desc: "Paarid roteeruvad iga 6 auku" },
      ],
    },
    {
      title: "Erikujulised",
      formats: [
        { id: "meat_grinder", name: "Hakklihamasin", emoji: "🔪", desc: "Formaat vahetub iga 3 auku — aju hakklihamasin!" },
        { id: "wolf", name: "Wolf", emoji: "🐺", desc: "Hunt valib partneri — või läheb üksi!" },
        { id: "hammer", name: "Hammer", emoji: "🔨", desc: "Topelda panuseid igal hetkel" },
        { id: "bloodsomes", name: "Bloodsomes", emoji: "🩸", desc: "Vastased valivad su halvema drive'i" },
        { id: "bingo_bango_bongo", name: "Bingo Bango Bongo", emoji: "🥁", desc: "3 punkti per auk — esimene greenil, lähedaim, esimene augus" },
      ],
    },
    {
      title: "Kõrvalmängud",
      formats: [
        { id: "dots", name: "Dots / Garbage", emoji: "🗑️", desc: "Punktid saavutuste eest — sandy, greenie, chip-in" },
        { id: "snake", name: "Snake", emoji: "🐍", desc: "Kes viimati 3-putt tegi, hoiab madu" },
        { id: "rabbit", name: "Rabbit", emoji: "🐰", desc: "Püüa jänes — hoia teda 9. ja 18. augul" },
      ],
    },
    {
      title: "Lõbusad reeglid",
      formats: [
        { id: "string_game", name: "String Game", emoji: "🧵", desc: "Nööri pikkuse võrra saad palli liigutada" },
        { id: "three_club", name: "3-Club Challenge", emoji: "3️⃣", desc: "Ainult 3 keppi + putter" },
        { id: "foot_wedge", name: "Portuguese Caddie", emoji: "🦶", desc: "3-5x ringis saad palli jalaga lüüa" },
      ],
    },
  ];

  const ALL_FORMATS = FORMAT_SECTIONS.flatMap((s) => s.formats);

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <button onClick={prevStep} className="p-2 -ml-2 hover:bg-muted rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold">Loo turniir</h1>
          <p className="text-xs text-muted-foreground">
            Samm {currentStepIndex + 1}/{STEPS.length}
          </p>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-colors ${
                i <= currentStepIndex ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === "basics" && (
            <motion.div
              key="basics"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base">
                  Turniiri nimi
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-lg h-12"
                  maxLength={40}
                />
                <button
                  type="button"
                  onClick={() =>
                    setName(
                      TOURNAMENT_NAMES[
                        Math.floor(Math.random() * TOURNAMENT_NAMES.length)
                      ]
                    )
                  }
                  className="text-xs text-primary hover:underline"
                >
                  🎲 Genereeri uus nimi
                </button>
              </div>

              {/* GPS course finder */}
              <div className="space-y-2">
                <Label className="text-base">Golfirada</Label>
                <CourseSearch onSelect={handleCourseSelect} />
                <div className="relative">
                  <Input
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="... või sisesta käsitsi"
                    className="h-11"
                  />
                  {courseName && strokeIndices && (
                    <Badge
                      variant="default"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-birdie"
                    >
                      GPS andmed laetud
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Kasuta flighte</Label>
                  <p className="text-sm text-muted-foreground">
                    2 gruppi erineva tasemega
                  </p>
                </div>
                <Switch
                  checked={useFlights}
                  onCheckedChange={setUseFlights}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Kasuta handicap'e</Label>
                  <p className="text-sm text-muted-foreground">
                    Tasakaalusta mängijate taset
                  </p>
                </div>
                <Switch
                  checked={useHandicaps}
                  onCheckedChange={setUseHandicaps}
                />
              </div>

              {/* Max strokes setting */}
              <Separator />
              <div className="space-y-3">
                <div>
                  <Label className="text-base">Max löögid augul</Label>
                  <p className="text-sm text-muted-foreground">
                    Kui palju saab ühel augul lüüa
                  </p>
                </div>
                <div className="space-y-2">
                  {MAX_STROKES_OPTIONS.map((opt, i) => (
                    <button
                      key={`${opt.mode}-${opt.value}`}
                      onClick={() => setMaxStrokesIdx(i)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl border transition-colors ${
                        maxStrokesIdx === i
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-sm">{opt.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {opt.desc}
                          </span>
                        </div>
                        {maxStrokesIdx === i && (
                          <Check className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Par-4 augul:{" "}
                  <span className="font-medium">
                    max {getMaxStrokesForHole(4)} lööki
                  </span>
                  {" | "}
                  Par-5 augul:{" "}
                  <span className="font-medium">
                    max {getMaxStrokesForHole(5)} lööki
                  </span>
                </p>
              </div>
            </motion.div>
          )}

          {step === "course" && (
            <motion.div
              key="course"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-5"
            >
              {/* Presets — only if no GPS data loaded */}
              {!strokeIndices && (
                <div>
                  <Label className="text-base mb-3 block">Vali eelseadistus</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.keys(PAR_PRESETS).map((key) => (
                      <button
                        key={key}
                        onClick={() => applyPreset(key)}
                        className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                          JSON.stringify(holePars) ===
                            JSON.stringify(PAR_PRESETS[key]) &&
                          holesCount === PAR_PRESETS[key].length
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="font-medium">{key}</div>
                        <div className="text-xs text-muted-foreground">
                          {PAR_PRESETS[key].join("-")}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {strokeIndices && (
                <div className="px-3 py-2 bg-birdie/10 rounded-xl text-sm">
                  Parid laetud GPS-ist ({courseName}). Saad neid allpool muuta.
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base">
                    Augu parid ({holesCount} auku, par {totalPar})
                  </Label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setHolesCount(9);
                        if (holePars.length < 9) {
                          setHolePars([...holePars, ...new Array(9 - holePars.length).fill(4)]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        holesCount === 9
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      9
                    </button>
                    <button
                      onClick={() => {
                        setHolesCount(18);
                        if (holePars.length < 18) {
                          setHolePars([...holePars, ...new Array(18 - holePars.length).fill(4)]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        holesCount === 18
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      18
                    </button>
                  </div>
                </div>

                {/* Front 9 */}
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1.5 font-medium">
                    Esi 9
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {holePars.slice(0, Math.min(9, holesCount)).map((par, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg"
                      >
                        <span className="text-xs text-muted-foreground font-mono">
                          #{i + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateHolePar(i, -1)}
                            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center font-semibold">
                            {par}
                          </span>
                          <button
                            onClick={() => updateHolePar(i, 1)}
                            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Back 9 */}
                {holesCount === 18 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5 font-medium">
                      Taga 9
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {holePars.slice(9, 18).map((par, i) => (
                        <div
                          key={i + 9}
                          className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg"
                        >
                          <span className="text-xs text-muted-foreground font-mono">
                            #{i + 10}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateHolePar(i + 9, -1)}
                              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center font-semibold">
                              {par}
                            </span>
                            <button
                              onClick={() => updateHolePar(i + 9, 1)}
                              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === "formats" && (
            <motion.div
              key="formats"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-4"
            >
              <div>
                <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold mb-1">
                  Vali formaadid
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Saad valida mitu — tulemused arvutatakse kõigile paralleelselt
                </p>
              </div>

              {FORMAT_SECTIONS.map((section) => (
                <div key={section.title} className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">
                    {section.title}
                  </h3>
                  {section.formats.map((fmt) => (
                    <Card
                      key={fmt.id}
                      className={`cursor-pointer transition-all active:scale-[0.98] ${
                        selectedFormats.includes(fmt.id)
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "hover:border-primary/40"
                      }`}
                      onClick={() => toggleFormat(fmt.id)}
                    >
                      <CardContent className="flex items-center gap-3 p-3.5">
                        <div className="text-2xl">{fmt.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{fmt.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {fmt.desc}
                          </div>
                        </div>
                        {selectedFormats.includes(fmt.id) && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 text-primary-foreground" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}
            </motion.div>
          )}

          {step === "review" && (
            <motion.div
              key="review"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-4"
            >
              <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold">
                Kõik valmis?
              </h2>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Turniir</span>
                    <span className="font-semibold">{name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rada</span>
                    <span>{courseName || "Nimetamata"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Augud</span>
                    <span>
                      {holesCount} auku, par {totalPar}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max löögid</span>
                    <span>{getMaxStrokesLabel()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Flightid</span>
                    <span>{useFlights ? "Jah (A + B)" : "Ei"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Formaadid</span>
                    <span>
                      {selectedFormats
                        .map(
                          (f) => ALL_FORMATS.find((ff) => ff.id === f)?.name || f
                        )
                        .join(", ")}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={handleCreate}
                className="w-full h-14 text-lg font-semibold"
                size="lg"
              >
                Loo turniir ⛳
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      {step !== "review" && (
        <div className="px-4 py-4 border-t">
          <Button onClick={nextStep} className="w-full h-12" size="lg">
            Edasi <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

function generateShareCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
