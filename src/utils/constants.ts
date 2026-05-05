// URL base del proxy Vercel — cambia por tu URL real
export const API_BASE_URL = "https://scoreflow-backend.vercel.app/api";

export const LEAGUES = {
  premier_league: {
    key: "premier_league",
    name: "Premier League",
    country: "England",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    color: "#3d0066",
    accentColor: "#00d4ff",
  },
  la_liga: {
    key: "la_liga",
    name: "La Liga",
    country: "Spain",
    flag: "🇪🇸",
    color: "#c8102e",
    accentColor: "#ffd700",
  },
  bundesliga: {
    key: "bundesliga",
    name: "Bundesliga",
    country: "Germany",
    flag: "🇩🇪",
    color: "#d00000",
    accentColor: "#ffcc00",
  },
  serie_a: {
    key: "serie_a",
    name: "Serie A",
    country: "Italy",
    flag: "🇮🇹",
    color: "#003087",
    accentColor: "#009246",
  },
  ligue_1: {
    key: "ligue_1",
    name: "Ligue 1",
    country: "France",
    flag: "🇫🇷",
    color: "#002395",
    accentColor: "#ed2939",
  },
  champions_league: {
    key: "champions_league",
    name: "Champions League",
    country: "Europe",
    flag: "🇪🇺",
    color: "#001489",
    accentColor: "#ffffff",
  },
} as const;

export const QUALITY_LABELS = {
  alta:  { label: "Alta confianza",  color: "#22c55e" },
  media: { label: "Media confianza", color: "#f59e0b" },
  baja:  { label: "Baja confianza",  color: "#ef4444" },
};

export const MARKET_LABELS: Record<string, string> = {
  "1":        "Local gana",
  "X":        "Empate",
  "2":        "Visitante gana",
  "btts":     "Ambos marcan",
  "over_25":  "Más de 2.5 goles",
  "under_25": "Menos de 2.5 goles",
};
