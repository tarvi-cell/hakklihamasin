// Quota (Point Quota) format engine
// Each player's quota = 36 - handicap
// Points: bogey=1, par=2, birdie=4, eagle=8
// Result = points earned - quota

import type {
  FormatEngine,
  PlayerScores,
  FormatLeaderboardEntry,
  HoleFormatResult,
  TeamDef,
} from './types';

function quotaPoints(strokes: number, par: number): number {
  const diff = strokes - par;
  if (diff <= -3) return 16; // albatross or better
  if (diff === -2) return 8; // eagle
  if (diff === -1) return 4; // birdie
  if (diff === 0) return 2;  // par
  if (diff === 1) return 1;  // bogey
  return 0;                   // double bogey+
}

function formatResult(value: number): string {
  if (value === 0) return 'E';
  return value > 0 ? `+${value}` : `${value}`;
}

export const engine: FormatEngine = {
  type: 'quota',
  name: 'Quota',
  emoji: '📊',
  description: 'Beat your quota (36 - handicap). Points: bogey=1, par=2, birdie=4, eagle=8.',
  isTeamFormat: false,
  sortDirection: 'desc',

  calculate(
    scores: PlayerScores[],
    holePars: number[],
    config: Record<string, unknown>,
    _teams?: TeamDef[]
  ): FormatLeaderboardEntry[] {
    // Handicaps can be passed in config
    const handicaps =
      typeof config.handicaps === 'object' && config.handicaps !== null
        ? (config.handicaps as Record<string, number>)
        : {};

    return scores
      .map((ps) => {
        const handicap = Number(handicaps[ps.playerId]) || 0;
        const quota = 36 - handicap;
        const thru = ps.scores.length;

        let totalPoints = 0;
        for (const sc of ps.scores) {
          const par = holePars[sc.hole - 1] ?? 0;
          if (par > 0) {
            totalPoints += quotaPoints(sc.strokes, par);
          }
        }

        const result = totalPoints - quota;

        return {
          playerId: ps.playerId,
          name: ps.playerName,
          emoji: ps.playerEmoji,
          value: result,
          display: formatResult(result),
          detail: `${totalPoints} pts, Quota: ${quota} (Hcp: ${handicap})`,
          thru,
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
    if (par === 0) return {};

    const results = scores
      .map((ps) => {
        const sc = ps.scores.find((s) => s.hole === holeNumber);
        if (!sc) return null;
        return {
          name: ps.playerName,
          strokes: sc.strokes,
          points: quotaPoints(sc.strokes, par),
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
