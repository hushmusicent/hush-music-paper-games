/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          bg: '#0b1220',
          bg2: '#101a2e',
          card: '#16233c',
          card2: '#1e2f4f',
          ink: '#58a6ff',
          ink2: '#9ccaff',
          green: '#2ecc71',
          red: '#e74c3c',
          cream: '#fdf6e3',
          text: '#eef4ff',
          muted: '#8fa3c4',
          line: '#2a3d63',
          sheet: '#fffdf4',
          sheetline: '#bcd6f7',
          margin: '#f2a0a0',
          pencil: '#22304a',
        }
      }
    },
  },
  plugins: [],
}
