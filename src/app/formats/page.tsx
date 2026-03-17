"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, ChevronDown, Users, User, Dices, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Format {
  name: string;
  emoji: string;
  category: "individual" | "team" | "fun" | "side_game";
  players: string;
  description: string;
  howToPlay: string[];
  scoring: string;
  bestFor: string;
  example?: string;
  tip?: string;
}

const FORMATS: Format[] = [
  // ── Individual ──
  {
    name: "Stroke Play", emoji: "🏌️", category: "individual", players: "2-20",
    description: "Klassikaline formaat — vähem lööke, parem tulemus",
    howToPlay: [
      "Iga mängija mängib oma palli kogu ringi.",
      "Loe kokku KÕIK löögid 18 (või 9) augul.",
      "Madalaim koguarv võidab.",
    ],
    scoring: "Gross = tegelik löökide arv. Net = gross miinus handicap. Mõlemat saab eraldi arvestada.",
    bestFor: "Igale grupile. Lihtne, aus, kõigile arusaadav.",
    example: "Tarvi lööb 82, Mart 78. Mart võidab gross'is. Kui Tarvil on HCP 12 ja Mardil 6: Tarvi net 70, Mart net 72 → Tarvi võidab net'is!",
  },
  {
    name: "Stableford", emoji: "⭐", category: "individual", players: "2-20",
    description: "Punktid auguti — halb auk ei hävita ringi",
    howToPlay: [
      "Mängi oma palli nagu tavaliselt.",
      "Igal augul saad punkte oma skoori põhjal (võrreldes par'iga).",
      "Kõige rohkem punkte kogunud mängija võidab.",
    ],
    scoring: "Double bogey või hullem = 0 punkti. Bogey = 1. Par = 2. Birdie = 3. Eagle = 4. Albatross = 5. Modified Stableford: Double = -3, Bogey = -1, Par = 0, Birdie = +2, Eagle = +5.",
    bestFor: "Erineva tasemega seltskonnale. Üks halb auk ei riku kogu ringi — saad lihtsalt 0 ja lähed edasi.",
    tip: "Kui löökide arv läheb liiga suureks, võta pall üles ja märgi 0 punkti. Säästab aega!",
  },
  {
    name: "Match Play", emoji: "⚔️", category: "individual", players: "2",
    description: "Üks-ühele — iga auk on eraldi võistlus",
    howToPlay: [
      "Kaks mängijat võistlevad omavahel auk-augu haaval.",
      "Igal augul: madalam skoor VÕIDAB augu. Sama skoor = viik (halved).",
      "Seisu näidatakse: '2 UP' (2 auku ees), 'AS' (viigis), '1 DOWN' (1 augu taga).",
      "Matš lõpeb varakult kui ühel mängijal on rohkem auke ees kui mängida jäänud (nt '3&2' = 3 auku ees, 2 jäänud).",
    ],
    scoring: "Iga auk on väärt 1 punkt. Kogu löökide arv ei loe — ainult aukude võidud.",
    bestFor: "Kahe võrdse mängija vaheline dramaatiline duell.",
    example: "Auk 1: Tarvi 4, Mart 5 → Tarvi 1 UP. Auk 2: mõlemad 4 → Tarvi endiselt 1 UP. Auk 3: Tarvi 6, Mart 4 → All Square.",
  },
  {
    name: "Skins", emoji: "💰", category: "individual", players: "2-8",
    description: "Iga auk on eraldi auhind — viigid lähevad edasi",
    howToPlay: [
      "Iga auk on väärt ühe 'skin'i.",
      "Augul AINULT madalaima skoori tegija võidab skin'i.",
      "Kui kaks või rohkem mängijat teevad sama madala skoori = VIIK → skin läheb edasi järgmisele augule (carry-over).",
      "Kuhjunud skin'id võidab see, kes järgmisel augul ÜKSI madalaima skoori teeb.",
    ],
    scoring: "Iga skin = kokkulepitud summa (nt 5€). Carry-over tähendab et augud muutuvad järjest väärtuslikumaks.",
    bestFor: "Põnevus ja pinge igal augul. Parim kui mängijaid on 3-4.",
    example: "Auk 1: kõik par → carry-over, auk 2 väärt 2 skin'i. Auk 2: Mart üksi birdie → Mart võidab 2 skin'i!",
    tip: "Viimane auk on tihti kõige väärtuslikum — kõik kuhjunud skin'id pannakse mängu.",
  },
  {
    name: "Nassau", emoji: "🎰", category: "individual", players: "2-4",
    description: "Kolm matši ühes — esi 9, taga 9, kokku",
    howToPlay: [
      "Sisuliselt KOLM eraldi match play matši ühe ringi sees:",
      "1) Esimesed 9 auku (Front 9) — eraldi matš",
      "2) Tagumised 9 auku (Back 9) — eraldi matš",
      "3) Kogu ring (Overall) — eraldi matš",
      "Iga matš on väärt kokkulepitud summa.",
    ],
    scoring: "Iga osa (front/back/overall) arvestatakse eraldi. Saad võita 0-3 matši. Press: kui jääd 2 auku alla, saad 'pressida' — alustada uus kõrvalmatš samadel aukudel.",
    bestFor: "Mängijad kes tahavad panuseid, aga mitte liiga suuri. Kolm võimalust võita!",
  },
  {
    name: "Quota", emoji: "🎯", category: "individual", players: "2-20",
    description: "Parim equalizer — igaüks saab isikliku sihtmärgi HCP järgi",
    howToPlay: [
      "Iga mängija saab isikliku sihtmärgi (kvoodi): 36 miinus su handicap.",
      "Mängi ring ja kogu punkte: Bogey = 1, Par = 2, Birdie = 4, Eagle = 8.",
      "Sinu tulemus = kogutud punktid MIINUS su kvoot.",
      "Kõrgeim positiivne number võidab.",
    ],
    scoring: "HCP 10 mängija kvoot = 26. Kui ta kogub 28 punkti: tulemus +2. HCP 20 mängija kvoot = 16. Kui ta kogub 19: tulemus +3 → VÕIDAB!",
    bestFor: "Väga erineva tasemega seltskond. 20-HCP mängijal on täpselt sama hea võimalus võita kui scratch-mängijal.",
  },

  // ── Team ──
  {
    name: "Scramble / Texas Scramble", emoji: "🤠", category: "team", players: "4 (tiimid)",
    description: "Kõik löövad, valige parim — koos on lihtsam",
    howToPlay: [
      "Kõik tiimi liikmed löövad tee-löögi.",
      "Valige PARIM pall. Kõik tõstavad oma pallid üles.",
      "Kõik löövad uuesti valitud kohalt.",
      "Korrake kuni pall on augus. Kirjutage üles üks tiimi skoor.",
      "Texas Scramble: iga mängija tee-lööki PEAB kasutama vähemalt 3-4 korda (aususe reegel).",
    ],
    scoring: "Üks skoor tiimi kohta per auk. Tavaliselt väga madal (10-15 alla par'i hea tiimiga).",
    bestFor: "Parim formaat algajatele! Vähem survet, sest meeskond katab su vead. Heategevusturniiri klassika.",
    tip: "Strateegia: kui parim mängija on hea draivis, löövad teised agressiivsemalt (riskivabad).",
  },
  {
    name: "Best Ball / Four-Ball", emoji: "🤝", category: "team", players: "4 (2x2)",
    description: "Igaüks mängib oma palli — tiimi parim loeb",
    howToPlay: [
      "Mõlemad partnerid mängivad OMA palli kogu augu.",
      "Tiimi skoor igal augul = partneritest MADALAM individuaalne skoor.",
      "Teine partner võib augul ka halvasti mängida — loeb ainult parim.",
    ],
    scoring: "Tiimi skoor = parim pall igal augul. Saab mängida 1-of-2, 2-of-4 jne.",
    bestFor: "Hea kombinatsioon individuaalse ja tiimimängu vahel. Vähem survet kui stroke play, rohkem kui scramble.",
    example: "Auk 5: Tarvi lööb 5 (bogey), partner Mart lööb 3 (birdie). Tiimi skoor = 3!",
  },
  {
    name: "Hakklihamasin (3-3-3)", emoji: "🔪", category: "team", players: "4+",
    description: "Formaat vahetub iga 3 auku — aju hakklihamasin!",
    howToPlay: [
      "Mängi paarides. Formaat VAHETUB iga 3 augu tagant:",
      "Augud 1-3: Scramble (valige parim lööki)",
      "Augud 4-6: Best Ball (igaüks oma palli, parim loeb)",
      "Augud 7-9: Alternate Shot (vahelduvad löögid)",
      "Augud 10-18: korda sama tsüklit!",
      "TD saab formaatide järjekorda muuta.",
    ],
    scoring: "Iga 3-augulise segmendi skoor liidetakse kokku. Madalaim koguskoor võidab.",
    bestFor: "Seltskond kes tahab vaheldust! Ei saa rütmi sisse — peab pidevalt kohanema. Selle äpi nime-formaat!",
    tip: "Alternate Shot augud on kõige raskemad — üks halb löök mõjutab mõlemat. Scramble augud on 'puhkus'.",
  },
  {
    name: "Shamble", emoji: "🎪", category: "team", players: "4",
    description: "Parim drive, siis igaüks oma palli",
    howToPlay: [
      "Kõik löövad tee-löögi.",
      "Valige PARIM drive. Kõik tõstavad oma pallid sinna.",
      "Sealt edasi mängib igaüks OMA palli auguni.",
      "Tiimi skoor = parim individuaalne skoor (nagu Best Ball, aga ühise drive'iga).",
    ],
    scoring: "Parim 1-of-4 (või 2-of-4) individuaalne skoor pärast ühist drive'i.",
    bestFor: "Nõrgemad mängijad saavad alati hea positsiooni (parim drive). Tugev mängija drive aitab kõiki.",
  },
  {
    name: "Alternate Shot / Foursomes", emoji: "🔄", category: "team", players: "4 (2x2)",
    description: "Vahelduvad löögid — üks pall, kaks mängijat",
    howToPlay: [
      "Paar mängib ÜHTE palli vaheldumisi.",
      "Partner A tee'b paaritutel aukudel (1, 3, 5...), Partner B paaritel (2, 4, 6...).",
      "Pärast tee-lööki vahelduvad löögid: A tee, B teine löök, A kolmas...",
      "Üks skoor paari kohta.",
    ],
    scoring: "Üks skoor paari kohta per auk. Kogu surve on igal löögil — halb löök mõjutab partnerit!",
    bestFor: "Kogenud paarid kes tahavad tõsist väljakutset. Ryder Cup klassika!",
  },
  {
    name: "Cha Cha Cha (1-2-3)", emoji: "💃", category: "team", players: "4",
    description: "1, 2 või 3 parimat skoori loevad — vaheldub!",
    howToPlay: [
      "4 mängijat, igaüks mängib oma palli.",
      "Auk 1: ainult 1 PARIM skoor loeb tiimile.",
      "Auk 2: 2 PARIMAT skoori loevad.",
      "Auk 3: 3 PARIMAT skoori loevad.",
      "Auk 4: jälle 1 parim... ja nii edasi tsüklina.",
    ],
    scoring: "Liidetakse kokku loevad skoorid igal augul. Madalaim tiimi koguskoor võidab.",
    bestFor: "Kõik peavad panustama — 3-aukudel loeb iga skoor! 1-aukudel saab parim mängija kanda meeskonda.",
  },
  {
    name: "6-6-6 / Round Robin", emoji: "6️⃣", category: "team", players: "4",
    description: "Paarid roteeruvad iga 6 auku — mängi kõigiga",
    howToPlay: [
      "4 mängijat, paarid vahetuvad iga 6 auku:",
      "Augud 1-6: A+B vs C+D",
      "Augud 7-12: A+C vs B+D",
      "Augud 13-18: A+D vs B+C",
      "Iga 6-augulise segmendi formaat võib olla Best Ball, Scramble või muu.",
    ],
    scoring: "Iga segment = eraldi matš. Punkte kogutakse 3 matši peale kokku.",
    bestFor: "Igaüks mängib igaühega — ei jää kellegi 'halb partner' kogu ringiks. Sotsiaalne ja aus!",
  },
  {
    name: "Yellow Ball", emoji: "🟡", category: "team", players: "4",
    description: "Roteeruv 'kuum pall' — kaotad selle, tiim kannatab",
    howToPlay: [
      "Üks mängija tiimis mängib KOLLASE palliga (roteerub iga auk).",
      "Tiimi skoor igal augul = parim individuaalne skoor + kollase palli skoor.",
      "Kui kollane pall läheb KADUMA → karistus (nt +10 lööki tiimile)!",
    ],
    scoring: "2 skoori per auk: parim individuaalne + kollane pall. Surve on sellel kelle kord on kollase palliga!",
    bestFor: "Lisab nalja ja survet. 'Palun ära kaota seda palli!' momendid garanteeritud.",
  },
  {
    name: "Bloodsomes / Gruesomes", emoji: "🩸", category: "team", players: "4 (2x2)",
    description: "Vastased VALIVAD su halvema drive'i — julmade mäng",
    howToPlay: [
      "Mõlemad paarid löövad tee-löögi.",
      "VASTASPAAR valib, KUMMAST su drive'ist te mängite.",
      "Loomulikult valivad nad halvema (puude taga, bunkris, OB äärel).",
      "Sealt edasi alternate shot kuni augus.",
    ],
    scoring: "Madalaim tiimi skoor võidab. Aga drive'id on alati halvemast kohast!",
    bestFor: "Sadistlik naer ja massiivne trash talk. Parim formaat huumorimeelega seltskonnale.",
    tip: "Hea strateegia: löö ÜKS turvaline drive ja ÜKS agressiivne. Kui agressiivne kukub, valivad vastased turvalise.",
  },

  // ── Fun ──
  {
    name: "Bingo Bango Bongo", emoji: "🥁", category: "fun", players: "3-4",
    description: "3 punkti per auk — esimene green'il, lähedaim lipule, esimene augus",
    howToPlay: [
      "Igal augul jagatakse 3 punkti:",
      "BINGO — esimene mängija kelle pall jõuab green'ile",
      "BANGO — mängija kelle pall on lipule KÕIGE LÄHEMAL kui kõik on green'il",
      "BONGO — esimene mängija kes palli AUKU lööb",
      "OLULINE: mängi pöördejärjekorras (kaugemal olev mängija lööb esimesena)!",
    ],
    scoring: "3 punkti per auk, 54 punkti 18 augul kokku. Enim punkte võidab.",
    bestFor: "Tasandab mängu — ka nõrgem mängija võib olla esimene green'il või augus!",
  },
  {
    name: "Wolf", emoji: "🐺", category: "fun", players: "4",
    description: "Hunt valib partneri pärast tee-lööke — või läheb üksi!",
    howToPlay: [
      "Iga augul on üks mängija 'HUNT' (roteerub).",
      "Hunt lööb tee'lt ESIMESENA.",
      "Pärast iga teise mängija tee-lööki: Hunt peab KOHE otsustama kas see mängija on tema PARTNER.",
      "Kui Hunt valib partneri: 2 vs 2 (Hunt+partner vs teised kaks).",
      "Kui Hunt kedagi ei vali: LONE WOLF — 1 vs 3! Topelt panused!",
      "BLIND WOLF: Hunt kuulutab 'lone wolf' ENNE teiste tee-lööke — neljakordne panus!",
    ],
    scoring: "Madalam tiimi skoor (best ball) võidab augu. Lone wolf: võit = 3x punktid, kaotus = -3x.",
    bestFor: "Psühholoogiline sõda! Millal minna üksi? Millal turvaline partner valida? Parim 4 inimesega.",
  },
  {
    name: "Hammer", emoji: "🔨", category: "fun", players: "2-4",
    description: "Topelda panuseid igal hetkel — psühholoogiline sõda",
    howToPlay: [
      "Mängi match play'd (või skins'i).",
      "IGAL HETKEL augu jooksul võib kumbki pool HAMMERDADA — panused KAHEKORDISTUVAD.",
      "Vastane peab: VASTU VÕTMA (mängida topelt panusega) või LOOBUMA (kaotab augu praeguse panusega).",
      "Pärast vastuseisu: ainult TEINE pool saab re-hammerdada (4x, 8x...).",
    ],
    scoring: "Algpanus × 2^(hammerite arv). Võib minna väga suureks väga kiiresti!",
    bestFor: "Jordan Spieth ja Justin Thomas mängivad seda! Puhas psühholoogiline sõda — bluff ja närv.",
    example: "Auk 5: Tarvi hammerdab pärast Mardi halba tee-lööki (2x). Mart võtab vastu. Mart hammerdab tagasi peale Tarvi bunker'i löönud (4x). Tarvi loobub → Mart võidab 2x panuse.",
  },
  {
    name: "String Game", emoji: "🧵", category: "fun", players: "2-8",
    description: "Nööri pikkuse võrra saad palli liigutada",
    howToPlay: [
      "Iga mängija saab ringi alguses füüsilise NÖÖRI (2-6 jalga, HCP järgi rohkem).",
      "IGAL HETKEL ringi jooksul: võid palli LIIGUTADA parema kohta.",
      "Lõika nöörist maha kasutatud pikkus.",
      "Kui nöör on otsas — on otsas! Strateegia: millal kasutad?",
    ],
    scoring: "Tavaline stroke play + nööri bonus. Nõrgem mängija (kõrgem HCP) saab rohkem nööri.",
    bestFor: "Geniaalne equalizer + strateegiline mäng. 'Kas kasutan nüüd bunker'ist pääsemiseks või hoian viimaste aukude jaoks?'",
    tip: "Ära kasuta nööri esimestel aukudel — hoia vähemalt pool viimaste aukude jaoks!",
  },
  {
    name: "Portuguese Caddie / Foot Wedge", emoji: "🦶", category: "fun", players: "2-8",
    description: "3-5x ringis saad palli JALAGA parema kohta lüüa",
    howToPlay: [
      "Kokkulepitud arv jalaga lööke per ring (tavaliselt 3-5).",
      "Igal hetkel: võid palli JALAGA lüüa parema kohta.",
      "Karistust pole — legaalne jalaga löök!",
      "Pall liigub sinna kuhu ta veereb.",
    ],
    scoring: "Tavaline stroke play, aga jalaga löögid annavad strateegilise eelise.",
    bestFor: "Puhas lõbu. Legitiimib selle mida enamik amatöölimängijaid nagunii teha tahab 😄",
  },
  {
    name: "3-Club Challenge", emoji: "3️⃣", category: "fun", players: "2-8",
    description: "Ainult 3 keppi + putter — loovus on kuningas",
    howToPlay: [
      "ENNE ringi: vali 3 keppi oma kotist. Need + putter on AINSAD mida saad kasutada!",
      "Mängi kogu ring (9 või 18 auku) ainult nende keppidega.",
      "Tüüpiline valik: driver/5-wood, 7-iron, wedge (+ putter).",
    ],
    scoring: "Tavaline stroke play. Aga keppide piiratus muudab mängu drastiliselt.",
    bestFor: "Tasandab mänguvälja — scratch-mängija ainult 3 kepiga on palju haavatavam! Sunnib loovalt mängima.",
    tip: "Ära vali driver'it kui su tee-löögid on ebatäpsed — 5-iron tee'lt on turvalisem!",
  },
  {
    name: "Speed Golf", emoji: "🏃", category: "fun", players: "1-4",
    description: "Skoor = löögid + minutid — jookse ja löö!",
    howToPlay: [
      "Mängi ring NAGU KIIRESTI KUI VÕIMALIK.",
      "Max 7 keppi lubatud. Pole kärusid ega caddie'sid.",
      "Sa JOOKSED augult augule!",
      "Sinu skoor = löökide arv + aeg minutites.",
    ],
    scoring: "85 lööki + 52 minutit = 137. 95 lööki + 38 minutit = 133 (kiirem mängija VÕIDAB kuigi lööke rohkem).",
    bestFor: "Sportlik väljakutse — füüsiline + vaimne. Elimineerib ülemõtlemise — pole aega 5 practice swing'i jaoks!",
  },
  {
    name: "HORSE (Golf Edition)", emoji: "🐴", category: "fun", players: "2-4",
    description: "Tee trikk-löök — teised peavad kordama",
    howToPlay: [
      "Nagu korvpallis!",
      "Üks mängija teeb löögi (nt flop shot üle bunkri, punch puude alt, ühe käega chip).",
      "Kõik teised peavad KORDAMA täpselt sama lööki samast kohast.",
      "Kes EI SUUDA → saab tähe (H-O-R-S-E).",
      "Esimene kes kogunud HORSE — väljas!",
    ],
    scoring: "Eliminatsioon. Viimane püsti jääv mängija võidab.",
    bestFor: "Puhas loovus ja trick shot'id! Parim harjutusplatsil või rahulikul ringil.",
  },

  // ── Side Games ──
  {
    name: "Dots / Garbage / Trash", emoji: "🗑️", category: "side_game", players: "2-8",
    description: "Punktid saavutuste eest — sandy, greenie, chip-in...",
    howToPlay: [
      "Mängi ükskõik mis põhiformaadiga. Dots on KÕRVALMÄNG.",
      "Iga saavutuse eest saad +/- punkte:",
      "+1: Greenie (par-3 rajal GIR), Sandy (up-and-down bunkrist), Chip-in (chippides augus)",
      "+2: Birdie, Polie (3 par'i järjest)",
      "-1: Three-putt, Vesi (pall vette), OB",
      "Saavutusi saab kokkuleppel lisada/muuta.",
    ],
    scoring: "Kõrvalmängu punktid koondatakse kokku. Enim punkte (või vähem miinuseid) võidab Dots'i.",
    bestFor: "Isegi halval ringil saad Dots'is punkte! Sandy bunkrist = uhkuse asi. Parim kõrvalmäng.",
    tip: "Lisa grupi jaoks naljakaid kategooriaid: 'Viimane jogija' (-1 kui viimane puttist augus), 'Esimene jook baaris' (+2).",
  },
  {
    name: "Snake", emoji: "🐍", category: "side_game", players: "3-4",
    description: "Kes viimati 3-putt tegi, hoiab 'madu'",
    howToPlay: [
      "Lihtne kõrvalmäng: jälgi kes kolme-puttib.",
      "Esimene mängija kes teeb 3-putti → hoiab MADU.",
      "Madu jääb tema juurde KUNI keegi teine kolme-puttib → madu läheb edasi.",
      "18. augu lõpus: kes hoiab MADU, MAKSAB.",
    ],
    scoring: "Ainult viimane hoidja maksab. Summa kokkuleppel (nt joogid kõigile).",
    bestFor: "TOHUTU pinge viimastel aukudel kui sa hoiad madu. 4-jala putt 18. augul... käed värisevad.",
  },
  {
    name: "Rabbit", emoji: "🐰", category: "side_game", players: "3-4",
    description: "Püüa jänes — hoia teda 9. ja 18. augul",
    howToPlay: [
      "Auk 1: jänes on 'lahti'. Esimene mängija kes ÜKSI madalaima skoori teeb → püüab jänese.",
      "Jänes jääb tema juurde kuni keegi teine ÜKSI augu võidab → jänes läheb edasi.",
      "Viigid: jänes jääb paigale.",
      "Kes hoiab jänest 9. augu lõpus → võidab POOL potist.",
      "Uus jänes auk 10-l. Kes hoiab 18. augul → teine pool.",
    ],
    scoring: "Pott jagatakse pooleks: 9. augu hoidja ja 18. augu hoidja.",
    bestFor: "Lihtne side game mis lisab igale augule tähendust. Viigid ehitavad pinget!",
  },
  {
    name: "Banker", emoji: "🏦", category: "side_game", players: "3-4",
    description: "Roteeruv pankur — mängi üks kolme vastu",
    howToPlay: [
      "Iga augul on üks mängija 'PANKUR' (roteerub).",
      "Teised mängijad panevad panuse pankuri VASTU (kokkulepitud min/max piires).",
      "Iga matš (pankur vs panustaja) arvestatakse eraldi.",
      "Pankur võib SUURELT VÕITA (kogub kolmelt) või SUURELT KAOTADA (maksab kolmele).",
    ],
    scoring: "Iga matchup = eraldi skooride võrdlus. Net-skoor arvestatakse HCP alusel.",
    bestFor: "Kõrge varieeruvus — pankuri augul on palju mängus! Strateegilised panused lisavad sügavust.",
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  individual: "Individuaalne",
  team: "Tiim",
  fun: "Lõbus / Party",
  side_game: "Kõrvalmäng",
};

const CATEGORY_ICONS: Record<string, typeof User> = {
  individual: User,
  team: Users,
  fun: Dices,
  side_game: Target,
};

export default function FormatsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedFormat, setExpandedFormat] = useState<string | null>(null);

  const filtered = FORMATS.filter((f) => {
    const matchesSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["individual", "team", "fun", "side_game"];

  return (
    <div className="min-h-dvh bg-background">
      <div className="hero-gradient text-cream px-4 py-3 safe-area-top">
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-white/10 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-lg">Mänguformaadid</h1>
          </div>
          <Badge variant="secondary" className="text-xs">{FORMATS.length}</Badge>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Otsi formaati..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12 rounded-xl bg-card text-base"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`pill-btn shrink-0 ${!selectedCategory ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground"}`}
          >
            Kõik ({FORMATS.length})
          </button>
          {categories.map((cat) => {
            const count = FORMATS.filter((f) => f.category === cat).length;
            const Icon = CATEGORY_ICONS[cat];
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`pill-btn shrink-0 ${selectedCategory === cat ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground"}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {CATEGORY_LABELS[cat]} ({count})
              </button>
            );
          })}
        </div>

        {/* Format list */}
        <div className="space-y-2.5">
          {filtered.map((fmt, i) => {
            const isExpanded = expandedFormat === fmt.name;
            return (
              <motion.div
                key={fmt.name}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                layout
              >
                <div
                  className="premium-card overflow-hidden cursor-pointer"
                  onClick={() => setExpandedFormat(isExpanded ? null : fmt.name)}
                >
                  {/* Header */}
                  <div className="p-4 flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{fmt.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-[15px]">{fmt.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-snug">
                        {fmt.description}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px]">
                          {CATEGORY_LABELS[fmt.category]}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {fmt.players}
                        </Badge>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-1 text-muted-foreground"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </motion.div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
                          {/* How to play */}
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                              Kuidas mängida
                            </h4>
                            <ol className="space-y-1.5">
                              {fmt.howToPlay.map((step, si) => (
                                <li key={si} className="text-sm text-foreground/90 flex gap-2">
                                  <span className="text-primary/60 font-bold text-xs mt-0.5 shrink-0">
                                    {si + 1}.
                                  </span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>

                          {/* Scoring */}
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gold mb-2">
                              Punktiarvestus
                            </h4>
                            <p className="text-sm text-foreground/80">{fmt.scoring}</p>
                          </div>

                          {/* Example */}
                          {fmt.example && (
                            <div className="bg-muted/50 rounded-xl p-3">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                                Näide
                              </h4>
                              <p className="text-sm text-foreground/80 italic">{fmt.example}</p>
                            </div>
                          )}

                          {/* Best for */}
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-birdie mb-2">
                              Kellele sobib
                            </h4>
                            <p className="text-sm text-foreground/80">{fmt.bestFor}</p>
                          </div>

                          {/* Tip */}
                          {fmt.tip && (
                            <div className="bg-gold/8 border border-gold/20 rounded-xl p-3">
                              <p className="text-sm text-foreground/80">
                                <span className="font-bold">💡 Vihje: </span>
                                {fmt.tip}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">🔍</p>
            <p className="font-medium mt-2">Ei leidnud formaate</p>
            <p className="text-sm">Proovi teist otsisõna</p>
          </div>
        )}
      </div>
    </div>
  );
}
