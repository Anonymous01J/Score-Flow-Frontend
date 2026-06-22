import { API_BASE_URL } from "./constants";
import type { Fixture, League, Prediction, LeagueKey } from "../types";

// ─── Limitador de peticiones (Rate Limiter) ───────────────────────────────────

type RateLimitListener = (state: { isPaused: boolean; secondsLeft: number }) => void;

class RateLimiter {
  private count = 0;
  private limit = 10;
  private isPaused = false;
  private secondsLeft = 0;
  private lastHitTime = 0;
  private listeners: Set<RateLimitListener> = new Set();

  subscribe(fn: RateLimitListener) {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  private notify() {
    for (const fn of this.listeners) {
      fn({ isPaused: this.isPaused, secondsLeft: this.secondsLeft });
    }
  }

  async hit() {
    const now = Date.now();
    // Reiniciar contador si han pasado 60 segundos naturales sin peticiones
    if (this.lastHitTime > 0 && now - this.lastHitTime >= 60000) {
        this.count = 0;
    }
    
    // Si ya estamos en pausa, esperamos a que termine
    while (this.isPaused) {
      await new Promise((r) => setTimeout(r, 500));
    }

    this.count++;
    this.lastHitTime = Date.now();

    if (this.count >= this.limit) {
      this.isPaused = true;
      this.secondsLeft = 66; // 1.1 min
      this.notify();

      while (this.secondsLeft > 0) {
        await new Promise((r) => setTimeout(r, 1000));
        this.secondsLeft--;
        this.notify();
      }

      this.isPaused = false;
      this.count = 0; // Reiniciamos contador tras pausa
      this.lastHitTime = Date.now();
      this.notify();
    }
  }
}

export const rateLimiter = new RateLimiter();

async function fetchAPI<T>(endpoint: string): Promise<T> {
  await rateLimiter.hit();
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
   * Lanza las peticiones secuencialmente para respetar los límites de la API.
   * Retorna todos los partidos de la semana ordenados por fecha ascendente.
   */
  getUpcomingFixtures: async (
    league: LeagueKey,
  ): Promise<Fixture[]> => {
    const UPCOMING_STATUSES = ["NS", "TBD", "SCHED", "SCHEDULED", "NOT_STARTED", "TIMED"];
    const base = new Date();

    // Generar las fechas de los próximos 7 días (hoy incluido)
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return formatDate(d);
    });

    const upcoming: Fixture[] = [];

    // Peticiones secuenciales para no quemar el límite
    for (const dateStr of dates) {
      try {
        const fixtures = await fetchAPI<Fixture[]>(`/fixtures?league=${league}&date=${dateStr}`);
        upcoming.push(...fixtures);
      } catch (e) {
        console.warn(`Error fetching ${league} on ${dateStr}:`, e);
      }
    }

    return upcoming;
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
