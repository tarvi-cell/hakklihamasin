// Skins format engine
// Lowest unique score wins the skin on each hole
// Ties carry over to the next hole

import type {
  FormatEngine,
  PlayerScores,
  FormatLeaderboardEntry,
  HoleFormatResult,
  TeamDef,
} from './types';

interface SkinResult {
  hole: number;
  winnerId: string | null;
  winnerName: string | null;
  value: number; // accumulated carryover value
  carried: boolean;
}

function computeSkins(
  scores: PlayerScores[],
  holePars: number[],
  config: Record<string, unknown>
): SkinResult[] {
  const skinValue = typeof config.skinValue === 'number' ? config.skinValue : 1;
  const totalHoles = holePars.length;
  const results: SkinResult[] = [];
  let carryover = 0;

  for (let h = 1; h <= totalHoles; h++) {
    const holeScores: { playerId: string; playerName: string; strokes: number }[] = [];

    for (const ps of scores) {
      const sc = ps.scores.find((s) => s.hole === h);
      if (sc) {
        holeScores.push({
          playerId: ps.playerId,
          playerName: ps.playerName,
          strokes: sc.strokes,
        });
      }
    }

    carryover += skinValue;

    if (holeScores.length === 0) {
      results.push({ hole: h, winnerId: null, winnerName: null, value: carryover, carried: true });
      continue;
    }

    const minStrokes = Math.min(...holeScores.map((s) => s.strokes));
    const withMin = holeScores.filter((s) => s.strokes === minStrokes);

    if (withMin.length === 1) {
      // Unique lowest score wins
      results.push({
        hole: h,
        winnerId: withMin[0].playerId,
        winnerName: withMin[0].playerName,
        value: carryover,
        carried: false,
      });
      carryover = 0;
    } else {
      // Tie - skin carries over
      results.push({ hole: h, winnerId: null, winnerName: null, value: carryover, carried: true });
    }
  }

  return results;
}

export const engine: FormatEngine = {
  type: 'skins',
  name: 'Skins',
  emoji: '💰',
  description: 'Lowest unique score on each hole wins the skin. Ties carry over.',
  isTeamFormat: false,
  sortDirection: 'desc',

  calculate(
    scores: PlayerScores[],
    holePars: number[],
    config: Record<string, unknown>,
    _teams?: TeamDef[]
  ): FormatLeaderboardEntry[] {
    const skinValue = typeof config.skinValue === 'number' ? config.skinValue : 1;
    const results = computeSkins(scores, holePars, config);

    // Aggregate per player
    const playerSkins: Record<string, { count: number; totalValue: number }> = {};
    for (const ps of scores) {
      playerSkins[ps.playerId] = { count: 0, totalValue: 0 };
    }

    for (const r of results) {
      if (r.winnerId && playerSkins[r.winnerId]) {
        playerSkins[r.winnerId].count += 1;
        playerSkins[r.winnerId].totalValue += r.value;
      }
    }

    // Count carried-over skins still in the pot
    const lastResult = results[results.length - 1];
    const potValue = lastResult?.carried ? lastResult.value : 0;

    const maxThru = Math.max(...scores.map((ps) => ps.scores.length), 0);

    return scores
      .map((ps) => {
        const data = playerSkins[ps.playerId];
        const showMoney = skinValue > 1;
        const display = showMoney
          ? `${data.count} skins ($${data.totalValue})`
          : `${data.count} skins`;

        return {
          playerId: ps.playerId,
          name: ps.playerName,
          emoji: ps.playerEmoji,
          value: data.totalValue,
          display,
          detail: potValue > 0 ? `Pot: ${showMoney ? `$${potValue}` : `${potValue} carryover`}` : undefined,
          thru: maxThru,
        };
      })
      .sort((a, b) => b.value - a.value);
  },

  getHoleResult(
    holeNumber: number,
    scores: PlayerScores[],
    holePars: number[],
    config: Record<string, unknown>
  ): HoleFormatResult {
    const results = computeSkins(scores, holePars, config);
    const holeResult = results.find((r) => r.hole === holeNumber);

    if (!holeResult) return {};

    const skinValue = typeof config.skinValue === 'number' ? config.skinValue : 1;
    const showMoney = skinValue > 1;
    const valueStr = showMoney ? `$${holeResult.value}` : `${holeResult.value}`;

    if (holeResult.carried) {
      return {
        label: `Carryover (${valueStr} in pot)`,
        detail: 'Tied - skin carries over',
      };
    }

    return {
      label: `Skin won (${valueStr})`,
      highlight: holeResult.winnerName ?? undefined,
      detail: `${holeResult.winnerName} wins ${valueStr}`,
    };
  },
};
