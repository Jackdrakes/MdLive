import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: "#0f172a",
          secondary: "#1e293b",
          tertiary: "#334155",
        },
        text: {
          primary: "#f1f5f9",
          secondary: "#94a3b8",
        },
        border: {
          DEFAULT: "#475569",
        },
        accent: {
          DEFAULT: "#3b82f6",
        },
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;