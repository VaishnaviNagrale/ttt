/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono:    ['"Space Mono"', 'monospace'],
        display: ['"Syne"', 'sans-serif'],
      },
      colors: {
        bg:       '#0d0d0f',
        surface:  '#151519',
        surface2: '#1e1e24',
        border:   '#2a2a35',
        accent:   '#00e5a0',
        danger:   '#ff4d6d',
        muted:    '#6b6b80',
        txt:      '#f0f0f5',
      },
      animation: {
        'pulse-dot':    'pulseDot 2s ease-in-out infinite',
        'bounce-dot':   'bounceDot 1.2s ease-in-out infinite',
        'pop-in':       'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'fade-scale':   'fadeScale 0.35s ease forwards',
        'win-flash':    'winFlash 0.5s ease 2',
        'timer-urgent': 'timerUrgent 0.6s ease-in-out infinite',
        'spin-slow':    'spin 2s linear infinite',
      },
      keyframes: {
        pulseDot:    { '0%,100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '0.4', transform: 'scale(0.8)' } },
        bounceDot:   { '0%,80%,100%': { transform: 'scale(0.5)', opacity: '0.4' }, '40%': { transform: 'scale(1)', opacity: '1' } },
        popIn:       { from: { transform: 'scale(0) rotate(-20deg)', opacity: '0' }, to: { transform: 'scale(1) rotate(0)', opacity: '1' } },
        fadeScale:   { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        winFlash:    { '0%,100%': { boxShadow: 'none' }, '50%': { boxShadow: '0 0 24px #00e5a0' } },
        timerUrgent: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
    },
  },
  plugins: [],
}
