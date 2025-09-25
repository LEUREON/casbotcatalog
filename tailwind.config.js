// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: 'var(--font-family-heading)',
        body: 'var(--font-family-body)',
      },
      colors: {
        dark: 'var(--bg-dark)',
        glass: 'var(--bg-glass)',
        'glass-hover': 'var(--bg-glass-hover)',
        item: 'var(--bg-item)',
        reply: 'var(--bg-reply)',
        'accent-primary': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        'accent-tertiary': 'var(--accent-tertiary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'badge-male': 'var(--badge-male)',
        'badge-female': 'var(--badge-female)',
        'badge-age': 'var(--badge-age)',
        'badge-immortal': 'var(--badge-immortal)',
        'badge-tag': 'var(--badge-tag)',
        'star-filled': 'var(--star-filled)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      borderColor: {
        DEFAULT: 'var(--border-color)',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.35)',
        'glass-hover': '0 12px 40px rgba(0, 0, 0, 0.4)',
        accent: '0 4px 16px rgba(var(--accent-primary-rgb), 0.4)',
        'star-glow': '0 0 12px rgba(var(--star-glow-rgb), 0.6)',
        'button-hover': '0 8px 24px rgba(var(--accent-primary-rgb), 0.4)',
      },
      // ▼▼▼ ИЗМЕНЕНИЕ ЗДЕСЬ ▼▼▼
      dropShadow: {
        'button-glow': '0 0 10px rgba(var(--accent-primary-rgb), 0.7)'
      },
      // ▲▲▲ КОНЕЦ ИЗМЕНЕНИЯ ▲▲▲
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}