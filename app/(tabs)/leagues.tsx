import React from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Text, Surface, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { LEAGUES } from "../../src/utils/constants";
import type { LeagueKey } from "../../src/types";

const LEAGUE_LIST = Object.values(LEAGUES);

export default function LeaguesScreen() {
  const theme = useTheme();

  const handleLeaguePress = (key: LeagueKey) => {
    // Navega al tab Hoy con esa liga preseleccionada (via params o simplemente va a index)
    router.push("/(tabs)");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>
          Ligas
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Competiciones disponibles en V1
        </Text>
      </View>

      <FlatList
        data={LEAGUE_LIST}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleLeaguePress(item.key as LeagueKey)} activeOpacity={0.85}>
            <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <View style={[styles.colorBar, { backgroundColor: item.color }]} />
              <View style={styles.cardContent}>
                <Text style={styles.flag}>{item.flag}</Text>
                <View style={styles.info}>
                  <Text style={[styles.leagueName, { color: theme.colors.onSurface }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.country, { color: theme.colors.onSurfaceVariant }]}>
                    {item.country} · Temporada 2024/25
                  </Text>
                </View>
                <ChevronRight size={18} color={theme.colors.onSurfaceVariant} strokeWidth={1.8} />
              </View>
            </Surface>
          </TouchableOpacity>
        )}
      />

      {/* Coming soon */}
      <Surface style={[styles.comingSoon, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
        <Text style={[styles.comingSoonText, { color: theme.colors.onSurfaceVariant }]}>
          🚀 V2 — Bundesliga, Serie A, Ligue 1 y más
        </Text>
      </Surface>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  header:         { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  title:          { fontWeight: "800", marginBottom: 4 },
  list:           { paddingHorizontal: 16, gap: 12, paddingBottom: 24 },
  card:           { borderRadius: 16, overflow: "hidden" },
  colorBar:       { height: 4 },
  cardContent:    { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  flag:           { fontSize: 32 },
  info:           { flex: 1 },
  leagueName:     { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  country:        { fontSize: 13 },
  comingSoon:     { margin: 16, padding: 16, borderRadius: 12, alignItems: "center" },
  comingSoonText: { fontSize: 13, fontWeight: "600" },
});
