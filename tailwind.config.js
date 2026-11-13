/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        arabic: ['IBM Plex Sans Arabic', 'Cairo', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Primary Brand Identity: Deep Forest Green
        forest: {
          50: '#F2F6F3',
          100: '#E1ECE4',
          200: '#C3D8CA',
          300: '#9FBFA9',
          400: '#6A9978',
          500: '#3D7750',
          600: '#235D3B',
          700: '#174C35', // Primary Forest Green
          800: '#113A28',
          900: '#0C2A1D',
          950: '#06170F',
          DEFAULT: '#174C35'
        },
        // Secondary Brand Identity: Sage Green
        sage: {
          50: '#F5F7F5',
          100: '#E8ECE8',
          200: '#D2DBD3',
          300: '#B5C4B7',
          400: '#8FAE91', // Secondary Sage Green
          500: '#739575',
          600: '#58765A',
          700: '#405742',
          800: '#2A3A2C',
          900: '#161E17',
          DEFAULT: '#8FAE91'
        },
        // Background & Neutral Canvas: Warm Off-White & Dark Charcoal
        sand: {
          50: '#FAFBF9',
          100: '#F7F8F4', // Warm Off-White canvas
          200: '#ECEEE6',
          300: '#E0E3D7',
          400: '#C7CBC0',
          DEFAULT: '#F7F8F4'
        },
        charcoal: {
          50: '#F6F7F6',
          100: '#E3E6E4',
          200: '#C7CCC8',
          300: '#A6AEA8',
          400: '#737D76', // Muted Gray
          500: '#525B55',
          600: '#3D4540',
          700: '#2D342F',
          800: '#202923', // Main Text Dark Charcoal
          900: '#151C17',
          DEFAULT: '#202923'
        },
        // Backward-compatible crop mapping to ensure seamless styling
        crop: {
          50: '#F2F6F3',
          100: '#E1ECE4',
          200: '#C3D8CA',
          300: '#9FBFA9',
          400: '#6A9978',
          500: '#235D3B',
          600: '#174C35', // Maps to Deep Forest Green
          700: '#113A28',
          800: '#0C2A1D',
          900: '#06170F',
          950: '#030C07',
        },
        nile: {
          50: '#F0F7FB',
          100: '#E0EEF7',
          200: '#BEDDF0',
          300: '#92C4E5',
          400: '#4E9FD4',
          500: '#237DB8',
          600: '#166294',
          700: '#124E76',
          800: '#0E3B59',
          900: '#0A2A40',
        },
        earth: {
          50: '#FAF7F4',
          100: '#F3EDE6',
          200: '#E5DACF',
          300: '#D2C0B0',
          400: '#BA9E88',
          500: '#9E7D63',
          600: '#82634B',
          700: '#664B36',
          800: '#4C3524',
          900: '#332316',
        }
      },
      boxShadow: {
        'soft-sm': '0 1px 3px rgba(32, 41, 35, 0.04), 0 1px 2px rgba(32, 41, 35, 0.02)',
        'soft': '0 4px 12px rgba(32, 41, 35, 0.05), 0 1px 3px rgba(32, 41, 35, 0.03)',
        'soft-md': '0 8px 24px rgba(32, 41, 35, 0.06), 0 2px 6px rgba(32, 41, 35, 0.04)',
        'soft-lg': '0 16px 36px rgba(32, 41, 35, 0.08), 0 4px 12px rgba(32, 41, 35, 0.05)',
      }
    },
  },
  plugins: [],
}
