// Nassau format engine
// Three sub-matches: front 9 (holes 1-9), back 9 (10-18), overall 18
// Each can be match play or stroke play

import type {
  FormatEngine,
  PlayerScores,
  FormatLeaderboardEntry,
  HoleFormatResult,
  TeamDef,
} from './types';

type SubMatchType = 'match' | 'stroke';

interface SubMatch {
  label: string;
  holes: number[];
  type: SubMatchType;
}

function computeStrokeResult(
  players: PlayerScores[],
  holes: number[],
  holePars: number[]
): { playerId: string; total: number }[] {
  return players.map((ps) => {
    let total = 0;
    for (const h of holes) {
      const sc = ps.scores.find((s) => s.hole === h);
      if (sc) total += sc.strokes;
    }
    return { playerId: ps.playerId, total };
  });
}

function computeMatchResult(
  players: PlayerScores[],
  holes: number[]
): { playerId: string; standing: number }[] {
  if (players.length !== 2) {
    // Round-robin for multiple players - return point totals
    const points: Record<string, number> = {};
    for (const ps of players) points[ps.playerId] = 0;

    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        let standing = 0;
        for (const h of holes) {
          const scA = players[i].scores.find((s) => s.hole === h);
          const scB = players[j].scores.find((s) => s.hole === h);
          if (!scA || !scB) continue;
          if (scA.strokes < scB.strokes) standing++;
          else if (scA.strokes > scB.strokes) standing--;
        }
        if (standing > 0) points[players[i].playerId]++;
        else if (standing < 0) points[players[j].playerId]++;
        else {
          points[players[i].playerId] += 0.5;
          points[players[j].playerId] += 0.5;
        }
      }
    }

    return players.map((ps) => ({
      playerId: ps.playerId,
      standing: points[ps.playerId],
    }));
  }

  // Two-player match
  let standing = 0;
  for (const h of holes) {
    const scA = players[0].scores.find((s) => s.hole === h);
    const scB = players[1].scores.find((s) => s.hole === h);
    if (!scA || !scB) continue;
    if (scA.strokes < scB.strokes) standing++;
    else if (scA.strokes > scB.strokes) standing--;
  }

  return [
    { playerId: players[0].playerId, standing },
    { playerId: players[1].playerId, standing: -standing },
  ];
}

function formatMatchStanding(standing: number): string {
  if (standing === 0) return 'AS';
  const lead = Math.abs(standing);
  return `${lead}${standing > 0 ? 'UP' : 'DN'}`;
}

export const engine: FormatEngine = {
  type: 'nassau',
  name: 'Nassau',
  emoji: '🎰',
  description: 'Three bets: front 9, back 9, and overall 18.',
  isTeamFormat: false,
  sortDirection: 'desc',

  calculate(
    scores: PlayerScores[],
    holePars: number[],
    config: Record<string, unknown>,
    _teams?: TeamDef[]
  ): FormatLeaderboardEntry[] {
    const subType: SubMatchType = config.subFormat === 'stroke' ? 'stroke' : 'match';
    const totalHoles = holePars.length;
    const frontHoles = Array.from({ length: Math.min(9, totalHoles) }, (_, i) => i + 1);
    const backHoles = totalHoles > 9
      ? Array.from({ length: totalHoles - 9 }, (_, i) => i + 10)
      : [];
    const allHoles = Array.from({ length: totalHoles }, (_, i) => i + 1);

    const subMatches: SubMatch[] = [
      { label: 'F9', holes: frontHoles, type: subType },
      ...(backHoles.length > 0 ? [{ label: 'B9', holes: backHoles, type: subType }] : []),
      { label: 'Tot', holes: allHoles, type: subType },
    ];

    // Calculate each sub-match
    const playerResults: Record<string, { parts: string[]; totalPoints: number }> = {};
    for (const ps of scores) {
      playerResults[ps.playerId] = { parts: [], totalPoints: 0 };
    }

    for (const sub of subMatches) {
      if (sub.type === 'match') {
        const results = computeMatchResult(scores, sub.holes);
        for (const r of results) {
          if (playerResults[r.playerId]) {
            playerResults[r.playerId].parts.push(
              `${sub.label}: ${formatMatchStanding(r.standing)}`
            );
            // Win = 1 point, halve = 0
            if (r.standing > 0) playerResults[r.playerId].totalPoints += 1;
          }
        }
      } else {
        const results = computeStrokeResult(scores, sub.holes, holePars);
        const sorted = [...results].sort((a, b) => a.total - b.total);
        const bestTotal = sorted[0]?.total ?? 0;

        for (const r of results) {
          if (playerResults[r.playerId]) {
            const diff = r.total - bestTotal;
            const label = diff === 0 ? 'W' : `+${diff}`;
            playerResults[r.playerId].parts.push(`${sub.label}: ${label}`);
            if (diff === 0) playerResults[r.playerId].totalPoints += 1;
          }
        }
      }
    }

    const maxThru = Math.max(...scores.map((ps) => ps.scores.length), 0);

    return scores
      .map((ps) => {
        const data = playerResults[ps.playerId];
        return {
          playerId: ps.playerId,
          name: ps.playerName,
          emoji: ps.playerEmoji,
          value: data.totalPoints,
          display: data.parts.join(' | '),
          thru: maxThru,
        };
      })
      .sort((a, b) => b.value - a.value);
  },

  getHoleResult(
    holeNumber: number,
    scores: PlayerScores[],
    holePars: number[],
    _config: Record<string, unknown>
  ): HoleFormatResult {
    const par = holePars[holeNumber - 1] ?? 0;
    const segment = holeNumber <= 9 ? 'Front 9' : 'Back 9';

    const holeScores = scores
      .map((ps) => {
        const sc = ps.scores.find((s) => s.hole === holeNumber);
        return sc ? { name: ps.playerName, strokes: sc.strokes } : null;
      })
      .filter(Boolean) as { name: string; strokes: number }[];

    if (holeScores.length < 2) return { label: `${segment} - Par ${par}` };

    const min = Math.min(...holeScores.map((h) => h.strokes));
    const winners = holeScores.filter((h) => h.strokes === min);

    return {
      label: segment,
      highlight: winners.length === 1 ? winners[0].name : undefined,
      detail: winners.length === 1
        ? `${winners[0].name} wins hole`
        : 'Halved',
    };
  },
};
