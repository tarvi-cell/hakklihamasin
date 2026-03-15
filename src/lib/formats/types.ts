// Format engine type definitions

export interface PlayerScores {
  playerId: string;
  playerName: string;
  playerEmoji: string;
  scores: { hole: number; strokes: number }[];
}

export interface TeamDef {
  id: string;
  name: string;
  memberIds: string[];
}

export interface FormatLeaderboardEntry {
  playerId?: string;
  teamId?: string;
  name: string;
  emoji: string;
  value: number;
  display: string;
  detail?: string;
  thru: number;
}

export interface HoleFormatResult {
  label?: string;
  highlight?: string;
  detail?: string;
}

export interface FormatEngine {
  type: string;
  name: string;
  emoji: string;
  description: string;
  isTeamFormat: boolean;
  sortDirection: 'asc' | 'desc';

  calculate(
    scores: PlayerScores[],
    holePars: number[],
    config: Record<string, unknown>,
    teams?: TeamDef[]
  ): FormatLeaderboardEntry[];

  getHoleResult(
    holeNumber: number,
    scores: PlayerScores[],
    holePars: number[],
    config: Record<string, unknown>
  ): HoleFormatResult;
}
