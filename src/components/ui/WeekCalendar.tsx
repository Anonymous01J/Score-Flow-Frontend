import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Text, useTheme, Surface } from "react-native-paper";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

interface CalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getWeekDays(referenceDate: Date): Date[] {
  const d = new Date(referenceDate);
  const day = d.getDay(); // 0=dom
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7)); // ajuste a lunes
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return dd;
  });
}

const DAY_LABELS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

export function WeekCalendar({ selectedDate, onSelectDate }: CalendarProps) {
  const theme   = useTheme();
  const todayStr = formatDate(new Date());

  // semana de referencia (lunes de la semana actual por defecto)
  const [weekRef, setWeekRef] = useState(() => new Date());

  const days = getWeekDays(weekRef);
  const monthLabel = `${MONTH_NAMES[days[0].getMonth()]} ${days[0].getFullYear()}`;

  const prevWeek = () => {
    const d = new Date(weekRef);
    d.setDate(d.getDate() - 7);
    setWeekRef(d);
  };

  const nextWeek = () => {
    const d = new Date(weekRef);
    d.setDate(d.getDate() + 7);
    setWeekRef(d);
  };

  const goToday = () => {
    setWeekRef(new Date());
    onSelectDate(todayStr);
  };

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]} elevation={1}>
      {/* Encabezado mes + navegación */}
      <View style={styles.header}>
        <TouchableOpacity onPress={prevWeek} style={styles.navBtn}>
          <ChevronLeft size={18} color={theme.colors.onSurface} strokeWidth={2} />
        </TouchableOpacity>

        <TouchableOpacity onPress={goToday}>
          <Text style={[styles.monthLabel, { color: theme.colors.onSurface }]}>
            {monthLabel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={nextWeek} style={styles.navBtn}>
          <ChevronRight size={18} color={theme.colors.onSurface} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Días de la semana */}
      <View style={styles.daysRow}>
        {days.map((day, i) => {
          const dateStr  = formatDate(day);
          const isSelected = dateStr === selectedDate;
          const isToday    = dateStr === todayStr;
          const isPast     = dateStr < todayStr;

          return (
            <TouchableOpacity
              key={dateStr}
              onPress={() => onSelectDate(dateStr)}
              style={[
                styles.dayBtn,
                isSelected && { backgroundColor: theme.colors.primary },
                !isSelected && isToday && {
                  borderWidth: 1.5,
                  borderColor: theme.colors.primary,
                },
              ]}
            >
              <Text style={[
                styles.dayLabel,
                { color: isSelected ? "#fff" : theme.colors.onSurfaceVariant },
              ]}>
                {DAY_LABELS[i]}
              </Text>
              <Text style={[
                styles.dayNumber,
                {
                  color: isSelected
                    ? "#fff"
                    : isPast
                    ? theme.colors.onSurfaceVariant
                    : theme.colors.onSurface,
                  fontWeight: isToday || isSelected ? "800" : "500",
                },
              ]}>
                {day.getDate()}
              </Text>
              {/* Dot para "hoy" cuando no está seleccionado */}
              {isToday && !isSelected && (
                <View style={[styles.todayDot, { backgroundColor: theme.colors.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Botón "Hoy" si la semana visible no contiene hoy */}
      {!days.some((d) => formatDate(d) === todayStr) && (
        <TouchableOpacity onPress={goToday} style={styles.todayBtn}>
          <Text style={[styles.todayBtnText, { color: theme.colors.primary }]}>
            Volver a hoy
          </Text>
        </TouchableOpacity>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  container:   { borderRadius: 16, marginHorizontal: 16, marginBottom: 8, padding: 12 },
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  navBtn:      { padding: 6, borderRadius: 8 },
  monthLabel:  { fontSize: 14, fontWeight: "700" },
  daysRow:     { flexDirection: "row", justifyContent: "space-between" },
  dayBtn:      { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 10, marginHorizontal: 2 },
  dayLabel:    { fontSize: 10, fontWeight: "600", marginBottom: 4 },
  dayNumber:   { fontSize: 15 },
  todayDot:    { width: 4, height: 4, borderRadius: 2, marginTop: 3 },
  todayBtn:    { alignItems: "center", marginTop: 10 },
  todayBtnText:{ fontSize: 12, fontWeight: "700" },
});
