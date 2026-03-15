"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Format {
  name: string;
  emoji: string;
  category: "individual" | "team" | "fun" | "side_game";
  players: string;
  description: string;
  rules: string;
  implemented: boolean;
}

const FORMATS: Format[] = [
  // Individual
  { name: "Stroke Play", emoji: "🏌️", category: "individual", players: "2-20", description: "Klassikaline formaat — vähem lööke, parem tulemus", rules: "Loe kokku kõik löögid. Madalaim skoor võidab. Gross (ilma HCP-ta) ja net (HCP-ga) edetabel.", implemented: true },
  { name: "Stableford", emoji: "⭐", category: "individual", players: "2-20", description: "Punktid auguti — halb auk ei hävita ringi", rules: "Bogey=1, Par=2, Birdie=3, Eagle=4, Albatross=5, Double+=0. Kõrgeim punktisumma võidab.", implemented: true },
  { name: "Match Play", emoji: "⚔️", category: "individual", players: "2", description: "Üks-ühele — iga auk on eraldi võistlus", rules: "Madalam skoor augul võidab augu. Juhti näidatakse '2 UP' / 'AS'. Matš lõpeb varakult kui juhtimine > allesjäänud augud.", implemented: true },
  { name: "Skins", emoji: "💰", category: "individual", players: "2-8", description: "Iga auk on eraldi auhind — viigid lähevad edasi", rules: "Madalaim skoor augul võidab skin'i. Viigi korral läheb skin järgmisele augule (carry-over). Viimane auk: kõik kuhjunud skin'id.", implemented: true },
  { name: "Nassau", emoji: "🎰", category: "individual", players: "2-4", description: "Kolm matši ühes — esi 9, taga 9, kokku", rules: "Kolm eraldi match play matši: esimesed 9, tagumised 9, ja kogu ring. Saab press'ida (topelt panused) kui jääd alla.", implemented: true },
  { name: "Quota", emoji: "🎯", category: "individual", players: "2-20", description: "Parim equalizer — igaüks saab isikliku sihtmärgi", rules: "Sinu kvoot = 36 - HCP. Bogey=1, Par=2, Birdie=4, Eagle=8. Ületa oma kvooti!", implemented: true },

  // Team
  { name: "Scramble / Texas Scramble", emoji: "🤠", category: "team", players: "4 (tiimid)", description: "Kõik löövad, valige parim — koos on lihtsam", rules: "Kõik tiimi liikmed löövad. Valige parim pall. Kõik löövad sealt edasi. Korrake kuni augus.", implemented: true },
  { name: "Best Ball", emoji: "🤝", category: "team", players: "4 (2x2)", description: "Igaüks mängib oma palli — tiimi parim loeb", rules: "Mõlemad partnerid mängivad oma palli kogu augu. Tiimi skoor = madalam individuaalne skoor.", implemented: true },
  { name: "Hakklihamasin (3-3-3)", emoji: "🔪", category: "team", players: "4+", description: "Formaat vahetub iga 3 auku — aju hakklihamasin!", rules: "Nt augud 1-3 Scramble, 4-6 Best Ball, 7-9 Alternate Shot, siis kordub. Aju ei saa rütmi sisse!", implemented: true },
  { name: "Shamble", emoji: "🎪", category: "team", players: "4", description: "Parim drive, siis igaüks oma palli", rules: "Kõik löövad tee'lt. Valige parim drive. Sealt edasi mängib igaüks oma palli.", implemented: true },
  { name: "Alternate Shot", emoji: "🔄", category: "team", players: "4 (2x2)", description: "Vahelduvad löögid — üks pall, kaks mängijat", rules: "Partnerid löövad sama palli vaheldumisi. Partner A tee'b paaritutel, B paaris augul (või vastupidi).", implemented: true },
  { name: "Greensomes", emoji: "🌿", category: "team", players: "4 (2x2)", description: "Mõlemad tee'vad, valige parim, siis vahelduvad", rules: "Mõlemad löövad tee'lt. Valige parim drive. Kelle drive'i EI valitud, see lööb järgmise. Sealt vahelduvad.", implemented: true },
  { name: "Cha Cha Cha (1-2-3)", emoji: "💃", category: "team", players: "4", description: "1, 2 või 3 parimat skoori loevad — vaheldub!", rules: "Auk 1: 1 parim skoor. Auk 2: 2 parimat. Auk 3: 3 parimat. Siis kordub.", implemented: true },
  { name: "Yellow Ball", emoji: "🟡", category: "team", players: "4", description: "Roteeruv 'kuum pall' — kaotad selle, tiim kannatab", rules: "Üks mängija mängib kollase palliga (roteerub). Tiimi skoor = parim skoor + kollase palli skoor. Kaotad palli = karistus!", implemented: true },
  { name: "Bloodsomes", emoji: "🩸", category: "team", players: "4 (2x2)", description: "Vastased VALIVAD su halvema drive'i — julmade mäng", rules: "Mõlemad löövad tee'lt. VASTASTIIM valib, kummast drive'ist te mängite. Nad valivad halvema. Sealt alternate shot.", implemented: true },
  { name: "6-6-6", emoji: "6️⃣", category: "team", players: "4", description: "Paarid roteeruvad iga 6 auku — mängi kõigiga", rules: "Augud 1-6: A+B vs C+D. 7-12: A+C vs B+D. 13-18: A+D vs B+C.", implemented: true },

  // Fun
  { name: "Bingo Bango Bongo", emoji: "🥁", category: "fun", players: "3-4", description: "3 punkti per auk — esimene green'il, lähedaim lipule, esimene augus", rules: "Bingo: esimene green'il. Bango: lähedaim lipule kui kõik green'il. Bongo: esimene augus.", implemented: true },
  { name: "Wolf", emoji: "🐺", category: "fun", players: "4", description: "Hunt valib partneri pärast tee-lööke — või läheb üksi!", rules: "Roteeruv Hunt näeb teiste tee-lööke ja valib partneri. Lone Wolf = üksi kolme vastu, topelt panused!", implemented: true },
  { name: "Hammer", emoji: "🔨", category: "fun", players: "2-4", description: "Topelda panuseid igal hetkel — psühholoogiline sõda", rules: "Igal hetkel saad 'hammerdada' — panused kahekordistuvad. Vastane peab vastu võtma või loobuma.", implemented: true },
  { name: "String Game", emoji: "🧵", category: "fun", players: "2-8", description: "2m nööri — liiguta palli nööri pikkuse võrra", rules: "Iga mängija saab 2m nööri (nõrgemad rohkem). Palli liigutamisel lõikad kasutatud pikkuse maha. Kui nöör otsas, on otsas!", implemented: true },
  { name: "Portuguese Caddie", emoji: "🦶", category: "fun", players: "2-8", description: "3-5x ringis saad palli JALAGA parema kohta lüüa", rules: "Legaalne foot wedge! Kokkulepitud arv jalaga lööke ringi kohta. Strateegia: millal kasutad?", implemented: true },
  { name: "3-Club Challenge", emoji: "3️⃣", category: "fun", players: "2-8", description: "Ainult 3 keppi + putter — loovus on kuningas", rules: "Vali 3 keppi enne ringi. Need + putter on ainsad mida saad kasutada. Scratch-mängija pole enam nii ohtlik!", implemented: true },
  { name: "Speed Golf", emoji: "🏃", category: "fun", players: "1-4", description: "Skoor = löögid + minutid — jookse ja löö!", rules: "Max 7 keppi. Jooksed augult augule. Skoor = löögid + aeg minutites. 85 lööki + 52 min = 137.", implemented: true },
  { name: "HORSE", emoji: "🐴", category: "fun", players: "2-4", description: "Tee trikk-löök — teised peavad kordama", rules: "Nagu korvpallis. Tee lööki, teised kordavad. Ei suuda? Saad tähe. H-O-R-S-E = väljas.", implemented: true },

  // Side games
  { name: "Dots / Garbage", emoji: "🗑️", category: "side_game", players: "2-8", description: "Punktid saavutuste eest — sandy, greenie, chip-in...", rules: "Kokkulepitud saavutused annavad +/- punkte: sandy +1, greenie +1, 3-putt -1, vette -1, chip-in +2 jne.", implemented: true },
  { name: "Snake", emoji: "🐍", category: "side_game", players: "3-4", description: "Kes viimati 3-putt tegi, hoiab 'madu'", rules: "3-putt = saad mao. Madu läheb edasi järgmisele 3-puttijale. 18. augul madu hoidja maksab!", implemented: true },
  { name: "Rabbit", emoji: "🐰", category: "side_game", players: "3-4", description: "Püüa jänes — hoia teda 9. ja 18. augul", rules: "Esimene augu võitja püüab jänese. Teine võitja varastab. Kes hoiab 9. augul, võidab poole potist.", implemented: true },
  { name: "Banker", emoji: "🏦", category: "side_game", players: "3-4", description: "Roteeruv pankur — mängi üks kolme vastu", rules: "Pankur roteerub. Teised panevad panuse pankuri vastu. Pankur võib suurelt võita... või kaotada.", implemented: true },
];

