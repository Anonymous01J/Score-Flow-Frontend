import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Este archivo configura el HTML base para la versión web.
 * Aquí colocamos las etiquetas Open Graph (OG) y Twitter Cards para redes sociales.
 * NOTA: Para que las imágenes funcionen en redes sociales, deben tener URLs absolutas (empezar por http://...).
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Configuración SEO Básica */}
        <title>ScoreFlow | Predicciones Estadísticas de Fútbol</title>
        <meta name="description" content="Motor predictivo de Value Bets usando modelo de Poisson, Dixon-Coles y Rating Elo para fútbol." />

        {/* Open Graph / Facebook / WhatsApp */}
        <meta property="og:type" content="website" />
        {/* Cambia esto por la URL final donde hospedes tu app web */}
        <meta property="og:url" content="https://score-flow.vercel.app/" /> 
        <meta property="og:title" content="ScoreFlow | Predicciones Estadísticas de Fútbol" />
        <meta property="og:description" content="⚽ Predicciones diarias de partidos con modelo estadístico. Analizamos las mejores ligas del mundo para darte las predicciones más precisas.
          🏆 Ligas cubiertas:
          🌍 Mundial 2026
          🏴 Premier League 🇪🇸 La Liga
          🇩🇪 Bundesliga 🇮🇹 Serie A
          🇫🇷 Ligue 1 🏆 Champions" />
        
        {/* IMPORTANTE: La imagen debe ser una URL absoluta y preferiblemente de 1200x630 píxeles */}
        <meta property="og:image" content="https://raw.githubusercontent.com/Anonymous01J/ScoreFlow-Batch/refs/heads/main/logo.jpg" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://score-flow.vercel.app/" />
        <meta name="twitter:title" content="ScoreFlow | Predicciones Estadísticas de Fútbol" />
        <meta name="twitter:description" content="⚽ Predicciones diarias de partidos con modelo estadístico. Analizamos las mejores ligas del mundo para darte las predicciones más precisas.
          🏆 Ligas cubiertas:
          🌍 Mundial 2026
          🏴 Premier League 🇪🇸 La Liga
          🇩🇪 Bundesliga 🇮🇹 Serie A
          🇫🇷 Ligue 1 🏆 Champions" />
        <meta name="twitter:image" content="https://raw.githubusercontent.com/Anonymous01J/ScoreFlow-Batch/refs/heads/main/logo.jpg" />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
