/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode based on class
  corePlugins: {
    preflight: false, // Disable Preflight to avoid conflicts with MUI CssBaseline
  },
  theme: {
    extend: {
      colors: {
        // Mirror MUI theme colors - will be synced with theme.ts
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          dark: 'var(--color-surface-dark)',
        },
        status: {
          success: 'var(--color-success)',
          error: 'var(--color-error)',
          warning: 'var(--color-warning)',
          info: 'var(--color-info)',
        }
      },
      spacing: {
        // 8px spacing scale
        '1': '8px',
        '2': '16px',
        '3': '24px',
        '4': '32px',
        '5': '40px',
      }
    },
  },
  plugins: [],
}