import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import type { ValueBet } from "../../types";
import { MARKET_LABELS } from "../../utils/constants";

export const ValueBetCard = ({ vb }: { vb: ValueBet }) => {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: "#f59e0b0e", borderColor: "#f59e0b33" }]}>
      <View style={styles.header}>
        <Text style={[styles.marketName, { color: "#f59e0b" }]}>
          {MARKET_LABELS[vb.market] ?? vb.market}
        </Text>
        <View style={[styles.badge, { backgroundColor: "#22c55e22" }]}>
          <Text style={styles.badgeText}>
            +{(vb.edge * 100).toFixed(1)}% ventaja
          </Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.statBox}>
          <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Modelo</Text>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>{(vb.model_prob * 100).toFixed(1)}%</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
        <View style={styles.statBox}>
          <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Cuota implícita</Text>
          <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>{(vb.bookmaker_prob * 100).toFixed(1)}%</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  marketName: { fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: "#22c55e", fontSize: 12, fontWeight: "800" },
  row: { flexDirection: "row" },
  statBox: { flex: 1 },
  statLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", marginBottom: 2 },
  statValue: { fontSize: 15, fontWeight: "800" },
  divider: { width: 1, marginHorizontal: 12 },
});
