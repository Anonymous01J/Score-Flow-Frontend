import React, { useState } from "react";
import { View, StyleSheet, TextInput } from "react-native";
import { Text, Surface, useTheme } from "react-native-paper";
import { Calculator } from "lucide-react-native";
import type { Prediction } from "../types";

export default function ValueBetsCalculator({ prediction }: { prediction: Prediction }) {
  const theme = useTheme();
  const [odds, setOdds] = useState({ home: "", draw: "", away: "", btts: "", over: "", under: "" });

  const calcEdge = (modelProb: number, oddStr: string) => {
    const odd = parseFloat(oddStr.replace(",", "."));
    if (isNaN(odd) || odd <= 1.0) return null;
    const implied = 1 / odd;
    const edge = modelProb - implied;
    return { odd, implied, edge };
  };

  const results = [
    { label: "Local", prob: prediction.prob_home_win, odd: odds.home },
    { label: "Empate", prob: prediction.prob_draw, odd: odds.draw },
    { label: "Visitante", prob: prediction.prob_away_win, odd: odds.away },
    { label: "Ambos Marcan", prob: prediction.prob_btts, odd: odds.btts },
    { label: "Over 2.5", prob: prediction.prob_over_25, odd: odds.over },
    { label: "Under 2.5", prob: prediction.prob_under_25, odd: odds.under },
  ].map(r => ({ ...r, res: calcEdge(r.prob, r.odd) })).filter(r => r.res !== null);

  return (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <View style={styles.header}>
        <Calculator size={18} color={theme.colors.primary} />
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>Calculadora Manual</Text>
      </View>
      <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Ingresa las cuotas de tu casa de apuestas para encontrar valor.
      </Text>

      <View style={styles.grid}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>1 (Local)</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outline }]}
            keyboardType="numeric"
            placeholder="Ej: 2.10"
            placeholderTextColor={theme.colors.onSurfaceVariant + "80"}
            value={odds.home}
            onChangeText={t => setOdds({ ...odds, home: t })}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>X (Empate)</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outline }]}
            keyboardType="numeric"
            placeholder="Ej: 3.20"
            placeholderTextColor={theme.colors.onSurfaceVariant + "80"}
            value={odds.draw}
            onChangeText={t => setOdds({ ...odds, draw: t })}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>2 (Visit)</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outline }]}
            keyboardType="numeric"
            placeholder="Ej: 3.50"
            placeholderTextColor={theme.colors.onSurfaceVariant + "80"}
            value={odds.away}
            onChangeText={t => setOdds({ ...odds, away: t })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>BTTS</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outline }]}
            keyboardType="numeric"
            placeholder="Ej: 1.80"
            placeholderTextColor={theme.colors.onSurfaceVariant + "80"}
            value={odds.btts}
            onChangeText={t => setOdds({ ...odds, btts: t })}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>O 2.5</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outline }]}
            keyboardType="numeric"
            placeholder="Ej: 1.95"
            placeholderTextColor={theme.colors.onSurfaceVariant + "80"}
            value={odds.over}
            onChangeText={t => setOdds({ ...odds, over: t })}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>U 2.5</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outline }]}
            keyboardType="numeric"
            placeholder="Ej: 1.90"
            placeholderTextColor={theme.colors.onSurfaceVariant + "80"}
            value={odds.under}
            onChangeText={t => setOdds({ ...odds, under: t })}
          />
        </View>
      </View>

      {results.length > 0 && (
        <View style={[styles.resultsContainer, { borderColor: theme.colors.outline }]}>
          {results.map((r, i) => {
            const edge = r.res!.edge;
            const isValue = edge > 0;
            const color = isValue ? "#22c55e" : theme.colors.error;
            return (
              <View key={i} style={[styles.resultRow, i > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.outline }]}>
                <View>
                  <Text style={[styles.resLabel, { color: theme.colors.onSurface }]}>{r.label}</Text>
                  <Text style={[styles.resSub, { color: theme.colors.onSurfaceVariant }]}>
                    Implícito: {(r.res!.implied * 100).toFixed(1)}% | Modelo: {(r.prob * 100).toFixed(1)}%
                  </Text>
                </View>
                <View style={[styles.edgeBadge, { backgroundColor: color + "20" }]}>
                  <Text style={{ color, fontWeight: "800", fontSize: 13 }}>
                    {edge > 0 ? "+" : ""}{(edge * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 20, marginTop: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 3 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  title: { fontSize: 18, fontWeight: "800", letterSpacing: 0.3 },
  subtitle: { fontSize: 13, marginBottom: 20, lineHeight: 18 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  inputGroup: { minWidth: 90, flex: 1, flexBasis: "30%" as any, marginBottom: 10 },
  label: { fontSize: 11, fontWeight: "800", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, fontWeight: "600" },
  resultsContainer: { marginTop: 24, borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  resultRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  resLabel: { fontSize: 15, fontWeight: "800", marginBottom: 4 },
  resSub: { fontSize: 12 },
  edgeBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
});
