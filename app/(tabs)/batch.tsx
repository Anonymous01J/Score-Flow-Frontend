import React, { useState } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView, TextInput, Platform } from "react-native";
import { Text, useTheme, ActivityIndicator, Surface, Chip } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Radar, Play, Copy, Zap, ShieldAlert, Filter } from "lucide-react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { api, rateLimiter } from "../../src/utils/api";
import { LEAGUES, QUALITY_LABELS } from "../../src/utils/constants";
import type { Fixture, Prediction, LeagueKey } from "../../src/types";
import { ValueBetCard } from "../../src/components/ui/ValueBetCard";
import ValueBetsCalculator from "../../src/components/ValueBetsCalculator";
import { formatTelegramMessage } from "../../src/utils/telegramFormat";
import * as Clipboard from "expo-clipboard";
import { computeConfidence } from "../../src/utils/confidence";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const LIGAS = Object.values(LEAGUES);

const BatchResultCard = ({ item, theme }: { item: { fx: Fixture & { league?: string }; pred: Prediction | null }, theme: any }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!item.pred) {
    return (
      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
         <Text style={{ color: theme.colors.error }}>Error al analizar: {item.fx.home_team} vs {item.fx.away_team}</Text>
      </Surface>
    );
  }
  
  const p = item.pred;
  const qInfo = QUALITY_LABELS[p.sample_quality];
  const hasValue = p.value_bets && p.value_bets.length > 0;
  const confScore = computeConfidence(p);

  return (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: hasValue ? theme.colors.primary : "transparent", borderWidth: hasValue ? 1 : 0 }]} elevation={1}>
       <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7} style={styles.cardHeader}>
           <View style={{ flex: 1, paddingRight: 8 }}>
               <Text style={[styles.cardLeague, { color: theme.colors.onSurfaceVariant }]}>{LEAGUES[p.league]?.name} • {p.match_date}</Text>
               <Text style={[styles.cardTeams, { color: theme.colors.onSurface }]}>{p.home_team} vs {p.away_team}</Text>
           </View>
           <View style={{ alignItems: "flex-end" }}>
               <View style={[styles.badge, { backgroundColor: qInfo?.color + "20", marginBottom: 4 }]}>
                   <Text style={{ color: qInfo?.color, fontSize: 10, fontWeight: "800" }}>{qInfo?.label} ({confScore.toFixed(0)}%)</Text>
               </View>
               <Text style={{ color: theme.colors.primary, fontSize: 10, fontWeight: "800", textTransform: "uppercase" }}>
                  {expanded ? "Ocultar detalles" : "Ver detalles"}
               </Text>
           </View>
       </TouchableOpacity>

       {expanded && (
          <View style={{ marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.outline }}>
             <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                   <Text style={{ fontSize: 10, color: theme.colors.onSurfaceVariant, textTransform: "uppercase", fontWeight: "700" }}>Local</Text>
                   <Text style={{ fontSize: 14, fontWeight: "800", color: theme.colors.primary }}>{(p.prob_home_win * 100).toFixed(1)}%</Text>
                </View>
                <View style={{ flex: 1, alignItems: "center" }}>
                   <Text style={{ fontSize: 10, color: theme.colors.onSurfaceVariant, textTransform: "uppercase", fontWeight: "700" }}>Empate</Text>
                   <Text style={{ fontSize: 14, fontWeight: "800", color: theme.colors.onSurface }}>{(p.prob_draw * 100).toFixed(1)}%</Text>
                </View>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                   <Text style={{ fontSize: 10, color: theme.colors.onSurfaceVariant, textTransform: "uppercase", fontWeight: "700" }}>Visitante</Text>
                   <Text style={{ fontSize: 14, fontWeight: "800", color: "#3b82f6" }}>{(p.prob_away_win * 100).toFixed(1)}%</Text>
                </View>
             </View>
             <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <View>
                   <Text style={{ fontSize: 10, color: theme.colors.onSurfaceVariant, textTransform: "uppercase", fontWeight: "700" }}>BTTS (Ambos Marcan)</Text>
                   <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.onSurface }}>{(p.prob_btts * 100).toFixed(1)}%</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                   <Text style={{ fontSize: 10, color: theme.colors.onSurfaceVariant, textTransform: "uppercase", fontWeight: "700" }}>Más de 2.5 Goles</Text>
                   <Text style={{ fontSize: 13, fontWeight: "700", color: theme.colors.onSurface }}>{(p.prob_over_25 * 100).toFixed(1)}%</Text>
                </View>
             </View>
             
             <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.outline, paddingTop: 12 }}>
                <ValueBetsCalculator prediction={p} />
             </View>
          </View>
       )}

       {hasValue ? (
          <View style={styles.valueBetsBox}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                 <Zap size={14} color={theme.colors.primary} fill={theme.colors.primary} />
                 <Text style={{ fontSize: 12, fontWeight: "800", color: theme.colors.primary, textTransform: "uppercase" }}>Value Bets</Text>
              </View>
              {p.value_bets.map((vb, idx) => <ValueBetCard key={idx} vb={vb} />)}
          </View>
       ) : (
          <View style={styles.noValueBox}>
              <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>Sin valor detectado</Text>
          </View>
       )}
    </Surface>
  );
};

