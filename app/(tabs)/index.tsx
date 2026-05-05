import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, Platform, ScrollView,
  Animated, Pressable,
} from "react-native";
import { Text, ActivityIndicator, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Sun, Moon, Menu, X } from "lucide-react-native";
import { FixtureCard } from "../../src/components/ui/FixtureCard";
import { WeekCalendar } from "../../src/components/ui/WeekCalendar";
import { useTheme as useAppTheme } from "../../src/store/AppContext";
import { api, today } from "../../src/utils/api";
import { LEAGUES } from "../../src/utils/constants";
import type { Fixture, LeagueKey } from "../../src/types";

// Todas las ligas disponibles en orden
const LEAGUE_KEYS: LeagueKey[] = [
  "premier_league",
  "la_liga",
  "bundesliga",
  "serie_a",
  "ligue_1",
  "champions_league",
];

// Ligas que se muestran en las tabs nativas (máximo 4 caben bien)
const NATIVE_TAB_KEYS: LeagueKey[] = [
  "premier_league",
  "la_liga",
  "bundesliga",
  "serie_a",
];

const isWeb = Platform.OS === "web";

function useWindowWidth() {
  const [width, setWidth] = useState(
    isWeb ? (typeof window !== "undefined" ? window.innerWidth : 1024) : 375
  );
  useEffect(() => {
    if (!isWeb || typeof window === "undefined") return;
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

interface DrawerProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function Drawer({ visible, onClose, children }: DrawerProps) {
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: -300, useNativeDriver: true, tension: 80, friction: 12 }),
        Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <View style={drawerStyles.container} pointerEvents="box-none">
      <Animated.View style={[drawerStyles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[drawerStyles.panel, { transform: [{ translateX: slideAnim }] }]}>
        {children}
      </Animated.View>
    </View>
  );
}

const drawerStyles = StyleSheet.create({
  container: { position: "absolute" as any, top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 },
  backdrop:  { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  panel:     { position: "absolute" as any, top: 0, left: 0, bottom: 0, width: 300, zIndex: 1001 },
});

// ─── Sidebar Content ──────────────────────────────────────────────────────────

interface SidebarContentProps {
  selectedDate: string;
  onSelectDate: (d: string) => void;
  selectedLeague: LeagueKey;
  onSelectLeague: (k: LeagueKey) => void;
  isDark: boolean;
  toggleTheme: () => void;
  onClose?: () => void;
}

function SidebarContent({
  selectedDate, onSelectDate,
  selectedLeague, onSelectLeague,
  isDark, toggleTheme, onClose,
}: SidebarContentProps) {
  const theme = useTheme();

  return (
    <ScrollView
      style={[sidebarStyles.container, { backgroundColor: theme.colors.surface }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={sidebarStyles.header}>
        <Text style={[sidebarStyles.logo, { color: theme.colors.onSurface }]}>⚽ ScoreFlow</Text>
        <View style={sidebarStyles.headerActions}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[sidebarStyles.iconBtn, { backgroundColor: theme.colors.surfaceVariant }]}
          >
            {isDark
              ? <Sun  size={16} color={theme.colors.onSurface} strokeWidth={1.8} />
              : <Moon size={16} color={theme.colors.onSurface} strokeWidth={1.8} />
            }
          </TouchableOpacity>
          {onClose && (
            <TouchableOpacity
              onPress={onClose}
              style={[sidebarStyles.iconBtn, { backgroundColor: theme.colors.surfaceVariant }]}
            >
              <X size={16} color={theme.colors.onSurface} strokeWidth={1.8} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <WeekCalendar
        selectedDate={selectedDate}
        onSelectDate={(d) => { onSelectDate(d); onClose?.(); }}
      />

      <View style={sidebarStyles.leagueSection}>
        <Text style={[sidebarStyles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
          LIGAS
        </Text>
        {LEAGUE_KEYS.map((key) => {
          const isActive = selectedLeague === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => { onSelectLeague(key); onClose?.(); }}
              style={[
                sidebarStyles.leagueItem,
                isActive && { backgroundColor: theme.colors.primary + "18", borderRadius: 10 },
              ]}
            >
              <Text style={sidebarStyles.leagueFlag}>{LEAGUES[key].flag}</Text>
              <Text style={[
                sidebarStyles.leagueName,
                { color: isActive ? theme.colors.primary : theme.colors.onSurface },
              ]}>
                {LEAGUES[key].name}
              </Text>
              {isActive && (
                <View style={[sidebarStyles.activeDot, { backgroundColor: theme.colors.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const sidebarStyles = StyleSheet.create({
  container:     { flex: 1 },
  header:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  logo:          { fontSize: 18, fontWeight: "800" },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn:       { padding: 8, borderRadius: 10 },
  leagueSection: { paddingHorizontal: 12, marginTop: 8 },
  sectionTitle:  { fontSize: 11, fontWeight: "700", letterSpacing: 1, paddingHorizontal: 8, marginBottom: 6 },
  leagueItem:    { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 10, gap: 10 },
  leagueFlag:    { fontSize: 20 },
  leagueName:    { flex: 1, fontSize: 14, fontWeight: "600" },
  activeDot:     { width: 6, height: 6, borderRadius: 3 },
});

// ─── Selector de liga nativo (scrollable horizontal) ─────────────────────────

function NativeLeagueTabs({
  selectedLeague,
  onSelect,
}: {
  selectedLeague: LeagueKey;
  onSelect: (k: LeagueKey) => void;
}) {
  const theme = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={nativeTabStyles.container}
    >
      {LEAGUE_KEYS.map((key) => {
        const isActive = selectedLeague === key;
        return (
          <TouchableOpacity
            key={key}
            onPress={() => onSelect(key)}
            style={[
              nativeTabStyles.tab,
              isActive && {
                borderBottomColor: LEAGUES[key].color,
                borderBottomWidth: 2.5,
              },
            ]}
          >
            <Text style={nativeTabStyles.flag}>{LEAGUES[key].flag}</Text>
            <Text style={[
              nativeTabStyles.label,
              { color: isActive ? LEAGUES[key].color : theme.colors.onSurfaceVariant },
            ]}>
              {LEAGUES[key].name.split(" ")[0]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const nativeTabStyles = StyleSheet.create({
  container: { paddingHorizontal: 12, paddingBottom: 2 },
  tab:       { alignItems: "center", paddingHorizontal: 10, paddingVertical: 10, marginHorizontal: 2, gap: 2 },
  flag:      { fontSize: 16 },
  label:     { fontSize: 11, fontWeight: "700" },
});

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function TodayScreen() {
  const theme = useTheme();
  const { isDark, toggleTheme } = useAppTheme();
  const windowWidth = useWindowWidth();
  const isDesktop   = isWeb && windowWidth >= 768;

  const [selectedLeague, setSelectedLeague] = useState<LeagueKey>("premier_league");
  const [selectedDate, setSelectedDate]     = useState(today());
  const [fixtures, setFixtures]             = useState<Fixture[]>([]);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen]         = useState(false);

  const fetchIdRef = useRef(0);
  const leagueRef  = useRef(selectedLeague);
  const dateRef    = useRef(selectedDate);

  useEffect(() => { leagueRef.current = selectedLeague; }, [selectedLeague]);
  useEffect(() => { dateRef.current   = selectedDate;   }, [selectedDate]);

  const loadFixtures = useCallback(async (showRefresh = false) => {
    const fetchId = ++fetchIdRef.current;
    const league  = leagueRef.current;
    const date    = dateRef.current;

    if (showRefresh) setRefreshing(true);
    else { setLoading(true); setFixtures([]); }
    setError(null);

    try {
      const data = await api.getFixtures(league, date);
      if (fetchId !== fetchIdRef.current) return;
      setFixtures(data);
    } catch (e: any) {
      if (fetchId !== fetchIdRef.current) return;
      const msg = e?.message?.includes("429")
        ? "Límite de requests alcanzado. Espera un momento e intenta de nuevo."
        : "No se pudieron cargar los partidos.";
      setError(msg);
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => { loadFixtures(); }, [selectedLeague, selectedDate]);

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

  // ─── Contenido central ────────────────────────────────────────────────────

  const fixturesContent = (
    <>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>
            Cargando partidos...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ fontSize: 32 }}>⚠️</Text>
          <Text style={{ color: theme.colors.error, textAlign: "center", marginTop: 8, lineHeight: 22 }}>
            {error}
          </Text>
          <TouchableOpacity onPress={() => loadFixtures()} style={styles.retryBtn}>
            <Text style={{ color: theme.colors.primary, fontWeight: "700" }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : fixtures.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ fontSize: 48 }}>📅</Text>
          <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
            Sin partidos este día
          </Text>
          <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 4, textAlign: "center" }}>
            Selecciona otra fecha en el calendario
          </Text>
        </View>
      ) : isDesktop ? (
        <View style={styles.webGrid}>
          {fixtures.map((item) => (
            <View key={item.fixture_id} style={styles.webCard}>
              <FixtureCard fixture={item} onPress={() => handleFixturePress(item)} />
            </View>
          ))}
        </View>
      ) : (
        fixtures.map((item) => (
          <FixtureCard
            key={item.fixture_id}
            fixture={item}
            onPress={() => handleFixturePress(item)}
          />
        ))
      )}
    </>
  );

  // ─── Layout web ───────────────────────────────────────────────────────────

  if (isWeb) {
    return (
      <View style={[styles.webRoot, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.webInner, !isDesktop && { flexDirection: "column" }]}>

          {isDesktop && (
            <View style={[styles.sidebar, { backgroundColor: theme.colors.surface, borderRightColor: theme.colors.outline }]}>
              <SidebarContent
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                selectedLeague={selectedLeague}
                onSelectLeague={setSelectedLeague}
                isDark={isDark}
                toggleTheme={toggleTheme}
              />
            </View>
          )}

          {!isDesktop && (
            <View style={[styles.mobileWebHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline }]}>
              <TouchableOpacity
                onPress={() => setDrawerOpen(true)}
                style={[styles.hamburgerBtn, { backgroundColor: theme.colors.surfaceVariant }]}
              >
                <Menu size={20} color={theme.colors.onSurface} strokeWidth={1.8} />
              </TouchableOpacity>
              <View style={styles.mobileWebTitleBlock}>
                <Text style={[styles.mobileWebTitle, { color: theme.colors.onSurface }]}>
                  {LEAGUES[selectedLeague].flag} {LEAGUES[selectedLeague].name}
                </Text>
                <Text style={[styles.mobileWebSub, { color: theme.colors.onSurfaceVariant }]}>
                  {selectedDate === today() ? "Hoy · " : ""}{selectedDate}
                </Text>
              </View>
              <TouchableOpacity
                onPress={toggleTheme}
                style={[styles.hamburgerBtn, { backgroundColor: theme.colors.surfaceVariant }]}
              >
                {isDark
                  ? <Sun  size={18} color={theme.colors.onSurface} strokeWidth={1.8} />
                  : <Moon size={18} color={theme.colors.onSurface} strokeWidth={1.8} />
                }
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.webMain, !isDesktop && { paddingTop: 8, paddingHorizontal: 0 }]}>
            {isDesktop && (
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
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
              {fixturesContent}
              <View style={{ height: 32 }} />
            </ScrollView>
          </View>

        </View>

        {!isDesktop && (
          <Drawer visible={drawerOpen} onClose={() => setDrawerOpen(false)}>
            <SidebarContent
              selectedDate={selectedDate}
              onSelectDate={(d) => { setSelectedDate(d); setDrawerOpen(false); }}
              selectedLeague={selectedLeague}
              onSelectLeague={(k) => { setSelectedLeague(k); setDrawerOpen(false); }}
              isDark={isDark}
              toggleTheme={toggleTheme}
              onClose={() => setDrawerOpen(false)}
            />
          </Drawer>
        )}
      </View>
    );
  }

  // ─── Layout nativo ────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>
            ⚽ ScoreFlow
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Predicciones basadas en datos
          </Text>
        </View>
        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.themeBtn, { backgroundColor: theme.colors.surfaceVariant }]}
        >
          {isDark
            ? <Sun  size={18} color={theme.colors.onSurface} strokeWidth={1.8} />
            : <Moon size={18} color={theme.colors.onSurface} strokeWidth={1.8} />
          }
        </TouchableOpacity>
      </View>

      <WeekCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* Tabs scrollables horizontalmente — todas las ligas */}
      <NativeLeagueTabs selectedLeague={selectedLeague} onSelect={setSelectedLeague} />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>
            Cargando partidos...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ fontSize: 32 }}>⚠️</Text>
          <Text style={{ color: theme.colors.error, textAlign: "center", marginTop: 8 }}>
            {error}
          </Text>
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
  container:          { flex: 1 },
  header:             { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title:              { fontWeight: "800" },
  themeBtn:           { padding: 10, borderRadius: 12 },
  list:               { paddingVertical: 8, paddingBottom: 24 },
  centered:           { flex: 1, justifyContent: "center", alignItems: "center", gap: 8, paddingTop: 60, paddingHorizontal: 32 },
  retryBtn:           { marginTop: 8, padding: 12 },
  emptyTitle:         { fontSize: 18, fontWeight: "700" },
  webRoot:            { flex: 1 },
  webInner:           { flex: 1, flexDirection: "row" },
  sidebar:            { width: 280, borderRightWidth: 1 },
  webMain:            { flex: 1, paddingTop: 24, paddingHorizontal: 24 },
  webMainHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 },
  webDateTitle:       { fontSize: 22, fontWeight: "800" },
  webDateSub:         { fontSize: 13, marginTop: 2 },
  fixtureCount:       { fontSize: 13 },
  webGrid:            { flexDirection: "row", flexWrap: "wrap" },
  webCard:            { width: "50%" as any, minWidth: 300 },
  mobileWebHeader:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  hamburgerBtn:       { padding: 10, borderRadius: 12 },
  mobileWebTitleBlock:{ flex: 1, alignItems: "center" },
  mobileWebTitle:     { fontSize: 15, fontWeight: "800" },
  mobileWebSub:       { fontSize: 11, marginTop: 1 },
});
