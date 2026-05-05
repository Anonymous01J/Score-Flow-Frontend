import { API_BASE_URL } from "./constants";
import type { Fixture, League, Prediction, LeagueKey } from "../types";

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${endpoint}`);
  return res.json();
}

// ─── Odds V2: todos los mercados ──────────────────────────────────────────────

export interface OddsInput {
  home?: number;
  draw?: number;
  away?: number;
  btts?: number;
  over_25?: number;
  under_25?: number;
}

export const api = {
  // Ligas disponibles
  getLeagues: (): Promise<{ leagues: League[] }> =>
    fetchAPI("/leagues"),

  // Partidos por liga y fecha
  getFixtures: (league: LeagueKey, date: string): Promise<Fixture[]> =>
    fetchAPI(`/fixtures?league=${league}&date=${date}`),

  // Predicción completa V2
  getPrediction: (
    fixtureId: number,
    league: LeagueKey,
    odds?: OddsInput,
  ): Promise<Prediction> => {
    const params = new URLSearchParams({ league });
    if (odds?.home)     params.append("odds_home",     String(odds.home));
    if (odds?.draw)     params.append("odds_draw",     String(odds.draw));
    if (odds?.away)     params.append("odds_away",     String(odds.away));
    if (odds?.btts)     params.append("odds_btts",     String(odds.btts));
    if (odds?.over_25)  params.append("odds_over_25",  String(odds.over_25));
    if (odds?.under_25) params.append("odds_under_25", String(odds.under_25));
    return fetchAPI(`/predict/${fixtureId}?${params.toString()}`);
  },

  /**
   * Busca partidos programados de la semana actual (7 días desde hoy).
   * Lanza todas las peticiones en paralelo y agrupa los resultados por fecha.
   * Retorna máximo `count` partidos ordenados por fecha ascendente.
   */
  getUpcomingFixtures: async (
    league: LeagueKey,
    count: number = 5,
  ): Promise<Fixture[]> => {
    const UPCOMING_STATUSES = ["NS", "TBD", "SCHED", "SCHEDULED", "NOT_STARTED"];
    const base = new Date();

    // Generar las fechas de los próximos 7 días (hoy incluido)
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return formatDate(d);
    });

    // Lanzar todas las peticiones en paralelo
    const results = await Promise.allSettled(
      dates.map((dateStr) =>
        fetchAPI<Fixture[]>(`/fixtures?league=${league}&date=${dateStr}`)
          .then((fixtures) =>
            fixtures.filter((f) =>
              UPCOMING_STATUSES.includes((f.status ?? "").toUpperCase())
            )
          )
      )
    );

    // Combinar resultados exitosos manteniendo orden por fecha
    const upcoming: Fixture[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        upcoming.push(...result.value);
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

    if (odds?.home)     params.append("odds_home",     String(odds.home));
    if (odds?.draw)     params.append("odds_draw",     String(odds.draw));
    if (odds?.away)     params.append("odds_away",     String(odds.away));
    if (odds?.btts)     params.append("odds_btts",     String(odds.btts));
    if (odds?.over_25)  params.append("odds_over_25",  String(odds.over_25));
    if (odds?.under_25) params.append("odds_under_25", String(odds.under_25));

    return fetchAPI(`/predict/${fixtureId}?${params.toString()}`);
  },

  /**
   * Busca los próximos N partidos de una liga iterando fechas desde hoy.
   * Solo incluye partidos con status programado.
   * Busca hasta maxDays días hacia adelante.
   */
  getUpcomingFixtures: async (
    league: LeagueKey,
    count: number = 5,
    maxDays: number = 30,
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
          `/fixtures?league=${league}&date=${dateStr}`,
        );
        const scheduled = fixtures.filter((f) =>
          UPCOMING_STATUSES.includes((f.status ?? "").toUpperCase()),
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
