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

export type LeagueKey =
  | "premier_league"
  | "la_liga"
  | "bundesliga"
  | "serie_a"
  | "ligue_1"
  | "champions_league";

export interface League {
  key: LeagueKey;
  name: string;
  country: string;
  season: number;
}

// ─── Predicciones V2 ──────────────────────────────────────────────────────────

export interface ScorelineProbability {
  home: number;
  away: number;
  probability: number;
}

export type MarketKey = "1" | "X" | "2" | "btts" | "over_25" | "under_25";

export interface ValueBet {
  market: MarketKey;
  model_prob: number;
  bookmaker_prob: number;
  edge: number;
}

export interface H2HSummary {
  total_matches: number;
  home_wins: number;
  draws: number;
  away_wins: number;
  avg_goals_home: number;
  avg_goals_away: number;
}

export interface Prediction {
  fixture_id: number;
  home_team: string;
  away_team: string;
  league: LeagueKey;
  match_date: string;

  // Lambdas
  lambda_home: number;
  lambda_away: number;
  expected_goals_total: number;

  // Elo
  elo_home: number;
  elo_away: number;
  elo_adjustment: number;
  h2h_adjustment: number;
  h2h_available: boolean;
  h2h_summary: H2HSummary | null;

  // 1X2
  prob_home_win: number;
  prob_draw: number;
  prob_away_win: number;

  // Mercados V2
  prob_btts: number;
  prob_over_25: number;
  prob_under_25: number;

  // Marcadores
  top_scorelines: ScorelineProbability[];

  // Confianza
  sample_quality: "alta" | "media" | "baja";
  home_form_weight: number;
  away_form_weight: number;

  // Value bets
  value_bets: ValueBet[];

  model_version: string;
  cached: boolean;
}

// ─── Favoritos ────────────────────────────────────────────────────────────────

export interface FavoriteFixture extends Fixture {
  savedAt: string;
}
