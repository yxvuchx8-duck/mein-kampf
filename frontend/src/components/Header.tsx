import { useEffect, useState, type ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';

const THEME_KEY = 'gemer.theme';

export function ThemeToggle() {
  const [light, setLight] = useState(() => window.localStorage.getItem(THEME_KEY) === 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('light', light);
    window.localStorage.setItem(THEME_KEY, light ? 'light' : 'dark');
  }, [light]);

  return (
    <button data-testid="theme-toggle" onClick={() => setLight((current) => !current)} aria-label={light ? 'Switch to dark mode' : 'Switch to light mode'} className="theme-toggle">
      {light ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  );
}

export function FloatingHeader({ left, right }: { left?: ReactNode; right?: ReactNode }) {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 px-6 pt-6 sm:px-10" data-testid="site-header">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-4">{left}</div>
        <div className="flex items-center gap-4">
          {right}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
