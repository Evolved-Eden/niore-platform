/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: {
    relative: true,
    files: [
      "./app/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
      "./lib/**/*.{js,ts,jsx,tsx}",
    ],
  },
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};