import { API_BASE_URL } from "./constants";
import type { Fixture, League, Prediction, LeagueKey } from "../types";

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${endpoint}`);
  return res.json();
}

export const api = {
  // Ligas disponibles
  getLeagues: (): Promise<{ leagues: League[] }> =>
    fetchAPI("/leagues"),

  // Partidos por liga y fecha
  getFixtures: (league: LeagueKey, date: string): Promise<Fixture[]> =>
    fetchAPI(`/fixtures?league=${league}&date=${date}`),

  // Predicción de un partido
  getPrediction: (
    fixtureId: number,
    league: LeagueKey,
    odds?: { home?: number; draw?: number; away?: number }
  ): Promise<Prediction> => {
    let url = `/predict/${fixtureId}?league=${league}`;
    if (odds?.home)  url += `&odds_home=${odds.home}`;
    if (odds?.draw)  url += `&odds_draw=${odds.draw}`;
    if (odds?.away)  url += `&odds_away=${odds.away}`;
    return fetchAPI(url);
  },

  /**
   * Busca los próximos N partidos de una liga iterando fechas desde hoy.
   * Solo incluye partidos con status programado (NS, TBD, SCHEDULED...).
   * Busca hasta maxDays días hacia adelante.
   */
  getUpcomingFixtures: async (
    league: LeagueKey,
    count: number = 5,
    maxDays: number = 30
  ): Promise<Fixture[]> => {
    const UPCOMING_STATUSES = ["NS", "TBD", "SCHED", "SCHEDULED", "NOT_STARTED"];
    const upcoming: Fixture[] = [];
    const base = new Date();

    for (let i = 0; i < maxDays && upcoming.length < count; i++) {
      const date = new Date(base);
      date.setDate(base.getDate() + i);
      const dateStr = formatDate(date);

      try {
        const fixtures = await fetchAPI<Fixture[]>(
          `/fixtures?league=${league}&date=${dateStr}`
        );
        const scheduled = fixtures.filter((f) =>
          UPCOMING_STATUSES.includes((f.status ?? "").toUpperCase())
        );
        upcoming.push(...scheduled);
      } catch {
        // Si falla un día, continuar
      }

      if (i < maxDays - 1 && upcoming.length < count) {
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    return upcoming.slice(0, count);
  },
};

// Formatea fecha a YYYY-MM-DD usando hora local (evita bug de timezone UTC)
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Fecha de hoy en hora local
export function today(): string {
  return formatDate(new Date());
}