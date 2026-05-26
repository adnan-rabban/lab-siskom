'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

export default function ThemeToggler() {
  const [theme, setTheme] = useState<Theme>('system');

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTimeout(() => {
        setTheme(savedTheme);
      }, 0);
    }
  }, []);

  // Handle theme changes and system preferences listener
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (currentTheme: Theme) => {
      if (currentTheme === 'system') {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        root.setAttribute('data-theme', systemTheme);
        root.classList.toggle('dark', systemTheme === 'dark');
      } else {
        root.setAttribute('data-theme', currentTheme);
        root.classList.toggle('dark', currentTheme === 'dark');
      }
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);

    // Event listener for system changes when 'system' is selected
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme]);

  const themeOptions = [
    { value: 'light', label: 'Terang', icon: Sun, transform: 'translateX(0px)' },
    { value: 'system', label: 'Sistem', icon: Monitor, transform: 'translateX(32px)' },
    { value: 'dark', label: 'Gelap', icon: Moon, transform: 'translateX(64px)' },
  ] as const;

  const activeOption = themeOptions.find((opt) => opt.value === theme);
  const transformStyle = activeOption ? activeOption.transform : 'translateX(32px)';

  return (
    <div className="theme-switch-track" aria-label="Ganti Tema Warna">
      {/* Sliding active indicator capsule */}
      <div
        className="theme-switch-indicator"
        style={{ transform: transformStyle }}
      />

      {themeOptions.map(({ value, label, icon: Icon }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`theme-switch-btn ${isActive ? 'active' : ''}`}
            title={`Tema: ${label}`}
            aria-label={`Pilih tema ${label}`}
            aria-pressed={isActive}
          >
            <Icon size={14} className="theme-switch-icon" />
          </button>
        );
      })}
    </div>
  );
}

