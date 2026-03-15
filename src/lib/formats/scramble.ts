// Scramble format engine
// Team format: one score per team per hole (all play from best position)

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
  type: 'scramble',
  name: 'Scramble',
  emoji: '🤝',
  description: 'Team format: everyone plays from the best shot each time. One team score per hole.',
  isTeamFormat: true,
  sortDirection: 'asc',

  calculate(
    scores: PlayerScores[],
    holePars: number[],
    config: Record<string, unknown>,
    teams?: TeamDef[]
  ): FormatLeaderboardEntry[] {
    if (!teams || teams.length === 0) return [];

    const totalHoles = holePars.length;

    return teams
      .map((team) => {
        // In scramble, only one player per team enters the score (the team score)
        // Use the first team member's scores as the team score,
        // or if config specifies a scorer, use that
        const teamPlayers = scores.filter((ps) => team.memberIds.includes(ps.playerId));

        let teamTotal = 0;
        let parTotal = 0;
        let holesCompleted = 0;

        for (let h = 1; h <= totalHoles; h++) {
          const par = holePars[h - 1] ?? 0;

          // In scramble, take the score that was entered for this hole
          // Since it's one team score, take the minimum if multiple entered
          // (typically only one person enters per team)
          let holeScore: number | null = null;

          for (const ps of teamPlayers) {
            const sc = ps.scores.find((s) => s.hole === h);
            if (sc) {
              if (holeScore === null || sc.strokes < holeScore) {
                holeScore = sc.strokes;
              }
            }
          }

          if (holeScore !== null) {
            teamTotal += holeScore;
            parTotal += par;
            holesCompleted++;
          }
        }

        const diff = teamTotal - parTotal;
        const relStr = formatRelative(diff);

        return {
          teamId: team.id,
          name: team.name,
          emoji: '🤝',
          value: teamTotal,
          display: `${teamTotal} (${relStr})`,
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

    // Find all scores for this hole
    const holeScores = scores
      .map((ps) => {
        const sc = ps.scores.find((s) => s.hole === holeNumber);
        return sc ? sc.strokes : null;
      })
      .filter((s): s is number => s !== null);

    if (holeScores.length === 0) return { label: `Par ${par}` };

    const teamScore = Math.min(...holeScores);
    const diff = teamScore - par;

    return {
      label: `${teamScore} (${formatRelative(diff)})`,
      detail: `Team score: ${teamScore}`,
    };
  },
};
