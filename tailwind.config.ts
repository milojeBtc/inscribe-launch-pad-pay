import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        specialDark: "#232323",
        customBlue: "#2DB0B0",
        specialWhite: "#EFE9E6",
      },
      fontFamily: {
        tomorrow: ["var(--font-tomorrow)"],
        inter: ["var(--font-inter)"],
      },
    },
  },
  plugins: [],
} satisfies Config;
