import type { Config } from "tailwindcss";

// MaRe palette — pulled directly from the official brand guidelines.
// Primary: Light, Key, Extra Dark, Dark, Brand Brown.
// Secondary: Water-50, Brown-200, Water-300, Water-900.
const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        // Principal: Playfair Display (titles only)
        // Complementary: Manrope (sub-headings, numbers)
        // Body: Albert Sans (body copy, headers, footers)
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Albert Sans", "ui-sans-serif", "system-ui"],
        display: ["var(--font-display)", "Manrope", "ui-sans-serif", "system-ui"],
      },
      colors: {
        // MaRe primary palette
        mare: {
          light: "#e2e2de",        // Primary · Light
          key: "#296167",          // Primary · Key (deep teal)
          "extra-dark": "#2A2420",
          dark: "#3B3632",
          brown: "#653D24",        // Primary · Brand Brown
        },
        // MaRe secondary palette
        water: {
          50: "#e4eced",
          300: "#7c9fa3",
          900: "#0c1d1f",
        },
        brown: {
          200: "#c1b1a7",
        },
        // Legacy aliases so existing Tailwind classes keep working while we
        // migrate components to the MaRe palette. All alias to MaRe equivalents.
        bone: {
          50: "#f3f3ef",           // off-Light
          100: "#e2e2de",          // Light
          200: "#d4d4cf",
          300: "#c1b1a7",          // Brown-200 (warm muted)
        },
        charcoal: {
          900: "#2A2420",          // Extra Dark
          800: "#3B3632",          // Dark
          700: "#4a4540",
          600: "#635d55",
          500: "#7c7670",
        },
        accent: {
          500: "#296167",          // Key
          600: "#1f4a50",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
