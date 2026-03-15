// Wolf format engine
// 4-player format with rotating Wolf
// Wolf picks a partner or goes Lone Wolf
// Points per hole based on team result

import type {
  FormatEngine,
  PlayerScores,
  FormatLeaderboardEntry,
  HoleFormatResult,
  TeamDef,
} from './types';

interface WolfHoleDecision {
  hole: number;
  wolfId: string;
  partnerId?: string; // undefined = lone wolf
}

function getWolfForHole(
  hole: number,
  playerIds: string[],
  totalPlayers: number
): string {
  // Rotate wolf: player 0 is wolf on hole 1, player 1 on hole 2, etc.
  const idx = (hole - 1) % totalPlayers;
  return playerIds[idx];
}

export const engine: FormatEngine = {
  type: 'wolf',
  name: 'Wolf',
  emoji: '🐺',
  description: '4-player format: Wolf picks a partner or goes lone. Teams vary each hole.',
  isTeamFormat: false,
  sortDirection: 'desc',

  calculate(
    scores: PlayerScores[],
    holePars: number[],
    config: Record<string, unknown>,
    _teams?: TeamDef[]
  ): FormatLeaderboardEntry[] {
    const totalHoles = holePars.length;
    const playerIds = scores.map((ps) => ps.playerId);
    const numPlayers = playerIds.length;

    // Wolf decisions per hole (from config or auto-assigned)
    const decisions = Array.isArray(config.wolfDecisions)
      ? (config.wolfDecisions as WolfHoleDecision[])
      : [];

    // Point values
    const wolfWinPoints = typeof config.wolfWinPoints === 'number' ? config.wolfWinPoints : 2;
    const loneWolfMultiplier = typeof config.loneWolfMultiplier === 'number' ? config.loneWolfMultiplier : 2;
    const otherWinPoints = typeof config.otherWinPoints === 'number' ? config.otherWinPoints : 1;

    // Points accumulator
    const points: Record<string, number> = {};
    for (const ps of scores) {
      points[ps.playerId] = 0;
    }

    for (let h = 1; h <= totalHoles; h++) {
      const wolfId = getWolfForHole(h, playerIds, numPlayers);
      const decision = decisions.find((d) => d.hole === h);

      // Get scores for this hole
      const holeScores: Record<string, number> = {};
      for (const ps of scores) {
        const sc = ps.scores.find((s) => s.hole === h);
        if (sc) holeScores[ps.playerId] = sc.strokes;
      }

      // Not enough scores yet
      if (Object.keys(holeScores).length < 2) continue;

      const isLoneWolf = decision ? !decision.partnerId : false;
      const partnerId = decision?.partnerId;

      if (isLoneWolf) {
        // Lone wolf vs everyone else
        const wolfScore = holeScores[wolfId];
        if (wolfScore === undefined) continue;

        const otherIds = playerIds.filter((id) => id !== wolfId);
        const otherBest = Math.min(
          ...otherIds.map((id) => holeScores[id] ?? Infinity)
        );

        if (wolfScore < otherBest) {
          // Lone wolf wins
          points[wolfId] += wolfWinPoints * loneWolfMultiplier;
        } else if (wolfScore > otherBest) {
          // Others win
          for (const id of otherIds) {
            points[id] += otherWinPoints * loneWolfMultiplier;
          }
        }
        // Tie: no points
      } else if (partnerId) {
        // Wolf + partner vs other two
        const wolfTeam = [wolfId, partnerId];
        const otherTeam = playerIds.filter((id) => !wolfTeam.includes(id));

        const wolfBest = Math.min(
          ...wolfTeam.map((id) => holeScores[id] ?? Infinity)
        );
        const otherBest = Math.min(
          ...otherTeam.map((id) => holeScores[id] ?? Infinity)
        );

        if (wolfBest < otherBest) {
          for (const id of wolfTeam) points[id] += wolfWinPoints;
        } else if (otherBest < wolfBest) {
          for (const id of otherTeam) points[id] += otherWinPoints;
        }
      } else {
        // No decision recorded - default: wolf's best ball vs field best ball
        const wolfScore = holeScores[wolfId];
        if (wolfScore === undefined) continue;

        const otherBest = Math.min(
          ...playerIds
            .filter((id) => id !== wolfId)
            .map((id) => holeScores[id] ?? Infinity)
        );

        if (wolfScore < otherBest) {
          points[wolfId] += wolfWinPoints;
        } else if (wolfScore > otherBest) {
          for (const id of playerIds.filter((pid) => pid !== wolfId)) {
            if (holeScores[id] === otherBest) {
              points[id] += otherWinPoints;
            }
          }
        }
      }
    }

    const maxThru = Math.max(...scores.map((ps) => ps.scores.length), 0);

    return scores
      .map((ps) => ({
        playerId: ps.playerId,
        name: ps.playerName,
        emoji: ps.playerEmoji,
        value: points[ps.playerId],
        display: `${points[ps.playerId]} pts`,
        thru: maxThru,
      }))
      .sort((a, b) => b.value - a.value);
  },

  getHoleResult(
    holeNumber: number,
    scores: PlayerScores[],
    holePars: number[],
    config: Record<string, unknown>
  ): HoleFormatResult {
    const par = holePars[holeNumber - 1] ?? 0;
    const playerIds = scores.map((ps) => ps.playerId);
    const wolfId = getWolfForHole(holeNumber, playerIds, playerIds.length);
    const wolf = scores.find((ps) => ps.playerId === wolfId);

    const decisions = Array.isArray(config.wolfDecisions)
      ? (config.wolfDecisions as WolfHoleDecision[])
      : [];
    const decision = decisions.find((d) => d.hole === holeNumber);

    let detail = `Wolf: ${wolf?.playerName ?? '?'}`;
    if (decision?.partnerId) {
      const partner = scores.find((ps) => ps.playerId === decision.partnerId);
      detail += ` + ${partner?.playerName ?? '?'}`;
    } else if (decision && !decision.partnerId) {
      detail += ' (Lone Wolf!)';
    }

    return {
      label: `Par ${par}`,
      highlight: wolf?.playerName,
      detail,
    };
  },
};
