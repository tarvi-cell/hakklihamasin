// Stroke Play format engine
// Gross total strokes, net with handicap

import type {
  FormatEngine,
  PlayerScores,
  FormatLeaderboardEntry,
  HoleFormatResult,
  TeamDef,
} from './types';

function formatRelative(diff: number): string {
  if (diff === 0) return 'E';
  return diff > 0 ? `+${diff}` : `${diff}`;
}

export const engine: FormatEngine = {
  type: 'stroke_play',
  name: 'Stroke Play',
  emoji: '🏌️',
  description: 'Total strokes. Lowest score wins.',
  isTeamFormat: false,
  sortDirection: 'asc',

  calculate(
    scores: PlayerScores[],
    holePars: number[],
    config: Record<string, unknown>,
    _teams?: TeamDef[]
  ): FormatLeaderboardEntry[] {
    const useHandicaps = config.useHandicaps === true;
    const totalPar = holePars.reduce((s, p) => s + p, 0);

    return scores
      .map((ps) => {
        const thru = ps.scores.length;
        const grossTotal = ps.scores.reduce((s, sc) => s + sc.strokes, 0);

        // Calculate par for holes played
        const parPlayed = ps.scores.reduce((s, sc) => {
          const par = holePars[sc.hole - 1] ?? 0;
          return s + par;
        }, 0);

        const handicap =
          useHandicaps && typeof config.handicaps === 'object' && config.handicaps !== null
            ? (Number((config.handicaps as Record<string, number>)[ps.playerId]) || 0)
            : 0;

        const netTotal = grossTotal - handicap;
        const diff = netTotal - parPlayed;
        const relStr = formatRelative(diff);

        const display = useHandicaps
          ? `${netTotal} (${relStr})`
          : `${grossTotal} (${relStr})`;

        const detail = useHandicaps
          ? `Gross: ${grossTotal}, Hcp: ${handicap}`
          : undefined;

        return {
          playerId: ps.playerId,
          name: ps.playerName,
          emoji: ps.playerEmoji,
          value: useHandicaps ? netTotal : grossTotal,
          display,
          detail,
          thru,
        };
      })
      .sort((a, b) => a.value - b.value);
  },

  getHoleResult(
    holeNumber: number,
    scores: PlayerScores[],
    holePars: number[],
    _config: Record<string, unknown>
  ): HoleFormatResult {
    const par = holePars[holeNumber - 1] ?? 0;
    const holeScores = scores
      .map((ps) => {
        const sc = ps.scores.find((s) => s.hole === holeNumber);
        return sc ? { name: ps.playerName, strokes: sc.strokes } : null;
      })
      .filter(Boolean) as { name: string; strokes: number }[];

    if (holeScores.length === 0) return {};

    const best = Math.min(...holeScores.map((h) => h.strokes));
    const leaders = holeScores.filter((h) => h.strokes === best);
    const diff = best - par;

    return {
      label: `Par ${par}`,
      highlight: leaders.length === 1 ? leaders[0].name : undefined,
      detail: leaders.length === 1
        ? `${leaders[0].name}: ${best} (${formatRelative(diff)})`
        : `Tied at ${best}`,
    };
  },
};