const CATEGORY_LABELS: Record<string, string> = {
  individual: "Individuaalne",
  team: "Tiim",
  fun: "Lõbus / Party",
  side_game: "Kõrvalmäng",
};

export default function FormatsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = FORMATS.filter((f) => {
    const matchesSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      !selectedCategory || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["individual", "team", "fun", "side_game"];

  return (
    <div className="min-h-dvh bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-muted rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold">Mänguformaadid</h1>
        <Badge variant="secondary" className="ml-auto">
          {FORMATS.length} formaati
        </Badge>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Otsi formaati..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              !selectedCategory
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Kõik ({FORMATS.length})
          </button>
          {categories.map((cat) => {
            const count = FORMATS.filter((f) => f.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat ? null : cat)
                }
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {CATEGORY_LABELS[cat]} ({count})
              </button>
            );
          })}
        </div>

        {/* Format list */}
        <div className="space-y-3">
          {filtered.map((fmt, i) => (
            <motion.div
              key={fmt.name}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{fmt.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{fmt.name}</h3>
                        {fmt.implemented && (
                          <Badge
                            variant="default"
                            className="text-[10px] px-1.5 py-0"
                          >
                            Aktiivne
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {fmt.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fmt.rules}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_LABELS[fmt.category]}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {fmt.players} mängijat
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Ei leidnud formaate</p>
          </div>
        )}
      </div>
    </div>
  );
}
