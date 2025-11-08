/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#faf5f0',
          100: '#f4e4d7',
          200: '#e8c9ae',
          300: '#dba67f',
          400: '#ce8350',
          500: '#c26a2f',
          600: '#b45624',
          700: '#964420',
          800: '#7a3820',
          900: '#6F4E37',
        },
        cyber: {
          pink: '#ff006e',
          blue: '#00f5ff',
          purple: '#8b00ff',
          green: '#39ff14',
        }
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'coffee-gradient': 'linear-gradient(135deg, #6F4E37 0%, #c26a2f 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'coin-spin': 'coinSpin 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #00f5ff, 0 0 10px #00f5ff' },
          '100%': { boxShadow: '0 0 20px #00f5ff, 0 0 30px #00f5ff, 0 0 40px #00f5ff' },
        },
        coinSpin: {
          '0%, 100%': { transform: 'rotateY(0deg) scale(1)' },
          '50%': { transform: 'rotateY(180deg) scale(1.1)' },
        }
      }
    },
  },
  plugins: [],
}
