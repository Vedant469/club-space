/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#8D65C7',
        lavender: '#E9DDFF',
        pink: '#F4DCEB',
        background: '#FBF8FF',
        deep: '#30253D',
        muted: '#8C7D9D',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        accent: ['"Caveat"', 'cursive'],
      },
      borderRadius: {
        card: '22px',
      },
      boxShadow: {
        soft: '0 12px 30px -10px rgba(141, 101, 199, 0.25)',
        glow: '0 0 0 4px rgba(141, 101, 199, 0.12)',
      },
      keyframes: {
        'star-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.25' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'star-spin': 'star-spin 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        twinkle: 'twinkle 3s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.45s ease-out forwards',
      },
    },
  },
  plugins: [],
}