'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

export default function ThemeToggler() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'system';
    }
    return 'system';
  });
  const [mounted, setMounted] = useState(false);

  // Set mounted status on client-side mount
  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  // Handle theme changes and system preferences listener
  useEffect(() => {
    if (!mounted) return;

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
  }, [theme, mounted]);

  const themeOptions = [
    { value: 'system', label: 'Sistem', icon: Monitor, transform: 'translateX(0px)' },
    { value: 'dark', label: 'Gelap', icon: Moon, transform: 'translateX(32px)' },
    { value: 'light', label: 'Terang', icon: Sun, transform: 'translateX(64px)' },
  ] as const;

  const currentTheme = mounted ? theme : 'system';
  const activeOption = themeOptions.find((opt) => opt.value === currentTheme);
  const transformStyle = activeOption ? activeOption.transform : 'translateX(32px)';

  return (
    <div className="theme-switch-track" aria-label="Ganti Tema Warna">
      {/* Sliding active indicator capsule */}
      <div
        className="theme-switch-indicator"
        style={{ transform: transformStyle }}
      />

      {themeOptions.map(({ value, label, icon: Icon }) => {
        const isActive = currentTheme === value;
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

