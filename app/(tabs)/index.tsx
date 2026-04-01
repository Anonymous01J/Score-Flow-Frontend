import React, { useState, useEffect, useCallback } from "react";
import {
  View, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, Platform, ScrollView,
} from "react-native";
import { Text, ActivityIndicator, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Sun, Moon } from "lucide-react-native";
import { FixtureCard } from "../../src/components/ui/FixtureCard";
import { WeekCalendar } from "../../src/components/ui/WeekCalendar";
import { useTheme as useAppTheme } from "../../src/store/AppContext";
import { api, today } from "../../src/utils/api";
import { LEAGUES } from "../../src/utils/constants";
import type { Fixture, LeagueKey } from "../../src/types";

const LEAGUE_KEYS: LeagueKey[] = ["premier_league", "la_liga", "champions_league"];
const isWeb = Platform.OS === "web";

export default function TodayScreen() {
  const theme = useTheme();
  const { isDark, toggleTheme } = useAppTheme();

  const [selectedLeague, setSelectedLeague] = useState<LeagueKey>("premier_league");
  const [selectedDate, setSelectedDate]     = useState(today());
  const [fixtures, setFixtures]             = useState<Fixture[]>([]);
  const [loading, setLoading]               = useState(false);
  const [refreshing, setRefreshing]         = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  const loadFixtures = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await api.getFixtures(selectedLeague, selectedDate);
      setFixtures(data);
    } catch {
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

  // ─── Web layout ─────────────────────────────────────────────────────────────
  if (isWeb) {
    return (
      <View style={[styles.webRoot, { backgroundColor: theme.colors.background }]}>
        <View style={styles.webInner}>

          {/* Sidebar */}
          <View style={[styles.sidebar, { backgroundColor: theme.colors.surface, borderRightColor: theme.colors.outline }]}>
            <View style={styles.sidebarHeader}>
              <Text style={[styles.logo, { color: theme.colors.onSurface }]}>⚽ ScoreFlow</Text>
              <TouchableOpacity onPress={toggleTheme} style={[styles.themeBtn, { backgroundColor: theme.colors.surfaceVariant }]}>
                {isDark ? <Sun size={16} color={theme.colors.onSurface} strokeWidth={1.8} /> : <Moon size={16} color={theme.colors.onSurface} strokeWidth={1.8} />}
              </TouchableOpacity>
            </View>

            <WeekCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />

            <View style={styles.leagueSidebar}>
              <Text style={[styles.sidebarSectionTitle, { color: theme.colors.onSurfaceVariant }]}>LIGAS</Text>
              {LEAGUE_KEYS.map((key) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setSelectedLeague(key)}
                  style={[
                    styles.leagueSidebarItem,
                    selectedLeague === key && { backgroundColor: theme.colors.primary + "18", borderRadius: 10 },
                  ]}
                >
                  <Text style={styles.leagueFlag}>{LEAGUES[key].flag}</Text>
                  <Text style={[
                    styles.leagueSidebarText,
                    { color: selectedLeague === key ? theme.colors.primary : theme.colors.onSurface },
                  ]}>
                    {LEAGUES[key].name}
                  </Text>
                  {selectedLeague === key && (
                    <View style={[styles.activeIndicator, { backgroundColor: theme.colors.primary }]} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Main */}
          <View style={styles.webMain}>
            <View style={styles.webMainHeader}>
              <View>
                <Text style={[styles.webDateTitle, { color: theme.colors.onBackground }]}>
                  {LEAGUES[selectedLeague].flag} {LEAGUES[selectedLeague].name}
                </Text>
                <Text style={[styles.webDateSub, { color: theme.colors.onSurfaceVariant }]}>
                  {selectedDate === today() ? "Hoy · " : ""}{selectedDate}
                </Text>
              </View>
              <Text style={[styles.fixtureCount, { color: theme.colors.onSurfaceVariant }]}>
                {loading ? "..." : `${fixtures.length} partido${fixtures.length !== 1 ? "s" : ""}`}
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {loading ? (
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>Cargando partidos...</Text>
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
                  <Text style={{ fontSize: 48 }}>📅</Text>
                  <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>Sin partidos este día</Text>
                  <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>Selecciona otra fecha en el calendario</Text>
                </View>
              ) : (
                <View style={styles.webGrid}>
                  {fixtures.map((item) => (
                    <View key={item.fixture_id} style={styles.webCard}>
                      <FixtureCard fixture={item} onPress={() => handleFixturePress(item)} />
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>

        </View>
      </View>
    );
  }

  // ─── Mobile layout ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>⚽ ScoreFlow</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Predicciones basadas en datos</Text>
        </View>
        <TouchableOpacity onPress={toggleTheme} style={[styles.themeBtn, { backgroundColor: theme.colors.surfaceVariant }]}>
          {isDark ? <Sun size={18} color={theme.colors.onSurface} strokeWidth={1.8} /> : <Moon size={18} color={theme.colors.onSurface} strokeWidth={1.8} />}
        </TouchableOpacity>
      </View>

      <WeekCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <View style={styles.leagueRow}>
        {LEAGUE_KEYS.map((key) => (
          <TouchableOpacity
            key={key}
            onPress={() => setSelectedLeague(key)}
            style={[styles.leagueTab, selectedLeague === key && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
          >
            <Text style={[styles.leagueTabText, { color: selectedLeague === key ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>
              {LEAGUES[key].flag} {LEAGUES[key].name.split(" ")[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>Cargando partidos...</Text>
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
          <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>No hay partidos para esta fecha</Text>
        </View>
      ) : (
        <FlatList
          data={fixtures}
          keyExtractor={(item) => String(item.fixture_id)}
          renderItem={({ item }) => <FixtureCard fixture={item} onPress={() => handleFixturePress(item)} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadFixtures(true)} tintColor={theme.colors.primary} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1 },
  header:             { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title:              { fontWeight: "800" },
  themeBtn:           { padding: 10, borderRadius: 12 },
  leagueRow:          { flexDirection: "row", paddingHorizontal: 16, marginBottom: 8 },
  leagueTab:          { flex: 1, alignItems: "center", paddingVertical: 10 },
  leagueTabText:      { fontSize: 12, fontWeight: "700" },
  list:               { paddingVertical: 8, paddingBottom: 24 },
  centered:           { flex: 1, justifyContent: "center", alignItems: "center", gap: 8, paddingTop: 60 },
  retryBtn:           { marginTop: 8, padding: 12 },
  emptyTitle:         { fontSize: 18, fontWeight: "700" },
  // Web
  webRoot:            { flex: 1 },
  webInner:           { flex: 1, flexDirection: "row" },
  sidebar:            { width: 280, borderRightWidth: 1, paddingTop: 24 },
  sidebarHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 20 },
  logo:               { fontSize: 18, fontWeight: "800" },
  leagueSidebar:      { paddingHorizontal: 12, marginTop: 8 },
  sidebarSectionTitle:{ fontSize: 11, fontWeight: "700", letterSpacing: 1, paddingHorizontal: 8, marginBottom: 6 },
  leagueSidebarItem:  { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 10, gap: 10 },
  leagueFlag:         { fontSize: 20 },
  leagueSidebarText:  { flex: 1, fontSize: 14, fontWeight: "600" },
  activeIndicator:    { width: 6, height: 6, borderRadius: 3 },
  webMain:            { flex: 1, paddingTop: 24, paddingHorizontal: 24 },
  webMainHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 },
  webDateTitle:       { fontSize: 22, fontWeight: "800" },
  webDateSub:         { fontSize: 13, marginTop: 2 },
  fixtureCount:       { fontSize: 13 },
  webGrid:            { flexDirection: "row", flexWrap: "wrap" },
  webCard:            { width: "50%" as any, minWidth: 300 },
});
