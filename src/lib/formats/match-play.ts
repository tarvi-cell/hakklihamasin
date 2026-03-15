// Match Play format engine
// Head-to-head or round-robin: each hole won/lost/halved

import type {
  FormatEngine,
  PlayerScores,
  FormatLeaderboardEntry,
  HoleFormatResult,
  TeamDef,
} from './types';

interface MatchResult {
  playerAId: string;
  playerBId: string;
  playerAName: string;
  playerBName: string;
  holesPlayed: number;
  holesRemaining: number;
  // Positive = A leads, negative = B leads
  standing: number;
  closed: boolean;
  closedResult?: string; // "3&2" etc.
}

function computeMatch(
  playerA: PlayerScores,
  playerB: PlayerScores,
  holePars: number[],
  totalHoles: number
): MatchResult {
  let standing = 0;
  const allHoles = new Set([
    ...playerA.scores.map((s) => s.hole),
    ...playerB.scores.map((s) => s.hole),
  ]);

  const playedHoles: number[] = [];

  for (let h = 1; h <= totalHoles; h++) {
    const scA = playerA.scores.find((s) => s.hole === h);
    const scB = playerB.scores.find((s) => s.hole === h);
    if (!scA || !scB) continue;

    playedHoles.push(h);
    if (scA.strokes < scB.strokes) standing += 1;
    else if (scA.strokes > scB.strokes) standing -= 1;
    // else halved
  }

  const holesPlayed = playedHoles.length;
  const holesRemaining = totalHoles - holesPlayed;
  const lead = Math.abs(standing);

  // Check for early close: lead > remaining holes
  const closed = lead > holesRemaining && holesRemaining > 0;
  let closedResult: string | undefined;
  if (closed) {
    closedResult = `${lead}&${holesRemaining}`;
  } else if (holesRemaining === 0 && lead > 0) {
    // Match complete with a winner
    closedResult = `${lead} UP`;
  }

  return {
    playerAId: playerA.playerId,
    playerBId: playerB.playerId,
    playerAName: playerA.playerName,
    playerBName: playerB.playerName,
    holesPlayed,
    holesRemaining,
    standing,
    closed,
    closedResult,
  };
}

function formatStanding(standing: number): string {
  if (standing === 0) return 'AS';
  const lead = Math.abs(standing);
  return `${lead} ${standing > 0 ? 'UP' : 'DN'}`;
}

export const engine: FormatEngine = {
  type: 'match_play',
  name: 'Match Play',
  emoji: '⚔️',
  description: 'Head-to-head: win each hole individually. Most holes won wins the match.',
  isTeamFormat: false,
  sortDirection: 'desc',

  calculate(
    scores: PlayerScores[],
    holePars: number[],
    config: Record<string, unknown>,
    _teams?: TeamDef[]
  ): FormatLeaderboardEntry[] {
    const totalHoles = holePars.length;

    if (scores.length === 2) {
      // Simple head-to-head
      const match = computeMatch(scores[0], scores[1], holePars, totalHoles);
      const results: FormatLeaderboardEntry[] = [];

      for (const ps of scores) {
        const isA = ps.playerId === match.playerAId;
        const myStanding = isA ? match.standing : -match.standing;

        let display: string;
        if (match.closed || match.holesRemaining === 0) {
          if (myStanding > 0) {
            display = match.closedResult ?? formatStanding(myStanding);
          } else if (myStanding < 0) {
            display = match.closedResult
              ? `Lost ${match.closedResult}`
              : formatStanding(myStanding);
          } else {
            display = 'AS';
          }
        } else {
          display = formatStanding(myStanding);
        }

        results.push({
          playerId: ps.playerId,
          name: ps.playerName,
          emoji: ps.playerEmoji,
          value: myStanding,
          display,
          thru: match.holesPlayed,
        });
      }

      return results.sort((a, b) => b.value - a.value);
    }

    // Round-robin: all pairings
    const wins: Record<string, number> = {};
    const losses: Record<string, number> = {};
    const halves: Record<string, number> = {};

    for (const ps of scores) {
      wins[ps.playerId] = 0;
      losses[ps.playerId] = 0;
      halves[ps.playerId] = 0;
    }

    for (let i = 0; i < scores.length; i++) {
      for (let j = i + 1; j < scores.length; j++) {
        const match = computeMatch(scores[i], scores[j], holePars, totalHoles);
        if (match.standing > 0) {
          wins[scores[i].playerId] += 1;
          losses[scores[j].playerId] += 1;
        } else if (match.standing < 0) {
          losses[scores[i].playerId] += 1;
          wins[scores[j].playerId] += 1;
        } else {
          halves[scores[i].playerId] += 1;
          halves[scores[j].playerId] += 1;
        }
      }
    }

    const maxThru = Math.max(...scores.map((ps) => ps.scores.length), 0);

    return scores
      .map((ps) => {
        const w = wins[ps.playerId];
        const l = losses[ps.playerId];
        const h = halves[ps.playerId];
        // Points: win=1, halve=0.5, loss=0
        const points = w + h * 0.5;

        return {
          playerId: ps.playerId,
          name: ps.playerName,
          emoji: ps.playerEmoji,
          value: points,
          display: `${w}W-${l}L-${h}H`,
          detail: `${points} pts`,
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

    const holeScores = scores
      .map((ps) => {
        const sc = ps.scores.find((s) => s.hole === holeNumber);
        return sc ? { name: ps.playerName, strokes: sc.strokes } : null;
      })
      .filter(Boolean) as { name: string; strokes: number }[];

    if (holeScores.length < 2) return { label: `Par ${par}` };

    const min = Math.min(...holeScores.map((h) => h.strokes));
    const winners = holeScores.filter((h) => h.strokes === min);

    if (winners.length === 1) {
      return {
        label: 'Won',
        highlight: winners[0].name,
        detail: `${winners[0].name} wins hole with ${min}`,
      };
    }

    return {
      label: 'Halved',
      detail: `Tied at ${min}`,
    };
  },
};
