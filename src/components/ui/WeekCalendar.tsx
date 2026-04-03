import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Platform, Pressable } from "react-native";
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
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
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

const isWeb = Platform.OS === "web";

// Botón de día con mejor compatibilidad web móvil
function DayButton({
  dateStr, day, index, isSelected, isToday, isPast, onPress,
}: {
  dateStr: string;
  day: Date;
  index: number;
  isSelected: boolean;
  isToday: boolean;
  isPast: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  const bgColor = isSelected
    ? theme.colors.primary
    : "transparent";

  const borderStyle = !isSelected && isToday
    ? { borderWidth: 1.5, borderColor: theme.colors.primary }
    : {};

  const dayLabelColor = isSelected ? "#fff" : theme.colors.onSurfaceVariant;
  const dayNumColor   = isSelected
    ? "#fff"
    : isPast
    ? theme.colors.onSurfaceVariant
    : theme.colors.onSurface;

  // En web usamos Pressable con style directo para mejor touch response
  if (isWeb) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.dayBtn,
          { backgroundColor: pressed && !isSelected ? theme.colors.surfaceVariant : bgColor },
          borderStyle,
          // cursor pointer via web style
          { cursor: "pointer" } as any,
        ]}
      >
        <Text style={[styles.dayLabel, { color: dayLabelColor }]}>
          {DAY_LABELS[index]}
        </Text>
        <Text style={[
          styles.dayNumber,
          { color: dayNumColor, fontWeight: isToday || isSelected ? "800" : "500" },
        ]}>
          {day.getDate()}
        </Text>
        {isToday && !isSelected && (
          <View style={[styles.todayDot, { backgroundColor: theme.colors.primary }]} />
        )}
      </Pressable>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.dayBtn, { backgroundColor: bgColor }, borderStyle]}
    >
      <Text style={[styles.dayLabel, { color: dayLabelColor }]}>
        {DAY_LABELS[index]}
      </Text>
      <Text style={[
        styles.dayNumber,
        { color: dayNumColor, fontWeight: isToday || isSelected ? "800" : "500" },
      ]}>
        {day.getDate()}
      </Text>
      {isToday && !isSelected && (
        <View style={[styles.todayDot, { backgroundColor: theme.colors.primary }]} />
      )}
    </TouchableOpacity>
  );
}

export function WeekCalendar({ selectedDate, onSelectDate }: CalendarProps) {
  const theme    = useTheme();
  const todayStr = formatDate(new Date());

  const [weekRef, setWeekRef] = useState(() => new Date());

  const days       = getWeekDays(weekRef);
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

  const NavBtn = ({ onPress, children }: { onPress: () => void; children: React.ReactNode }) =>
    isWeb ? (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.navBtn,
          pressed && { backgroundColor: theme.colors.surfaceVariant },
          { cursor: "pointer" } as any,
        ]}
      >
        {children}
      </Pressable>
    ) : (
      <TouchableOpacity onPress={onPress} style={styles.navBtn}>
        {children}
      </TouchableOpacity>
    );

  return (
    <Surface
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      elevation={1}
    >
      {/* Encabezado mes + navegación */}
      <View style={styles.header}>
        <NavBtn onPress={prevWeek}>
          <ChevronLeft size={18} color={theme.colors.onSurface} strokeWidth={2} />
        </NavBtn>

        {isWeb ? (
          <Pressable
            onPress={goToday}
            style={[{ cursor: "pointer" } as any]}
          >
            <Text style={[styles.monthLabel, { color: theme.colors.onSurface }]}>
              {monthLabel}
            </Text>
          </Pressable>
        ) : (
          <TouchableOpacity onPress={goToday}>
            <Text style={[styles.monthLabel, { color: theme.colors.onSurface }]}>
              {monthLabel}
            </Text>
          </TouchableOpacity>
        )}

        <NavBtn onPress={nextWeek}>
          <ChevronRight size={18} color={theme.colors.onSurface} strokeWidth={2} />
        </NavBtn>
      </View>

      {/* Días */}
      <View style={styles.daysRow}>
        {days.map((day, i) => {
          const dateStr    = formatDate(day);
          const isSelected = dateStr === selectedDate;
          const isToday    = dateStr === todayStr;
          const isPast     = dateStr < todayStr;

          return (
            <DayButton
              key={dateStr}
              dateStr={dateStr}
              day={day}
              index={i}
              isSelected={isSelected}
              isToday={isToday}
              isPast={isPast}
              onPress={() => onSelectDate(dateStr)}
            />
          );
        })}
      </View>

      {/* Botón "Volver a hoy" si la semana visible no contiene hoy */}
      {!days.some((d) => formatDate(d) === todayStr) && (
        isWeb ? (
          <Pressable
            onPress={goToday}
            style={[styles.todayBtn, { cursor: "pointer" } as any]}
          >
            <Text style={[styles.todayBtnText, { color: theme.colors.primary }]}>
              Volver a hoy
            </Text>
          </Pressable>
        ) : (
          <TouchableOpacity onPress={goToday} style={styles.todayBtn}>
            <Text style={[styles.todayBtnText, { color: theme.colors.primary }]}>
              Volver a hoy
            </Text>
          </TouchableOpacity>
        )
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  container:    { borderRadius: 16, marginHorizontal: 16, marginBottom: 8, padding: 12 },
  header:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  navBtn:       { padding: 6, borderRadius: 8 },
  monthLabel:   { fontSize: 14, fontWeight: "700" },
  daysRow:      { flexDirection: "row", justifyContent: "space-between" },
  dayBtn:       { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 10, marginHorizontal: 2, minHeight: 56 },
  dayLabel:     { fontSize: 10, fontWeight: "600", marginBottom: 4 },
  dayNumber:    { fontSize: 15 },
  todayDot:     { width: 4, height: 4, borderRadius: 2, marginTop: 3 },
  todayBtn:     { alignItems: "center", marginTop: 10 },
  todayBtnText: { fontSize: 12, fontWeight: "700" },
});