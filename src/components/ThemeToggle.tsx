import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'theme';

function getStoredTheme(): 'dark' | 'light' | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
}

function setStoredTheme(value: 'dark' | 'light') {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // localStorage tidak tersedia; tema tetap berlaku untuk sesi ini
  }
}

/** Dipanggil sebelum render agar tidak ada kedipan tema saat halaman dimuat. */
export function applyStoredTheme() {
  const stored = getStoredTheme();
  const isDark =
    stored !== null
      ? stored === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', isDark);
}

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  function toggle() {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    setStoredTheme(next ? 'dark' : 'light');
    setIsDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
      aria-pressed={isDark}
      title={isDark ? 'Tema terang' : 'Tema gelap'}
      className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:text-neutral-300 dark:hover:bg-neutral-800"
    >
      {isDark ? (
        <Sun className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}
