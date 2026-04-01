import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FavoriteFixture, Fixture } from "../types";

// ─── Theme Context ────────────────────────────────────────────────────────────

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("scoreflow_theme").then((val) => {
      if (val !== null) setIsDark(val === "dark");
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem("scoreflow_theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

// ─── Favorites Context ────────────────────────────────────────────────────────

interface FavoritesContextValue {
  favorites: FavoriteFixture[];
  isFavorite: (fixtureId: number) => boolean;
  addFavorite: (fixture: Fixture) => void;
  removeFavorite: (fixtureId: number) => void;
}

const FavoritesContext = createContext<FavoritesContextValue>({
  favorites: [],
  isFavorite: () => false,
  addFavorite: () => {},
  removeFavorite: () => {},
});

const FAVORITES_KEY = "scoreflow_favorites";

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteFixture[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY).then((val) => {
      if (val) setFavorites(JSON.parse(val));
    });
  }, []);

  const save = (data: FavoriteFixture[]) => {
    setFavorites(data);
    AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(data));
  };

  const isFavorite = (fixtureId: number) =>
    favorites.some((f) => f.fixture_id === fixtureId);

  const addFavorite = (fixture: Fixture) => {
    if (isFavorite(fixture.fixture_id)) return;
    save([...favorites, { ...fixture, savedAt: new Date().toISOString() }]);
  };

  const removeFavorite = (fixtureId: number) => {
    save(favorites.filter((f) => f.fixture_id !== fixtureId));
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, addFavorite, removeFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);
