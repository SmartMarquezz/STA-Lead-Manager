import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sta: {
          logo: "#006CB8",
          navy: "#0D2847",
          "navy-mid": "#1B4971",
          "navy-light": "#2A6496",
          sky: "#7EC8E3",
          teal: "#3D8EB0",
          cyan: "#00B4E4",
          "cyan-hover": "#0099C7",
          panel: "rgba(13, 40, 71, 0.85)",
        },
        platinum: "#7C3AED",
        diamond: "#006CB8",
        gold: "#D97706",
        silver: "#6B7280",
        committed: "#16A34A",
        hot: "#DC2626",
        "in-progress": "#3D8EB0",
        declined: "#EF4444",
        background: "#F4F8FB",
        foreground: "#0D2847",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Helvetica Neue", "Arial", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        sta: "0 4px 24px rgba(13, 40, 71, 0.12)",
        "sta-lg": "0 8px 32px rgba(13, 40, 71, 0.16)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
