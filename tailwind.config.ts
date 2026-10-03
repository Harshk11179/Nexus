import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07070a",
        ivory: "#f1ede4",
        gold: "#c8a96a",
        graphite: "#1a1a1f",
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ['"Inter Variable"', "Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono Variable"', "ui-monospace", "monospace"],
      },
      transitionTimingFunction: {
        nexus: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      borderColor: {
        hair: "rgba(255,255,255,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
