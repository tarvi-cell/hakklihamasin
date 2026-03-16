-- ============================================================
-- HAKKLIHAMASIN - Golf Tournament App
-- Schema: golf (eraldi skeem nagu haldus, maade, ollipere)
-- ============================================================

CREATE SCHEMA IF NOT EXISTS golf;

-- ============================================================
-- PLAYERS (linked to anonymous auth)
-- ============================================================
CREATE TABLE golf.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🏌️',
  handicap NUMERIC(4,1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TOURNAMENTS
-- ============================================================
CREATE TABLE golf.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  share_code CHAR(4) NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'completed')),
  course_name TEXT,
  holes_count SMALLINT NOT NULL DEFAULT 18 CHECK (holes_count IN (9, 18)),
  hole_pars SMALLINT[] NOT NULL,
  stroke_indices SMALLINT[],
  use_flights BOOLEAN DEFAULT FALSE,
  formats TEXT[] NOT NULL DEFAULT '{stroke_play}',
  settings JSONB DEFAULT '{}',
  created_by UUID REFERENCES golf.players(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_golf_tournaments_share_code ON golf.tournaments(share_code);
CREATE INDEX idx_golf_tournaments_status ON golf.tournaments(status);

-- ============================================================
-- TOURNAMENT PLAYERS
-- ============================================================
CREATE TABLE golf.tournament_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES golf.tournaments(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES golf.players(id),
  is_td BOOLEAN DEFAULT FALSE,
  flight TEXT CHECK (flight IN ('A', 'B')),
  playing_handicap NUMERIC(4,1),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, player_id)
);

CREATE INDEX idx_golf_tp_tournament ON golf.tournament_players(tournament_id);
CREATE INDEX idx_golf_tp_player ON golf.tournament_players(player_id);

-- ============================================================
-- SCORES (one row per player per hole)
-- UPSERT pattern: ON CONFLICT (tournament_id, player_id, hole_number) DO UPDATE
-- ============================================================
CREATE TABLE golf.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES golf.tournaments(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES golf.players(id),
  hole_number SMALLINT NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
  strokes SMALLINT NOT NULL CHECK (strokes BETWEEN 1 AND 20),
  entered_by UUID REFERENCES golf.players(id),
  sync_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, player_id, hole_number)
);

CREATE INDEX idx_golf_scores_tournament ON golf.scores(tournament_id);
CREATE INDEX idx_golf_scores_player ON golf.scores(player_id);
CREATE INDEX idx_golf_scores_sync ON golf.scores(sync_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- Permissiivne: anonymous auth, kõik saavad lugeda/kirjutada
-- App logic kontrollib TD õigusi, mitte RLS
-- ============================================================
ALTER TABLE golf.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE golf.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE golf.tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE golf.scores ENABLE ROW LEVEL SECURITY;

-- Read: kõik autenditud kasutajad
CREATE POLICY "golf_players_select" ON golf.players FOR SELECT USING (true);
CREATE POLICY "golf_players_insert" ON golf.players FOR INSERT WITH CHECK (true);
CREATE POLICY "golf_players_update" ON golf.players FOR UPDATE USING (true);

CREATE POLICY "golf_tournaments_select" ON golf.tournaments FOR SELECT USING (true);
CREATE POLICY "golf_tournaments_insert" ON golf.tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "golf_tournaments_update" ON golf.tournaments FOR UPDATE USING (true);

CREATE POLICY "golf_tp_select" ON golf.tournament_players FOR SELECT USING (true);
CREATE POLICY "golf_tp_insert" ON golf.tournament_players FOR INSERT WITH CHECK (true);
CREATE POLICY "golf_tp_delete" ON golf.tournament_players FOR DELETE USING (true);

CREATE POLICY "golf_scores_select" ON golf.scores FOR SELECT USING (true);
CREATE POLICY "golf_scores_insert" ON golf.scores FOR INSERT WITH CHECK (true);
CREATE POLICY "golf_scores_update" ON golf.scores FOR UPDATE USING (true);

-- ============================================================
-- REALTIME: Enable for scores (live sync between devices)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE golf.scores;
ALTER PUBLICATION supabase_realtime ADD TABLE golf.tournament_players;

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION golf.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_golf_players_updated
  BEFORE UPDATE ON golf.players
  FOR EACH ROW EXECUTE FUNCTION golf.update_updated_at();

CREATE TRIGGER trg_golf_tournaments_updated
  BEFORE UPDATE ON golf.tournaments
  FOR EACH ROW EXECUTE FUNCTION golf.update_updated_at();

CREATE TRIGGER trg_golf_scores_updated
  BEFORE UPDATE ON golf.scores
  FOR EACH ROW EXECUTE FUNCTION golf.update_updated_at();
