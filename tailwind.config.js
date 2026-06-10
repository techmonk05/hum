/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        hum: {
  cream:      "#1A1014",
  peach:      "#3D2030",
  rose:       "#4A1B2E",
  blush:      "#2D1820",
  terracotta: "#D4785A",
  brown:      "#F5DDD0",
  warm:       "#120C10",
  orange:     "#FF8C5A",
  muted:      "#A67868",
  deep:       "#E8856A",
},
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        sans:    ["Nunito", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        warm:   "0 4px 20px rgba(212,120,90,0.12)",
        "warm-lg": "0 8px 32px rgba(212,120,90,0.25)",
      },
      maxWidth: {
        mobile: "430px",
      },
    },
  },
  plugins: [],
};
