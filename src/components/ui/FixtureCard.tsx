import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Surface, useTheme } from "react-native-paper";
import { Star } from "lucide-react-native";
import type { Fixture } from "../../types";
import { LEAGUES } from "../../utils/constants";
import { useFavorites } from "../../store/AppContext";

interface FixtureCardProps {
  fixture: Fixture;
  onPress: () => void;
}

export function FixtureCard({ fixture, onPress }: FixtureCardProps) {
  const theme = useTheme();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const league = LEAGUES[fixture.league];
  const favorite = isFavorite(fixture.fixture_id);

  const statusColor =
    fixture.status === "FINISHED"   ? theme.colors.onSurfaceVariant :
    fixture.status === "LIVE" || fixture.status === "IN_PLAY" ? "#22c55e" :
    theme.colors.primary;

  const statusLabel =
    fixture.status === "FINISHED"  ? "Finalizado" :
    fixture.status === "LIVE" || fixture.status === "IN_PLAY" ? "🔴 En vivo" :
    fixture.status === "POSTPONED" ? "Postergado" :
    "Programado";

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>

        {/* Liga badge */}
        <View style={[styles.leagueBadge, { backgroundColor: league.color + "22" }]}>
          <Text style={[styles.leagueText, { color: league.color }]}>
            {league.flag} {league.name}
          </Text>
          <View style={styles.row}>
            <Text style={[styles.status, { color: statusColor }]}>{statusLabel}</Text>
            <TouchableOpacity
              onPress={() => favorite ? removeFavorite(fixture.fixture_id) : addFavorite(fixture)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Star
                size={16}
                color={favorite ? "#f59e0b" : theme.colors.onSurfaceVariant}
                fill={favorite ? "#f59e0b" : "transparent"}
                strokeWidth={1.8}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Equipos */}
        <View style={styles.teamsRow}>
          <Text style={[styles.teamName, { color: theme.colors.onSurface }]} numberOfLines={1}>
            {fixture.home_team}
          </Text>
          <View style={[styles.vsChip, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text style={[styles.vs, { color: theme.colors.onSurfaceVariant }]}>vs</Text>
          </View>
          <Text style={[styles.teamName, styles.teamRight, { color: theme.colors.onSurface }]} numberOfLines={1}>
            {fixture.away_team}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
            {fixture.match_date}
          </Text>
          <Text style={[styles.predictCta, { color: theme.colors.primary }]}>
            Ver predicción →
          </Text>
        </View>

      </Surface>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: "hidden",
  },
  leagueBadge: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  leagueText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  status: {
    fontSize: 11,
    fontWeight: "600",
  },
  teamsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
  },
  teamName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  teamRight: {
    textAlign: "right",
  },
  vsChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vs: {
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  footerText: {
    fontSize: 12,
  },
  predictCta: {
    fontSize: 12,
    fontWeight: "700",
  },
});
