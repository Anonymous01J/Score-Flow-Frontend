// ─── Fixtures ────────────────────────────────────────────────────────────────

export interface Fixture {
  fixture_id: number;
  home_team: string;
  away_team: string;
  home_team_id: number;
  away_team_id: number;
  home_team_understat: string;
  away_team_understat: string;
  league: LeagueKey;
  match_date: string;
  status: FixtureStatus;
}

export type FixtureStatus =
  | "SCHEDULED"
  | "LIVE"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "POSTPONED"
  | "CANCELLED";

// ─── Ligas ────────────────────────────────────────────────────────────────────

export type LeagueKey = "premier_league" | "la_liga" | "champions_league";

export interface League {
  key: LeagueKey;
  name: string;
  country: string;
  season: number;
}

// ─── Predicciones ─────────────────────────────────────────────────────────────

export interface ScorelineProbability {
  home: number;
  away: number;
  probability: number;
}

export interface ValueBet {
  market: "1" | "X" | "2";
  model_prob: number;
  bookmaker_prob: number;
  edge: number;
}

export interface Prediction {
  fixture_id: number;
  home_team: string;
  away_team: string;
  league: LeagueKey;
  match_date: string;
  lambda_home: number;
  lambda_away: number;
  prob_home_win: number;
  prob_draw: number;
  prob_away_win: number;
  top_scorelines: ScorelineProbability[];
  sample_quality: "alta" | "media" | "baja";
  home_form_weight: number;
  away_form_weight: number;
  value_bets: ValueBet[];
  model_version: string;
  cached: boolean;
}

// ─── Favoritos ────────────────────────────────────────────────────────────────

export interface FavoriteFixture extends Fixture {
  savedAt: string;
}
