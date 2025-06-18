/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors:{
        "mainBackgroundColor":'#0D1117',
        "columnBackgroundColor":'#161C22'
      },
      animation: {
        spin: "spin 1s linear infinite",
      },
    },
  },
  plugins: [],
};
