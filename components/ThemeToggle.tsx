'use client';

import { useTheme } from '@/context/theme-context';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return <button type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} className="rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20">{theme === 'dark' ? '☀ Light' : '☾ Dark'}</button>;
}
