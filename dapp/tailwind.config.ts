import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      width: {
        128: "32rem",
      },
    },
  },
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: "#1f51a1",
          secondary: "#ff00af",
          accent: "#0039ff",
          neutral: "#080416",
          info: "#00cbff",
          success: "#00aa7f",
          warning: "#ff7a00",
          error: "#c8003a",
        },
      },
    ],
  },
  plugins: [require("daisyui")],
};
export default config;
