import React, { useState, useCallback } from "react";
import {
  View, StyleSheet, FlatList, TouchableOpacity,
  ScrollView, Platform,
} from "react-native";
import { Text, Surface, ActivityIndicator, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronRight, Calendar, Clock, ArrowLeft } from "lucide-react-native";
import { LEAGUES } from "../../src/utils/constants";
import { api } from "../../src/utils/api";
import type { LeagueKey, Fixture, Prediction } from "../../src/types";
import { ValueBetCard } from "../../src/components/ui/ValueBetCard";
import ValueBetsCalculator from "../../src/components/ValueBetsCalculator";
import { Zap } from "lucide-react-native";

const isWeb = Platform.OS === "web";

// ─── Estado por liga ──────────────────────────────────────────────────────────

interface LeagueState {
  fixtures:  Fixture[];
  loading:   boolean;
  loaded:    boolean;
  error:     string | null;
}

const INITIAL_STATE: LeagueState = {
  fixtures: [],
  loading:  false,
  loaded:   false,
  error:    null,
};

// ─── Tarjeta de partido próximo ───────────────────────────────────────────────

function InlineFixtureCard({
  fixture,
  index,
}: {
  fixture: Fixture;
  index: number;
}) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pred, setPred] = useState<Prediction | null>(null);

  // Formato legible de fecha: "Mié 2 Abr"
  const [year, month, day] = fixture.match_date.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayNames  = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const monthNames = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const dateLabel = `${dayNames[dateObj.getDay()]} ${day} ${monthNames[month - 1]}`;

  const handlePress = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (pred) {
      setExpanded(true);
      return;
    }
    try {
      setLoading(true);
      const res = await api.getPrediction(fixture.fixture_id, fixture.league as LeagueKey);
      setPred(res);
      setExpanded(true);
    } catch (e) {
      alert("Error al cargar la predicción. Revisa tu conexión o el rate limit.");
    } finally {
      setLoading(false);
    }
  };

  const hasValue = pred?.value_bets && pred.value_bets.length > 0;

  return (
    <View style={[{ borderBottomWidth: 1, borderBottomColor: theme.colors.outline + "60" }, index === 0 && rowStyles.firstRow]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.82} style={rowStyles.container}>
        {/* Número */}
        <View style={[rowStyles.indexBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text style={[rowStyles.indexText, { color: theme.colors.onSurfaceVariant }]}>
            {index + 1}
          </Text>
        </View>

        {/* Equipos + fecha */}
        <View style={rowStyles.middle}>
          <View style={rowStyles.teamsRow}>
            <Text style={[rowStyles.teamName, { color: theme.colors.onSurface }]} numberOfLines={1}>
              {fixture.home_team}
            </Text>
            <View style={[rowStyles.vsChip, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[rowStyles.vs, { color: theme.colors.onSurfaceVariant }]}>vs</Text>
            </View>
            <Text style={[rowStyles.teamName, rowStyles.teamRight, { color: theme.colors.onSurface }]} numberOfLines={1}>
              {fixture.away_team}
            </Text>
          </View>
          <View style={rowStyles.dateRow}>
            <Calendar size={11} color={theme.colors.onSurfaceVariant} strokeWidth={1.8} />
            <Text style={[rowStyles.dateText, { color: theme.colors.onSurfaceVariant }]}>
              {dateLabel}
            </Text>
          </View>
        </View>

        {/* CTA */}
        <View style={rowStyles.cta}>
          {loading ? (
             <ActivityIndicator size={14} color={theme.colors.primary} />
          ) : (
             <>
               <Text style={[rowStyles.ctaText, { color: theme.colors.primary }]}>{expanded ? "Ocultar" : "Predecir"}</Text>
               <ChevronRight size={14} color={theme.colors.primary} strokeWidth={2} style={{ transform: [{ rotate: expanded ? "90deg" : "0deg" }] }} />
             </>
          )}
        </View>
      </TouchableOpacity>

      {/* Contenido Expandido */}
      {expanded && pred && (
        <View style={{ padding: 16, backgroundColor: hasValue ? theme.colors.primary + "08" : theme.colors.surface }}>
           <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                 <Text style={{ fontSize: 10, color: theme.colors.onSurfaceVariant, textTransform: "uppercase", fontWeight: "700" }}>Local</Text>
                 <Text style={{ fontSize: 14, fontWeight: "800", color: theme.colors.primary }}>{(pred.prob_home_win * 100).toFixed(1)}%</Text>
              </View>
              <View style={{ flex: 1, alignItems: "center" }}>
                 <Text style={{ fontSize: 10, color: theme.colors.onSurfaceVariant, textTransform: "uppercase", fontWeight: "700" }}>Empate</Text>
                 <Text style={{ fontSize: 14, fontWeight: "800", color: theme.colors.onSurface }}>{(pred.prob_draw * 100).toFixed(1)}%</Text>
              </View>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                 <Text style={{ fontSize: 10, color: theme.colors.onSurfaceVariant, textTransform: "uppercase", fontWeight: "700" }}>Visitante</Text>
                 <Text style={{ fontSize: 14, fontWeight: "800", color: "#3b82f6" }}>{(pred.prob_away_win * 100).toFixed(1)}%</Text>
              </View>
           </View>
           <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <View>
                 <Text style={{ fontSize: 10, color: theme.colors.onSurfaceVariant, textTransform: "uppercase", fontWeight: "700" }}>BTTS (Ambos Marcan)</Text>
                 <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.onSurface }}>{(pred.prob_btts * 100).toFixed(1)}%</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                 <Text style={{ fontSize: 10, color: theme.colors.onSurfaceVariant, textTransform: "uppercase", fontWeight: "700" }}>Más de 2.5 Goles</Text>
                 <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.onSurface }}>{(pred.prob_over_25 * 100).toFixed(1)}%</Text>
              </View>
           </View>
           


           {hasValue ? (
              <View style={{ marginTop: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                     <Zap size={14} color={theme.colors.primary} fill={theme.colors.primary} />
                     <Text style={{ fontSize: 12, fontWeight: "800", color: theme.colors.primary, textTransform: "uppercase" }}>Value Bets Sugeridas</Text>
                  </View>
                  {pred.value_bets.map((vb, idx) => <ValueBetCard key={idx} vb={vb} />)}
              </View>
           ) : (
              <View style={{ marginTop: 16, alignItems: "center", paddingVertical: 12, backgroundColor: theme.colors.surfaceVariant, borderRadius: 8 }}>
                  <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12, fontWeight: "600" }}>Sin valor detectado por el modelo</Text>
              </View>
           )}
        </View>
      )}
    </View>
  );
}

