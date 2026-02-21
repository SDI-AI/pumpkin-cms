/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/data/*.json',
    '../../packages/pumpkin-block-views/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        pumpkin: {
          50: '#fff8f0',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        bark: {
          50: '#faf7f5',
          100: '#f0ebe5',
          200: '#dfd4c8',
          300: '#c9b8a5',
          400: '#b09780',
          500: '#9a7d64',
          600: '#8b6d55',
          700: '#745a47',
          800: '#604b3d',
          900: '#503f34',
        },
        vine: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-pumpkin': 'linear-gradient(135deg, #fff8f0 0%, #ffedd5 50%, #fed7aa 100%)',
        'gradient-hero': 'linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #f97316 100%)',
        'gradient-dark': 'linear-gradient(135deg, #171717 0%, #262626 50%, #404040 100%)',
      },
    },
  },
  plugins: [],
}
