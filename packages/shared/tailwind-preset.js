/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B35',
          dark: '#E05A2B',
          light: '#FFF1EB',
          50: '#FFF8F5',
        },
        secondary: {
          DEFAULT: '#1B998B',
          dark: '#158276',
          light: '#E6F7F5',
        },
        accent: {
          DEFAULT: '#FFCB47',
          dark: '#E5B53E',
        },
        success: '#22C55E',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          400: '#9CA3AF',
          600: '#6B7280',
          800: '#2D2D44',
          900: '#1A1A2E',
        },
      },
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(26,26,46,0.06)',
        md: '0 4px 12px rgba(26,26,46,0.08)',
        lg: '0 8px 24px rgba(26,26,46,0.12)',
        xl: '0 16px 48px rgba(26,26,46,0.16)',
      },
    },
  },
}
