import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fog: '#000000',
        cyan: { neon: '#00f5d4', dim: '#00b4a0' },
        green: { neon: '#39ff14', dim: '#27b30e' },
        bg: { base: '#030810', panel: '#070f1a', border: '#0d2035' },
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
        display: ['var(--font-display)', 'sans-serif'],
      },
      animation: {
        'reveal-ring': 'revealRing 0.8s ease-out forwards',
        'badge-pop': 'badgePop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'hud-glow': 'hudGlow 2s ease-in-out infinite',
        'monument-pulse': 'monumentPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        revealRing: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(3)', opacity: '0' },
        },
        badgePop: {
          '0%': { transform: 'scale(0) rotate(-10deg)', opacity: '0' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        hudGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 245, 212, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 245, 212, 0.5)' },
        },
        monumentPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.3)', opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
export default config
