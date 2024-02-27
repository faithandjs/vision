/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    screens: {
      md: "770px",
      sm: "496px",
    },
    fontFamily: {
      deraga: ["Deraga", "sans-serif"],
      alexander: ["Alexander", "sans-serif"],
      playfair: ["Playfair Display", "sans-serif"],
    },
    extend: {
      colors: {
        lightWhite: "rgba(255,255,255,.3)",
        lighterWhite: "rgba(255,255,255,.15)",
        main: "#ea1961",
        darkbg: "#37444c",
      },
    },
  },
  plugins: [
    function ({ addVariant }) {
      addVariant("child", "& > *");
      addVariant("child-hover", "& > *:hover");
    },
  ],
};
