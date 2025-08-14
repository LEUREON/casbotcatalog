/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        background: "#100e1b",
        surface: "rgba(255,255,255,0.05)",
        border: "rgba(255,255,255,0.10)",
        textPrimary: "#ffffff",
        textSecondary: "#a09cb8",
        neon: "#caff48",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}