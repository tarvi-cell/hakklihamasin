"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function JoinInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-fill code from URL ?code=XXXX
  const autoJoinDone = useRef(false);
  useEffect(() => {
    const urlCode = searchParams.get("code");
    if (urlCode && urlCode.length === 4 && !autoJoinDone.current) {
      autoJoinDone.current = true;
      const chars = urlCode.toUpperCase().split("");
      setCode(chars);
      // Delayed join to avoid calling before function is defined
      // Use async IIFE to handle join after state update
      const shareCode = chars.join("");
      (async () => {
        try {
          const playerData = JSON.parse(localStorage.getItem("hakklihamasin-player") || "{}");
          const res = await fetch("/api/tournaments/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              share_code: shareCode,
              player_id: playerData.id || crypto.randomUUID(),
              name: playerData.name || "Mängija",
              emoji: playerData.emoji || "🏌️",
            }),
          });
          const data = await res.json();
          if (res.ok && data.tournament_id) {
            router.push(`/tournament/${data.tournament_id}`);
          } else {
            setError(data.error || "Liitumine ebaõnnestus");
          }
        } catch { setError("Ühenduse viga"); }
      })();
    } else if (!autoJoinDone.current) {
      inputRefs.current[0]?.focus();
    }
  }, [searchParams]);

  const handleInput = (index: number, value: string) => {
    const char = value.toUpperCase().slice(-1);
    if (char && !/[23456789A-HJ-NP-Z]/.test(char)) return;

    const newCode = [...code];
    newCode[index] = char;
    setCode(newCode);
    setError("");

    if (char && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 filled
    if (char && index === 3 && newCode.every((c) => c)) {
      handleJoin(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = "";
      setCode(newCode);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .toUpperCase()
      .replace(/[^23456789A-HJ-NP-Z]/g, "")
      .slice(0, 4);

    if (pasted.length > 0) {
      const newCode = ["", "", "", ""];
      for (let i = 0; i < pasted.length; i++) {
        newCode[i] = pasted[i];
      }
      setCode(newCode);

      if (pasted.length === 4) {
        handleJoin(pasted);
      } else {
        inputRefs.current[pasted.length]?.focus();
      }
    }
  };

  const handleJoin = async (shareCode: string) => {
    try {
      const playerData = JSON.parse(
        localStorage.getItem("hakklihamasin-player") || "{}"
      );

      const res = await fetch("/api/tournaments/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          share_code: shareCode,
          player_id: playerData.id || crypto.randomUUID(),
          name: playerData.name || "Mängija",
          emoji: playerData.emoji || "🏌️",
          handicap: playerData.handicap ?? null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Liitumine ebaõnnestus");
        return;
      }

      router.push(`/tournament/${data.tournament_id}`);
    } catch {
      setError("Ühenduse viga. Proovi uuesti.");
    }
  };

  const fullCode = code.join("");

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-muted rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold">Liitu turniiriga</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center"
        >
          <div className="text-5xl mb-4">⛳</div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold mb-2">
            Sisesta kood
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            Küsi turniiri korraldajalt 4-täheline kood
          </p>

          <div className="flex gap-3 justify-center mb-4" onPaste={handlePaste}>
            {code.map((char, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                value={char}
                onChange={(e) => handleInput(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-16 h-20 text-center text-3xl font-bold rounded-xl border-2 bg-card
                           focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none
                           transition-all"
              />
            ))}
          </div>

          {error && (
            <motion.p
              initial={{ y: -5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-destructive text-sm mb-4"
            >
              {error}
            </motion.p>
          )}

          <Button
            onClick={() => handleJoin(fullCode)}
            disabled={fullCode.length < 4}
            className="w-full max-w-xs h-12 text-lg"
            size="lg"
          >
            Liitu 🏌️
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

export default function JoinTournament() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-dvh"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>}>
      <JoinInner />
    </Suspense>
  );
}
