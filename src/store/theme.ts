import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";
import type { MD3Theme } from "react-native-paper";

// Paleta de colores ScoreFlow
const palette = {
  green:      "#22c55e",
  greenDark:  "#16a34a",
  slate900:   "#0f172a",
  slate800:   "#1e293b",
  slate700:   "#334155",
  slate600:   "#475569",
  slate200:   "#e2e8f0",
  slate100:   "#f1f5f9",
  white:      "#ffffff",
  amber:      "#f59e0b",
  red:        "#ef4444",
  blue:       "#3b82f6",
};

export const ScoreFlowDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary:          palette.green,
    primaryContainer: palette.greenDark,
    secondary:        palette.amber,
    background:       palette.slate900,
    surface:          palette.slate800,
    surfaceVariant:   palette.slate700,
    onBackground:     palette.white,
    onSurface:        palette.slate200,
    onSurfaceVariant: palette.slate600,
    outline:          palette.slate700,
    error:            palette.red,
  },
};

export const ScoreFlowLightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary:          palette.greenDark,
    primaryContainer: "#dcfce7",
    secondary:        palette.amber,
    background:       palette.slate100,
    surface:          palette.white,
    surfaceVariant:   "#f8fafc",
    onBackground:     palette.slate900,
    onSurface:        palette.slate800,
    onSurfaceVariant: palette.slate600,
    outline:          palette.slate200,
    error:            palette.red,
  },
};
