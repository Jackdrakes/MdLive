import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: "#1e1e1e",
          secondary: "#242424",
          tertiary: "#2a2a2a",
        },
        text: {
          primary: "#dadada",
          secondary: "#999999",
        },
        border: {
          DEFAULT: "#3f3f3f",
        },
        accent: {
          DEFAULT: "#7ea9f9",
        },
        success: "#44cf6e",
        warning: "#e9973f",
        error: "#fb464c",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;