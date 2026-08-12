/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          bg: "#05070A",
          panel: "#080B10",
          secondary: "#0B0F15",
          border: "#26313D",
          text: "#E6EDF3",
          muted: "#7E8B98",
          blue: "#7FA9C7",
          cyan: "#00D9FF",
          green: "#39D98A",
          amber: "#F2B84B",
          red: "#FF5C5C",
        },
        tars: {
          bg: "#05070A",
          card: "#080B10",
          surface: "#0B0F15",
          border: "#26313D",
          borderLight: "#384759",
          cyan: "#00D9FF",
          cyanGlow: "rgba(0, 217, 255, 0.15)",
          amber: "#F2B84B",
          emerald: "#39D98A",
          rose: "#FF5C5C",
          text: "#E6EDF3",
          muted: "#7E8B98",
        },
        aura: {
          bg: "#06070b",
          card: "#0d111a",
          surface: "#141a26",
          border: "#1e293b",
          borderLight: "#334155",
          cyan: "#00f0ff",
          cyanGlow: "rgba(0, 240, 255, 0.15)",
          amber: "#f59e0b",
          emerald: "#10b981",
          rose: "#f43f5e",
          text: "#f8fafc",
          muted: "#64748b",
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Space Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
    },
  },
  plugins: [],
};
