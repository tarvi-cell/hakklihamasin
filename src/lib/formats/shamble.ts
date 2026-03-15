// Shamble format engine
// All players tee off, team picks best drive, then individual play from there
// Team's best individual score on each hole counts

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
  type: 'shamble',
  name: 'Shamble',
  emoji: '🔀',
  description: 'Pick best drive, then individual play. Best individual score counts for team.',
  isTeamFormat: true,
  sortDirection: 'asc',

  calculate(
    scores: PlayerScores[],
    holePars: number[],
    config: Record<string, unknown>,
    teams?: TeamDef[]
  ): FormatLeaderboardEntry[] {
    if (!teams || teams.length === 0) return [];

    // How many best scores count per hole (default: 1, like best ball after the drive)
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
          holeStrokes.sort((a, b) => a - b);
          const count = Math.min(bestCount, holeStrokes.length);

          for (let i = 0; i < count; i++) {
            teamTotal += holeStrokes[i];
          }
          parTotal += par * count;
        }

        const diff = teamTotal - parTotal;
        const relStr = formatRelative(diff);

        return {
          teamId: team.id,
          name: team.name,
          emoji: '🔀',
          value: teamTotal,
          display: `${teamTotal} (${relStr})`,
          detail: bestCount > 1 ? `Best ${bestCount} of ${team.memberIds.length}` : undefined,
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
      detail: `${winner?.name} with ${best} from shared drive`,
    };
  },
};