const rowStyles = StyleSheet.create({
  container:  { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  firstRow:   { paddingTop: 16 },
  indexBadge: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  indexText:  { fontSize: 11, fontWeight: "700" },
  middle:     { flex: 1, gap: 5 },
  teamsRow:   { flexDirection: "row", alignItems: "center", gap: 6 },
  teamName:   { flex: 1, fontSize: 13, fontWeight: "700" },
  teamRight:  { textAlign: "right" },
  vsChip:     { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  vs:         { fontSize: 10, fontWeight: "600" },
  dateRow:    { flexDirection: "row", alignItems: "center", gap: 4 },
  dateText:   { fontSize: 11 },
  cta:        { flexDirection: "row", alignItems: "center", gap: 2 },
  ctaText:    { fontSize: 11, fontWeight: "700" },
});

// ─── Card de liga expandible ──────────────────────────────────────────────────

function LeagueCard({
  leagueKey,
  state,
  onExpand,
}: {
  leagueKey: LeagueKey;
  state: LeagueState;
  onExpand: (key: LeagueKey) => void;
}) {
  const theme  = useTheme();
  const league = LEAGUES[leagueKey];
  const isOpen = state.loaded || state.loading;

  return (
    <Surface
      style={[cardStyles.card, { backgroundColor: theme.colors.surface }]}
      elevation={1}
    >
      {/* Barra de color */}
      <View style={[cardStyles.colorBar, { backgroundColor: league.color }]} />

      {/* Header — toca para expandir */}
      <TouchableOpacity
        onPress={() => onExpand(leagueKey)}
        activeOpacity={0.85}
        style={cardStyles.header}
      >
        <Text style={cardStyles.flag}>{league.flag}</Text>
        <View style={cardStyles.headerInfo}>
          <Text style={[cardStyles.leagueName, { color: theme.colors.onSurface }]}>
            {league.name}
          </Text>
          <Text style={[cardStyles.country, { color: theme.colors.onSurfaceVariant }]}>
            {league.country} · Temporada 2024/25
          </Text>
        </View>

        {state.loading ? (
          <ActivityIndicator size={16} color={league.color} />
        ) : (
          <View style={[cardStyles.expandBtn, { backgroundColor: league.color + "18" }]}>
            <Text style={[cardStyles.expandText, { color: league.color }]}>
              {isOpen ? "Ocultar" : "Ver próximos"}
            </Text>
            <ChevronRight
              size={13}
              color={league.color}
              strokeWidth={2.2}
              style={{ transform: [{ rotate: isOpen ? "90deg" : "0deg" }] }}
            />
          </View>
        )}
      </TouchableOpacity>

      {/* Lista de partidos próximos */}
      {isOpen && (
        <>
          {state.error ? (
            <View style={cardStyles.statusBlock}>
              <Text style={[cardStyles.statusText, { color: theme.colors.error }]}>
                {state.error}
              </Text>
              <TouchableOpacity onPress={() => onExpand(leagueKey)} style={cardStyles.retryBtn}>
                <Text style={[cardStyles.retryText, { color: league.color }]}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : state.loading ? (
            <View style={cardStyles.statusBlock}>
              <ActivityIndicator size="small" color={league.color} />
              <Text style={[cardStyles.statusText, { color: theme.colors.onSurfaceVariant }]}>
                Buscando próximos partidos...
              </Text>
            </View>
          ) : state.fixtures.length === 0 ? (
            <View style={cardStyles.statusBlock}>
              <Text style={{ fontSize: 28 }}>📅</Text>
              <Text style={[cardStyles.statusText, { color: theme.colors.onSurfaceVariant }]}>
                No se encontraron partidos próximos en los siguientes 30 días
              </Text>
            </View>
          ) : (
            <>
              <View style={[cardStyles.listHeader, { borderTopColor: theme.colors.outline + "50" }]}>
                <Clock size={12} color={theme.colors.onSurfaceVariant} strokeWidth={1.8} />
                <Text style={[cardStyles.listHeaderText, { color: theme.colors.onSurfaceVariant }]}>
                  PRÓXIMOS {state.fixtures.length} PARTIDOS
                </Text>
              </View>
              {state.fixtures.map((fixture, i) => (
                <InlineFixtureCard
                  key={fixture.fixture_id}
                  fixture={fixture}
                  index={i}
                />
              ))}
            </>
          )}
        </>
      )}
    </Surface>
  );
}

const cardStyles = StyleSheet.create({
  card:           { borderRadius: 16, overflow: "hidden", marginBottom: 12 },
  colorBar:       { height: 4 },
  header:         { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  flag:           { fontSize: 32 },
  headerInfo:     { flex: 1 },
  leagueName:     { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  country:        { fontSize: 13 },
  expandBtn:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 3 },
  expandText:     { fontSize: 12, fontWeight: "700" },
  statusBlock:    { alignItems: "center", gap: 8, paddingVertical: 24, paddingHorizontal: 16 },
  statusText:     { fontSize: 13, textAlign: "center", lineHeight: 20 },
  retryBtn:       { paddingHorizontal: 16, paddingVertical: 8 },
  retryText:      { fontSize: 13, fontWeight: "700" },
  listHeader:     { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1 },
  listHeaderText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
});

// ─── Pantalla principal ───────────────────────────────────────────────────────

const LEAGUE_KEYS = Object.keys(LEAGUES) as LeagueKey[];

export default function LeaguesScreen() {
  const theme = useTheme();

  const [leagueStates, setLeagueStates] = useState<Record<LeagueKey, LeagueState>>(
    () => Object.fromEntries(LEAGUE_KEYS.map((k) => [k, { ...INITIAL_STATE }])) as any
  );

  const handleExpand = useCallback(async (key: LeagueKey) => {
    const current = leagueStates[key];

    // Si ya está cargado → toggle (resetear para ocultar)
    if (current.loaded) {
      setLeagueStates((prev) => ({
        ...prev,
        [key]: { ...INITIAL_STATE },
      }));
      return;
    }

    // Si ya está cargando → ignorar
    if (current.loading) return;

    // Iniciar carga
    setLeagueStates((prev) => ({
      ...prev,
      [key]: { ...INITIAL_STATE, loading: true },
    }));

    try {
      const fixtures = await api.getUpcomingFixtures(key);
      setLeagueStates((prev) => ({
        ...prev,
        [key]: { ...prev[key], fixtures, loading: false, loaded: true, error: null },
      }));
    } catch {
      setLeagueStates((prev) => ({
        ...prev,
        [key]: { ...prev[key], fixtures: [], loading: false, loaded: true, error: "No se pudieron cargar los partidos." },
      }));
    }
  }, [leagueStates]);

  const content = (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        isWeb && { maxWidth: 720, alignSelf: "center" as any, width: "100%" as any },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/*<Surface
        style={[styles.comingSoon, { backgroundColor: theme.colors.surfaceVariant }]}
        elevation={0}
      >
        <Text style={[styles.comingSoonText, { color: theme.colors.onSurfaceVariant }]}>
          🚀 V2 — Bundesliga, Serie A, Ligue 1 y más
        </Text>
      </Surface>
      */}

      {Object.values(LEAGUES).map((l) => (
        <LeagueCard
          key={l.key}
          leagueKey={l.key}
          state={leagueStates[l.key] || INITIAL_STATE}
          onExpand={handleExpand}
        />
      ))}

      <View style={{ height: 32 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, isWeb && styles.headerWeb]}>
        <View>
          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>
            Ligas
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Toca una liga para ver los próximos partidos
          </Text>
        </View>
      </View>

      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header:    { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  headerWeb: { maxWidth: 720, alignSelf: "center" as any, width: "100%" as any },
  title:     { fontWeight: "800", marginBottom: 4 },
  scroll:    { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 },
  comingSoon:    { marginBottom: 16, padding: 14, borderRadius: 12, alignItems: "center" },
  comingSoonText:{ fontSize: 13, fontWeight: "600" },
});