// Se ha eliminado el estado global manual de Rate Limit aquí,
// ya que ahora se gestiona de forma centralizada y persistente en api.ts

export default function BatchScreen() {
  const theme = useTheme();
  
  // State
  const [selectedLeagues, setSelectedLeagues] = useState<LeagueKey[]>(["world_cup", "premier_league"]);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });
  
  const [confidenceFilter, setConfidenceFilter] = useState<"todas"|"alta"|"media"|"baja">("todas");
  
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  
  const [isRunning, setIsRunning] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<{ fx: Fixture & { league?: string }; pred: Prediction | null }[]>([]);

  // Escuchar al rate limiter global para actualizar la UI durante las pausas
  React.useEffect(() => {
    const unsub = rateLimiter.subscribe(({ isPaused, secondsLeft }) => {
      if (isPaused) {
        setProgressMsg(`Pausa de seguridad (Límite API): ${secondsLeft}s restantes...`);
      }
    });
    return unsub;
  }, []);

  const toggleLeague = (key: LeagueKey) => {
    setSelectedLeagues(prev => 
      prev.includes(key) ? prev.filter(l => l !== key) : [...prev, key]
    );
  };

  const getDatesBetween = (start: string, end: string) => {
    const dates = [];
    let curr = new Date(start);
    const last = new Date(end);
    while (curr <= last) {
      dates.push(curr.toISOString().split("T")[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };

  const runBatch = async () => {
    if (selectedLeagues.length === 0) {
      alert("Selecciona al menos una liga");
      return;
    }

    setIsRunning(true);
    setResults([]);
    setProgress({ done: 0, total: 0 });

    try {
      const dates = getDatesBetween(fromDate, toDate);
      if (dates.length === 0) {
        alert("Rango de fechas inválido");
        setIsRunning(false);
        return;
      }

      // --- 1. BÚSQUEDA DE PARTIDOS ---
      const allFixtures: (Fixture & { league?: string })[] = [];
      for (const league of selectedLeagues) {
        for (const date of dates) {
          setProgressMsg(`Buscando partidos... (${LEAGUES[league]?.name || league} - ${date})`);
          
          let success = false;
          let retries = 3;
          while (retries > 0 && !success) {
              try {
                 const fx = await api.getFixtures(league, date);
                 const mappedFx = fx.map(f => ({ ...f, league }));
                 allFixtures.push(...mappedFx);
                 success = true;
              } catch(e) {
                 retries--;
                 if (retries > 0) await new Promise(r => setTimeout(r, 2000));
              }
          }
          await new Promise(r => setTimeout(r, 500));
        }
      }

      if (allFixtures.length === 0) {
        alert("No se encontraron partidos programados.");
        setIsRunning(false);
        return;
      }

      // --- 2. OBTENER PREDICCIONES ---
      const finalResults: { fx: Fixture & { league?: string }; pred: Prediction | null }[] = [];
      setProgress({ done: 0, total: allFixtures.length });
      
      for (let i = 0; i < allFixtures.length; i++) {
        const fx = allFixtures[i];
        
        setProgressMsg(`Analizando: ${fx.home_team} vs ${fx.away_team}`);
        
        let pResult = null;
        let retries = 3;
        while (retries > 0 && !pResult) {
            try {
                pResult = await api.getPrediction(fx.fixture_id, fx.league as LeagueKey);
            } catch(e) {
                retries--;
                if (retries > 0) await new Promise(r => setTimeout(r, 2000));
            }
        }
        
        finalResults.push({ fx, pred: pResult });
        setResults(prev => [...prev, { fx, pred: pResult }]);
        setProgress({ done: i + 1, total: allFixtures.length });
        
        // Pausa base para no saturar procesos
        await new Promise(r => setTimeout(r, 1000));
      }
      
      setProgressMsg("¡Análisis completado!");
    } catch (e) {
      alert("Ocurrió un error en el lote.");
    } finally {
      setIsRunning(false);
    }
  };

  const filteredResults = results.filter(r => {
    if (!r.pred) return false;
    if (confidenceFilter !== "todas" && r.pred.sample_quality !== confidenceFilter) {
        return false;
    }
    return true;
  });

  const copyResults = async () => {
      const valid = filteredResults.filter(r => r.pred);
      if (valid.length === 0) return;
      
      let msg = "🔥 SCOREFLOW - LOTE 🔥\n\n";
      for (const item of valid) {
          msg += formatTelegramMessage(item.pred!) + "\n\n";
      }
      await Clipboard.setStringAsync(msg);
      alert("¡Copiado al portapapeles!");
  };

  const renderItem = ({ item }: { item: { fx: Fixture & { league?: string }; pred: Prediction | null } }) => {
    return <BatchResultCard item={item} theme={theme} />;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
       <View style={styles.header}>
         <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Radar size={24} color={theme.colors.primary} />
            <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>Escáner Lote</Text>
         </View>
         <TouchableOpacity onPress={copyResults} style={styles.copyBtn}>
             <Copy size={18} color={theme.colors.primary} />
         </TouchableOpacity>
       </View>

       <ScrollView style={styles.configArea} showsVerticalScrollIndicator={false}>
          {/* Ligas */}
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>LIGAS A ESCANEAR</Text>
          <View style={styles.chipsRow}>
             {LIGAS.map(l => (
                 <Chip 
                    key={l.key} 
                    selected={selectedLeagues.includes(l.key)}
                    onPress={() => toggleLeague(l.key)}
                    style={{ backgroundColor: selectedLeagues.includes(l.key) ? theme.colors.primary + "30" : theme.colors.surface }}
                    textStyle={{ color: selectedLeagues.includes(l.key) ? theme.colors.primary : theme.colors.onSurface }}
                 >
                    {l.name}
                 </Chip>
             ))}
          </View>

          {/* Fechas */}
          <View style={styles.datesRow}>
             <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant }]}>Desde</Text>
                {Platform.OS === 'web' ? (
                  <TextInput
                      {...({ type: "date" } as any)}
                      style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outline }]}
                      value={fromDate}
                      onChangeText={setFromDate}
                  />
                ) : (
                  <>
                    <TouchableOpacity style={[styles.input, { borderColor: theme.colors.outline, height: 42, justifyContent: "center" }]} onPress={() => setShowFromPicker(true)}>
                        <Text style={{ color: theme.colors.onSurface, fontWeight: "600" }}>{fromDate}</Text>
                    </TouchableOpacity>
                    {showFromPicker && (
                        <DateTimePicker
                            value={new Date(fromDate + "T12:00:00Z")}
                            mode="date"
                            display="default"
                            onValueChange={(date) => {
                                setShowFromPicker(false);
                                if (date) setFromDate(date.toISOString().split("T")[0]);
                            }}
                            onDismiss={() => setShowFromPicker(false)}
                        />
                    )}
                  </>
                )}
             </View>
             <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant }]}>Hasta</Text>
                {Platform.OS === 'web' ? (
                  <TextInput
                      {...({ type: "date" } as any)}
                      style={[styles.input, { color: theme.colors.onSurface, borderColor: theme.colors.outline }]}
                      value={toDate}
                      onChangeText={setToDate}
                  />
                ) : (
                  <>
                    <TouchableOpacity style={[styles.input, { borderColor: theme.colors.outline, height: 42, justifyContent: "center" }]} onPress={() => setShowToPicker(true)}>
                        <Text style={{ color: theme.colors.onSurface, fontWeight: "600" }}>{toDate}</Text>
                    </TouchableOpacity>
                    {showToPicker && (
                        <DateTimePicker
                            value={new Date(toDate + "T12:00:00Z")}
                            mode="date"
                            display="default"
                            onValueChange={(date) => {
                                setShowToPicker(false);
                                if (date) setToDate(date.toISOString().split("T")[0]);
                            }}
                            onDismiss={() => setShowToPicker(false)}
                        />
                    )}
                  </>
                )}
             </View>
          </View>

          {/* Escanear */}
          <TouchableOpacity 
             style={[styles.scanBtn, { backgroundColor: isRunning ? theme.colors.surfaceVariant : theme.colors.primary }]}
             onPress={runBatch}
             disabled={isRunning}
          >
              {isRunning ? <ActivityIndicator size="small" color={theme.colors.primary} /> : <Play size={20} color={theme.colors.onPrimary} fill={theme.colors.onPrimary} />}
              <Text style={[styles.scanBtnText, { color: isRunning ? theme.colors.primary : theme.colors.onPrimary }]}>
                  {isRunning ? "ESCANEANDO..." : "INICIAR ESCANEO"}
              </Text>
          </TouchableOpacity>

          {isRunning && (
              <View style={[styles.progressBox, { backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.progressMsg, { color: theme.colors.onSurface }]}>{progressMsg}</Text>
                  {progress.total > 0 && (
                      <View style={[styles.progressBarBg, { backgroundColor: theme.colors.outline }]}>
                          <View style={[styles.progressBarFill, { backgroundColor: theme.colors.primary, width: `${(progress.done / progress.total) * 100}%` }]} />
                      </View>
                  )}
                  {progress.total > 0 && (
                      <Text style={[styles.progressCount, { color: theme.colors.onSurfaceVariant }]}>
                          {progress.done} / {progress.total} completados
                      </Text>
                  )}
              </View>
          )}

          {/* Filtros */}
          {results.length > 0 && !isRunning && (
              <View style={styles.filterBox}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <Filter size={14} color={theme.colors.onSurfaceVariant} />
                      <Text style={{ fontSize: 12, fontWeight: "700", color: theme.colors.onSurfaceVariant, textTransform: "uppercase" }}>Filtro de Confianza</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                      {(["todas", "alta", "media", "baja"] as const).map(f => (
                          <TouchableOpacity 
                              key={f}
                              style={[styles.filterChip, confidenceFilter === f ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.surfaceVariant }]}
                              onPress={() => setConfidenceFilter(f)}
                          >
                              <Text style={{ color: confidenceFilter === f ? theme.colors.onPrimary : theme.colors.onSurface, fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>
                                  {f}
                              </Text>
                          </TouchableOpacity>
                      ))}
                  </View>
              </View>
          )}

          {/* Resultados */}
          {results.length > 0 && !isRunning && (
              <View style={{ marginTop: 16 }}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
                      RESULTADOS ({filteredResults.length})
                  </Text>
                  {filteredResults.map((item, idx) => (
                      <View key={idx}>{renderItem({ item })}</View>
                  ))}
              </View>
          )}
          
          <View style={{ height: 40 }} />
       </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontWeight: "800", letterSpacing: -0.5 },
  copyBtn: { padding: 8 },
  configArea: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 11, fontWeight: "800", letterSpacing: 1, marginBottom: 12 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  datesRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  inputLabel: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontWeight: "600" },
  scanBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 12, marginBottom: 20 },
  scanBtnText: { fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },
  progressBox: { padding: 16, borderRadius: 12, marginBottom: 20 },
  progressMsg: { fontSize: 13, fontWeight: "600", marginBottom: 12 },
  progressBarBg: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 8 },
  progressBarFill: { height: "100%", borderRadius: 3 },
  progressCount: { fontSize: 11, textAlign: "right", fontWeight: "600" },
  filterBox: { marginBottom: 20 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  card: { borderRadius: 14, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  cardLeague: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginBottom: 4 },
  cardTeams: { fontSize: 15, fontWeight: "800" },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  valueBetsBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(150,150,150,0.2)" },
  noValueBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(150,150,150,0.2)" }
});
