/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#0D5C3D",
        "primary-light": "#1B7A52",
        "primary-soft": "#E8F5F0",
        "primary-muted": "#2D6A4F",
        surface: "#F5F9F5",
        "surface-card": "#FFFFFF",
        border: "#D1E7DD",
        "text-heading": "#0F172A",
        "text-body": "#475569",
        "text-muted": "#64748B",
        background: "#F8FAF9",
        accent: "#059669",
      },
      borderRadius: {
        "2.5xl": "20px",
        "3xl": "24px",
      },
    },
  },
  plugins: [],
};
