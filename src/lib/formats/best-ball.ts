// Best Ball (Four Ball) format engine
// Team format: lowest individual score on each hole = team score
// Configurable: best 1-of-2, best 2-of-4, etc.

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
  type: 'best_ball',
  name: 'Best Ball',
  emoji: '🎯',
  description: 'Team format: best individual score on each hole counts as team score.',
  isTeamFormat: true,
  sortDirection: 'asc',

  calculate(
    scores: PlayerScores[],
    holePars: number[],
    config: Record<string, unknown>,
    teams?: TeamDef[]
  ): FormatLeaderboardEntry[] {
    if (!teams || teams.length === 0) return [];

    // How many best scores to count per hole (default: 1)
    const bestCount = typeof config.bestCount === 'number' ? config.bestCount : 1;
    const totalHoles = holePars.length;

    return teams
      .map((team) => {
        const teamPlayers = scores.filter((ps) => team.memberIds.includes(ps.playerId));
        let teamTotal = 0;
        let parTotal = 0;
        let holesCompleted = 0;

        for (let h = 1; h <= totalHoles; h++) {
          const par = holePars[h - 1] ?? 0;
          const holeStrokes: number[] = [];

          for (const ps of teamPlayers) {
            const sc = ps.scores.find((s) => s.hole === h);
            if (sc) holeStrokes.push(sc.strokes);
          }

          if (holeStrokes.length === 0) continue;

          holesCompleted++;
          parTotal += par;

          // Sort ascending, take best N scores
          holeStrokes.sort((a, b) => a - b);
          const count = Math.min(bestCount, holeStrokes.length);
          for (let i = 0; i < count; i++) {
            teamTotal += holeStrokes[i];
          }

          if (bestCount > 1) {
            parTotal += par * (count - 1); // adjust par for multiple balls
          }
        }

        // Recalculate parTotal properly for bestCount > 1
        if (bestCount > 1) {
          parTotal = 0;
          for (let h = 1; h <= totalHoles; h++) {
            const par = holePars[h - 1] ?? 0;
            const holeStrokes: number[] = [];
            for (const ps of teamPlayers) {
              const sc = ps.scores.find((s) => s.hole === h);
              if (sc) holeStrokes.push(sc.strokes);
            }
            if (holeStrokes.length === 0) continue;
            const count = Math.min(bestCount, holeStrokes.length);
            parTotal += par * count;
          }
        }

        const diff = teamTotal - parTotal;
        const relStr = formatRelative(diff);
        const countLabel = bestCount > 1 ? ` (best ${bestCount})` : '';

        return {
          teamId: team.id,
          name: team.name,
          emoji: '👥',
          value: teamTotal,
          display: `${teamTotal} (${relStr})`,
          detail: `Best ball${countLabel}`,
          thru: holesCompleted,
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
    const winner = holeScores.find((h) => h.strokes === best);
    const diff = best - par;

    return {
      label: `Best: ${best} (${formatRelative(diff)})`,
      highlight: winner?.name,
      detail: `${winner?.name} with ${best}`,
    };
  },
};
