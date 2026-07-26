/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'org-dark-green': '#4a754f',
        'org-green': '#558b5e',
        'org-light-green': '#95c65f',
        'org-orange': '#ea8d5e',
        'org-light-orange': '#f7cbac',
        'org-blue': '#99cccd',
        'org-light-blue': '#c2e0e4',
      },
    },
  },
  plugins: [],
}
