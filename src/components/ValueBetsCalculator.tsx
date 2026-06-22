import React, { useState } from "react";
import { View, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { Text, Surface, useTheme } from "react-native-paper";
import { Calculator } from "lucide-react-native";
import type { Prediction } from "../types";

export default function ValueBetsCalculator({ prediction }: { prediction: Prediction }) {
  const theme = useTheme();
  const [odds, setOdds] = useState({ 
    home: "", draw: "", away: "", 
    btts: "", over: "", under: "",
    dc1X: "", dc12: "", dcX2: "",
    dnb1: "", dnb2: ""
  });
  const [bankroll, setBankroll] = useState("");
  const [kellyFraction, setKellyFraction] = useState<"quarter" | "half">("quarter");

  const calcEdge = (modelProb: number, oddStr: string) => {
    if (!oddStr) return null;
    const odd = parseFloat(oddStr.replace(",", "."));
    if (isNaN(odd)) return null;

    let implied = 0;
    let decimalOdd = 0;
    
    // Detectar cuota americana: tiene signo explícito o es >= 100 / <= -100
    if (oddStr.includes('+') || oddStr.includes('-') || Math.abs(odd) >= 100) {
      if (odd > 0) {
        implied = 100 / (odd + 100);
        decimalOdd = (odd / 100) + 1;
      } else if (odd < 0) {
        implied = Math.abs(odd) / (Math.abs(odd) + 100);
        decimalOdd = (100 / Math.abs(odd)) + 1;
      } else {
        return null;
      }
    } else {
      // Decimal normal
      if (odd <= 1.0) return null;
      implied = 1 / odd;
      decimalOdd = odd;
    }

    const edge = modelProb - implied;
    
    let kellyPct = 0;
    const b = decimalOdd - 1;
    if (b > 0 && edge > 0) {
      const p = modelProb;
      const q = 1 - p;
      const fullKelly = (b * p - q) / b;
      if (fullKelly > 0) {
        kellyPct = kellyFraction === "half" ? fullKelly / 2 : fullKelly / 4;
      }
    }

    return { oddStr, implied, edge, kellyPct };
  };

  const p1X = prediction.prob_home_win + prediction.prob_draw;
  const p12 = prediction.prob_home_win + prediction.prob_away_win;
  const pX2 = prediction.prob_draw + prediction.prob_away_win;
  
  const pDnb1 = prediction.prob_home_win / (prediction.prob_home_win + prediction.prob_away_win);
  const pDnb2 = prediction.prob_away_win / (prediction.prob_home_win + prediction.prob_away_win);

  const results = [
    { label: "Local (1)", prob: prediction.prob_home_win, odd: odds.home },
    { label: "Empate (X)", prob: prediction.prob_draw, odd: odds.draw },
    { label: "Visitante (2)", prob: prediction.prob_away_win, odd: odds.away },
    { label: "1X (Local o Empate)", prob: p1X, odd: odds.dc1X },
    { label: "12 (Cualquiera Gana)", prob: p12, odd: odds.dc12 },
    { label: "X2 (Empate o Visitante)", prob: pX2, odd: odds.dcX2 },
    { label: "Local S/E (DNB)", prob: pDnb1, odd: odds.dnb1 },
    { label: "Visitante S/E (DNB)", prob: pDnb2, odd: odds.dnb2 },
    { label: "Ambos Marcan (BTTS)", prob: prediction.prob_btts, odd: odds.btts },
    { label: "Over 2.5", prob: prediction.prob_over_25, odd: odds.over },
    { label: "Under 2.5", prob: prediction.prob_under_25, odd: odds.under },
  ].map(r => ({ ...r, res: calcEdge(r.prob, r.odd) })).filter(r => r.res !== null);

  const handleTextChange = (key: keyof typeof odds, text: string) => {
    // Filtro para eliminar letras y dejar solo números, +, -, punto y coma
    const filtered = text.replace(/[^0-9\+\-\.,]/g, '');
    setOdds({ ...odds, [key]: filtered });
  };

  return (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <View style={styles.header}>
        <Calculator size={18} color={theme.colors.primary} />
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>Calculadora Manual</Text>
      </View>
      <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Ingresa las cuotas de tu casa de apuestas para encontrar valor. (Ej: 2.10, -450, +120)
      </Text>

      <View style={styles.bankrollSection}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Fondos ($)</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outline }]}
            keyboardType="numeric"
            placeholder="Ej: 1000"
            placeholderTextColor={theme.colors.onSurfaceVariant + "80"}
            value={bankroll}
            onChangeText={t => setBankroll(t.replace(/[^0-9\.]/g, ''))}
          />
        </View>
        <View style={{ flex: 1.2 }}>
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Estrategia</Text>
          <View style={[styles.toggleGroup, { borderColor: theme.colors.outline }]}>
            <TouchableOpacity 
              style={[styles.toggleBtn, kellyFraction === "quarter" && { backgroundColor: theme.colors.primary }]}
              onPress={() => setKellyFraction("quarter")}
            >
              <Text style={[styles.toggleText, { color: kellyFraction === "quarter" ? theme.colors.onPrimary : theme.colors.onSurface }]}>Kelly 1/4</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, kellyFraction === "half" && { backgroundColor: theme.colors.primary, borderLeftColor: theme.colors.primary }]}
              onPress={() => setKellyFraction("half")}
            >
              <Text style={[styles.toggleText, { color: kellyFraction === "half" ? theme.colors.onPrimary : theme.colors.onSurface }]}>Kelly 1/2</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>1 (Local)</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outline }]}
            keyboardType="numeric"
            placeholder="Ej: +120"
            placeholderTextColor={theme.colors.onSurfaceVariant + "80"}
            value={odds.home}
            onChangeText={t => handleTextChange("home", t)}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>X (Empate)</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outline }]}
            keyboardType="numeric"
            placeholder="Ej: +220"
            placeholderTextColor={theme.colors.onSurfaceVariant + "80"}
            value={odds.draw}
            onChangeText={t => handleTextChange("draw", t)}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>2 (Visit)</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outline }]}
            keyboardType="numeric"
            placeholder="Ej: -150"
            placeholderTextColor={theme.colors.onSurfaceVariant + "80"}
            value={odds.away}
            onChangeText={t => handleTextChange("away", t)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>1X</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outline }]}
            keyboardType="numeric"
            placeholder="-200"
            placeholderTextColor={theme.colors.onSurfaceVariant + "80"}
            value={odds.dc1X}
            onChangeText={t => handleTextChange("dc1X", t)}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>12</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outline }]}
            keyboardType="numeric"
            placeholder="-350"
            placeholderTextColor={theme.colors.onSurfaceVariant + "80"}
            value={odds.dc12}
            onChangeText={t => handleTextChange("dc12", t)}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>X2</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outline }]}
            keyboardType="numeric"
            placeholder="+110"
            placeholderTextColor={theme.colors.onSurfaceVariant + "80"}
            value={odds.dcX2}
            onChangeText={t => handleTextChange("dcX2", t)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>DNB 1</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outline }]}
            keyboardType="numeric"
            placeholder="-150"
            placeholderTextColor={theme.colors.onSurfaceVariant + "80"}
            value={odds.dnb1}
            onChangeText={t => handleTextChange("dnb1", t)}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>DNB 2</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outline }]}
            keyboardType="numeric"
            placeholder="+130"
            placeholderTextColor={theme.colors.onSurfaceVariant + "80"}
            value={odds.dnb2}
            onChangeText={t => handleTextChange("dnb2", t)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>BTTS</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outline }]}
            keyboardType="numeric"
            placeholder="Ej: -110"
            placeholderTextColor={theme.colors.onSurfaceVariant + "80"}
            value={odds.btts}
            onChangeText={t => handleTextChange("btts", t)}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>O 2.5</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outline }]}
            keyboardType="numeric"
            placeholder="Ej: -105"
            placeholderTextColor={theme.colors.onSurfaceVariant + "80"}
            value={odds.over}
            onChangeText={t => handleTextChange("over", t)}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>U 2.5</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outline }]}
            keyboardType="numeric"
            placeholder="Ej: -115"
            placeholderTextColor={theme.colors.onSurfaceVariant + "80"}
            value={odds.under}
            onChangeText={t => handleTextChange("under", t)}
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
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resLabel, { color: theme.colors.onSurface }]}>{r.label}</Text>
                  <Text style={[styles.resSub, { color: theme.colors.onSurfaceVariant }]}>
                    Implícito: {(r.res!.implied * 100).toFixed(1)}% | Modelo: {(r.prob * 100).toFixed(1)}%
                  </Text>
                  {isValue && bankroll && r.res!.kellyPct > 0 ? (
                    <Text style={[styles.resBet, { color: theme.colors.primary }]}>
                      • Apostar: ${ (parseFloat(bankroll) * r.res!.kellyPct).toFixed(2) } ({ (r.res!.kellyPct * 100).toFixed(1) }%)
                    </Text>
                  ) : null}
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
  resBet: { fontSize: 12, fontWeight: "800", marginTop: 4 },
  edgeBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginLeft: 10 },
  bankrollSection: { flexDirection: "row", gap: 12, marginBottom: 20 },
  toggleGroup: { flexDirection: "row", borderWidth: 1, borderRadius: 10, overflow: "hidden", height: 40 },
  toggleBtn: { flex: 1, justifyContent: "center", alignItems: "center" },
  toggleText: { fontSize: 12, fontWeight: "700" },
});
