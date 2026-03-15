// Skoori arvutused

export type ScoreName =
  | "ace"
  | "albatross"
  | "eagle"
  | "birdie"
  | "par"
  | "bogey"
  | "double_bogey"
  | "triple_plus";

export function getScoreName(strokes: number, par: number): ScoreName {
  if (strokes === 1) return "ace";
  const diff = strokes - par;
  if (diff <= -3) return "albatross";
  if (diff === -2) return "eagle";
  if (diff === -1) return "birdie";
  if (diff === 0) return "par";
  if (diff === 1) return "bogey";
  if (diff === 2) return "double_bogey";
  return "triple_plus";
}

export function getScoreLabel(name: ScoreName): string {
  const labels: Record<ScoreName, string> = {
    ace: "Hole-in-One!",
    albatross: "Albatross",
    eagle: "Eagle",
    birdie: "Birdie",
    par: "Par",
    bogey: "Bogey",
    double_bogey: "Double Bogey",
    triple_plus: "Triple+",
  };
  return labels[name];
}

export function getScoreEmoji(name: ScoreName): string {
  const emojis: Record<ScoreName, string> = {
    ace: "🏆",
    albatross: "🦅🦅",
    eagle: "🦅",
    birdie: "🐦",
    par: "⛳",
    bogey: "😤",
    double_bogey: "😬",
    triple_plus: "💀",
  };
  return emojis[name];
}

export function getScoreColorClass(name: ScoreName): string {
  const classes: Record<ScoreName, string> = {
    ace: "score-ace",
    albatross: "score-eagle",
    eagle: "score-eagle",
    birdie: "score-birdie",
    par: "score-par",
    bogey: "score-bogey",
    double_bogey: "score-double",
    triple_plus: "score-triple",
  };
  return classes[name];
}

export function formatRelativeScore(strokes: number, par: number): string {
  const diff = strokes - par;
  if (diff === 0) return "E";
  return diff > 0 ? `+${diff}` : `${diff}`;
}

export function formatTotalRelativeScore(
  scores: { strokes: number; par: number }[]
): string {
  if (scores.length === 0) return "E";
  const total = scores.reduce((sum, s) => sum + (s.strokes - s.par), 0);
  if (total === 0) return "E";
  return total > 0 ? `+${total}` : `${total}`;
}

export function calculateStablefordPoints(
  strokes: number,
  par: number,
  handicapStrokes: number = 0
): number {
  const netStrokes = strokes - handicapStrokes;
  const diff = netStrokes - par;
  if (diff <= -3) return 5; // albatross+
  if (diff === -2) return 4; // eagle
  if (diff === -1) return 3; // birdie
  if (diff === 0) return 2; // par
  if (diff === 1) return 1; // bogey
  return 0; // double bogey+
}
