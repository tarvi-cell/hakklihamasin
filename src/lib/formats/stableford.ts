// Stableford format engine
// Standard and Modified scoring variants

import type {
  FormatEngine,
  PlayerScores,
  FormatLeaderboardEntry,
  HoleFormatResult,
  TeamDef,
} from './types';

// Standard Stableford points
function standardPoints(strokes: number, par: number): number {
  const diff = strokes - par;
  if (diff <= -3) return 5; // albatross or better
  if (diff === -2) return 4; // eagle
  if (diff === -1) return 3; // birdie
  if (diff === 0) return 2;  // par
  if (diff === 1) return 1;  // bogey
  return 0;                   // double bogey+
}

// Modified Stableford points (rewards birdies+, punishes bogeys+)
function modifiedPoints(strokes: number, par: number): number {
  const diff = strokes - par;
  if (diff <= -3) return 8;  // albatross or better
  if (diff === -2) return 5; // eagle
  if (diff === -1) return 2; // birdie
  if (diff === 0) return 0;  // par
  if (diff === 1) return -1; // bogey
  return -3;                  // double bogey+
}

export const engine: FormatEngine = {
  type: 'stableford',
  name: 'Stableford',
  emoji: '⭐',
  description: 'Points per hole based on score relative to par. Highest points wins.',
  isTeamFormat: false,
  sortDirection: 'desc',

  calculate(
    scores: PlayerScores[],
    holePars: number[],
    config: Record<string, unknown>,
    _teams?: TeamDef[]
  ): FormatLeaderboardEntry[] {
    const variant = config.variant === 'modified' ? 'modified' : 'standard';
    const pointsFn = variant === 'modified' ? modifiedPoints : standardPoints;

    return scores
      .map((ps) => {
        const thru = ps.scores.length;
        let totalPoints = 0;

        for (const sc of ps.scores) {
          const par = holePars[sc.hole - 1] ?? 0;
          if (par > 0) {
            totalPoints += pointsFn(sc.strokes, par);
          }
        }

        return {
          playerId: ps.playerId,
          name: ps.playerName,
          emoji: ps.playerEmoji,
          value: totalPoints,
          display: `${totalPoints} pts`,
          detail: variant === 'modified' ? 'Modified Stableford' : undefined,
          thru,
        };
      })
      .sort((a, b) => b.value - a.value); // highest first
  },

  getHoleResult(
    holeNumber: number,
    scores: PlayerScores[],
    holePars: number[],
    config: Record<string, unknown>
  ): HoleFormatResult {
    const par = holePars[holeNumber - 1] ?? 0;
    if (par === 0) return {};

    const variant = config.variant === 'modified' ? 'modified' : 'standard';
    const pointsFn = variant === 'modified' ? modifiedPoints : standardPoints;

    const results = scores
      .map((ps) => {
        const sc = ps.scores.find((s) => s.hole === holeNumber);
        if (!sc) return null;
        return {
          name: ps.playerName,
          strokes: sc.strokes,
          points: pointsFn(sc.strokes, par),
        };
      })
      .filter(Boolean) as { name: string; strokes: number; points: number }[];

    if (results.length === 0) return {};

    const best = Math.max(...results.map((r) => r.points));
    const leaders = results.filter((r) => r.points === best);

    return {
      label: `Par ${par}`,
      highlight: leaders.length === 1 ? leaders[0].name : undefined,
      detail: results.map((r) => `${r.name}: ${r.points} pts`).join(', '),
    };
  },
};
