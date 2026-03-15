// Andmebaasi reatüübid

export interface Player {
  id: string;
  name: string;
  emoji: string;
  handicap: number | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  name: string;
  city: string | null;
  country: string;
  holes_count: 9 | 18;
  holes: CourseHole[];
  slope_rating: number | null;
  course_rating: number | null;
  created_at: string;
  created_by: string | null;
}

export interface CourseHole {
  hole: number;
  par: number;
  distance?: number;
  si?: number; // stroke index
}

export type TournamentStatus = "setup" | "active" | "completed";

export interface Tournament {
  id: string;
  name: string;
  share_code: string;
  status: TournamentStatus;
  course_id: string | null;
  course_name: string | null;
  holes_count: 9 | 18;
  hole_pars: number[];
  stroke_indices: number[] | null;
  use_flights: boolean;
  settings: TournamentSettings;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TournamentSettings {
  use_handicaps?: boolean;
  handicap_percentage?: number;
  tee_time?: string;
  notes?: string;
  message_tone?: "encouraging" | "funny" | "savage";
}

export type FlightType = "A" | "B" | null;

export interface TournamentPlayer {
  id: string;
  tournament_id: string;
  player_id: string;
  is_td: boolean;
  flight: FlightType;
  playing_handicap: number | null;
  joined_at: string;
  // Joined from players table
  player?: Player;
}

export interface Team {
  id: string;
  tournament_id: string;
  format_config_id: string | null;
  name: string;
  color: string | null;
  created_at: string;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  team_id: string;
  tournament_player_id: string;
  tournament_player?: TournamentPlayer;
}

export type FormatType =
  | "stroke_play"
  | "stableford"
  | "scramble"
  | "best_ball"
  | "skins"
  | "match_play"
  | "meat_grinder"
  | "nassau";

export interface FormatConfig {
  id: string;
  tournament_id: string;
  format_type: FormatType;
  display_name: string;
  is_primary: boolean;
  config: Record<string, unknown>;
  participant_filter: Record<string, unknown> | null;
  created_at: string;
}

export interface Score {
  id: string;
  tournament_id: string;
  tournament_player_id: string;
  hole_number: number;
  strokes: number;
  entered_by: string;
  entered_at: string;
  updated_at: string;
  client_timestamp: string | null;
  sync_id: string | null;
}

export interface FormatResult {
  id: string;
  tournament_id: string;
  format_config_id: string;
  tournament_player_id: string | null;
  team_id: string | null;
  results: Record<string, unknown>;
  position: number | null;
  calculated_at: string;
}

export interface Message {
  id: string;
  category: string;
  message: string;
  tone: "encouraging" | "funny" | "savage" | "neutral";
  is_default: boolean;
  created_at: string;
}
