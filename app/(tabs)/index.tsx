import React, { useState, useEffect, useCallback } from "react";
import {
  View, FlatList, StyleSheet, RefreshControl, TouchableOpacity,
} from "react-native";
import {
  Text, ActivityIndicator, useTheme, Chip,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Sun, Moon } from "lucide-react-native";
import { FixtureCard } from "../../src/components/ui/FixtureCard";
import { useTheme as useAppTheme } from "../../src/store/AppContext";
import { api, today, formatDate } from "../../src/utils/api";
import { LEAGUES } from "../../src/utils/constants";
import type { Fixture, LeagueKey } from "../../src/types";

const LEAGUE_KEYS: LeagueKey[] = ["premier_league", "la_liga", "champions_league"];

// Genera array de fechas: ayer, hoy, mañana, pasado
function getDateRange(): { label: string; value: string }[] {
  const dates = [];
  const now = new Date();
  const labels = ["Anteayer", "Ayer", "Hoy", "Mañana", "Pasado"];
  for (let i = -2; i <= 2; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    dates.push({ label: labels[i + 2], value: formatDate(d) });
  }
  return dates;
}

export default function TodayScreen() {
  const theme    = useTheme();
  const { isDark, toggleTheme } = useAppTheme();

  const [selectedLeague, setSelectedLeague] = useState<LeagueKey>("premier_league");
  const [selectedDate, setSelectedDate]     = useState(today());
  const [fixtures, setFixtures]             = useState<Fixture[]>([]);
  const [loading, setLoading]               = useState(false);
  const [refreshing, setRefreshing]         = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  const dateRange = getDateRange();

  const loadFixtures = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await api.getFixtures(selectedLeague, selectedDate);
      setFixtures(data);
    } catch (e) {
      setError("No se pudieron cargar los partidos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedLeague, selectedDate]);

  useEffect(() => { loadFixtures(); }, [loadFixtures]);

  const handleFixturePress = (fixture: Fixture) => {
    router.push({
      pathname: "/(screens)/prediction",
      params: {
        fixture_id: fixture.fixture_id,
        league:     fixture.league,
        home_team:  fixture.home_team,
        away_team:  fixture.away_team,
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>
            ⚽ ScoreFlow
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Predicciones basadas en datos
          </Text>
        </View>
        <TouchableOpacity onPress={toggleTheme} style={[styles.themeBtn, { backgroundColor: theme.colors.surfaceVariant }]}>
          {isDark
            ? <Sun size={18} color={theme.colors.onSurface} strokeWidth={1.8} />
            : <Moon size={18} color={theme.colors.onSurface} strokeWidth={1.8} />
          }
        </TouchableOpacity>
      </View>

      {/* Selector de fecha */}
      <FlatList
        horizontal
        data={dateRange}
        keyExtractor={(item) => item.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateList}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedDate(item.value)}
            style={[
              styles.dateChip,
              {
                backgroundColor: selectedDate === item.value
                  ? theme.colors.primary
                  : theme.colors.surfaceVariant,
              },
            ]}
          >
            <Text style={[
              styles.dateChipText,
              { color: selectedDate === item.value ? "#fff" : theme.colors.onSurfaceVariant },
            ]}>
              {item.label}
            </Text>
            <Text style={[
              styles.dateChipSub,
              { color: selectedDate === item.value ? "#ffffff99" : theme.colors.onSurfaceVariant + "88" },
            ]}>
              {item.value.slice(5)}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Selector de liga */}
      <View style={styles.leagueRow}>
        {LEAGUE_KEYS.map((key) => (
          <TouchableOpacity
            key={key}
            onPress={() => setSelectedLeague(key)}
            style={[
              styles.leagueTab,
              selectedLeague === key && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
            ]}
          >
            <Text style={[
              styles.leagueTabText,
              { color: selectedLeague === key ? theme.colors.primary : theme.colors.onSurfaceVariant },
            ]}>
              {LEAGUES[key].flag} {LEAGUES[key].name.split(" ")[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de partidos */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>
            Cargando partidos...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: theme.colors.error }}>{error}</Text>
          <TouchableOpacity onPress={() => loadFixtures()} style={styles.retryBtn}>
            <Text style={{ color: theme.colors.primary, fontWeight: "700" }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : fixtures.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ fontSize: 40 }}>📅</Text>
          <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            No hay partidos para esta fecha
          </Text>
        </View>
      ) : (
        <FlatList
          data={fixtures}
          keyExtractor={(item) => String(item.fixture_id)}
          renderItem={({ item }) => (
            <FixtureCard fixture={item} onPress={() => handleFixturePress(item)} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadFixtures(true)}
              tintColor={theme.colors.primary}
            />
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  header:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title:       { fontWeight: "800" },
  themeBtn:    { padding: 10, borderRadius: 12 },
  dateList:    { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  dateChip:    { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, alignItems: "center", minWidth: 72 },
  dateChipText:{ fontSize: 12, fontWeight: "700" },
  dateChipSub: { fontSize: 10, marginTop: 2 },
  leagueRow:   { flexDirection: "row", paddingHorizontal: 16, marginBottom: 8 },
  leagueTab:   { flex: 1, alignItems: "center", paddingVertical: 10 },
  leagueTabText:{ fontSize: 12, fontWeight: "700" },
  list:        { paddingVertical: 8, paddingBottom: 24 },
  centered:    { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  retryBtn:    { marginTop: 8, padding: 12 },
});
