// =========================================
// PHALAY - Configuración Tailwind Compartida
// Design System Premium Femenino
// =========================================

import type { Config } from 'tailwindcss';

const config: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        // Fondos
        background: {
          DEFAULT: '#FFFFFF',
          soft: '#FAFAFA',
          muted: '#F5F5F7',
        },
        // Primarios - Paleta Femenina Premium
        primary: {
          50: '#FDF2F4',
          100: '#FCE7EB',
          200: '#F8D0D8',
          300: '#E8B4B8', // Principal suave
          400: '#E09AAA',
          500: '#D96C8A', // Principal fuerte
          600: '#C4547A',
          700: '#A33D64',
          800: '#873352',
          900: '#722E47',
          DEFAULT: '#D96C8A',
        },
        // Acento - Lavanda Premium
        accent: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C8B6FF', // Principal
          400: '#B49AFF',
          500: '#9B7AFF',
          600: '#8B5CF6',
          700: '#7C3AED',
          800: '#6D28D9',
          900: '#5B21B6',
          DEFAULT: '#C8B6FF',
        },
        // Texto
        foreground: {
          DEFAULT: '#111111',
          muted: '#6E6E73',
          light: '#8E8E93',
          inverted: '#FFFFFF',
        },
        // Semánticos
        success: {
          DEFAULT: '#34C759',
          light: '#E8F9EE',
        },
        warning: {
          DEFAULT: '#FF9500',
          light: '#FFF4E5',
        },
        danger: {
          DEFAULT: '#FF3B30',
          light: '#FFEBEA',
        },
        info: {
          DEFAULT: '#007AFF',
          light: '#E5F1FF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.05)',
        'glass-lg': '0 16px 48px 0 rgba(31, 38, 135, 0.1)',
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 40px -10px rgba(0, 0, 0, 0.08)',
        'premium': '0 20px 60px -15px rgba(217, 108, 138, 0.15)',
        'premium-lg': '0 25px 80px -20px rgba(217, 108, 138, 0.25)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-up': 'fadeUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #E8B4B8 0%, #D96C8A 50%, #C8B6FF 100%)',
        'gradient-accent': 'linear-gradient(135deg, #C8B6FF 0%, #D96C8A 100%)',
        'gradient-soft': 'linear-gradient(135deg, #FAFAFA 0%, #F5F5F7 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%)',
      },
    },
  },
};

export default config;
