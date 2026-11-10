import { useEffect, useState, type ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';

const THEME_KEY = 'gemer.theme';
type Theme = 'dark' | 'light' | 'minecraft';

function nextTheme(current: Theme): Theme {
  if (current === 'dark') return 'light';
  if (current === 'light') return 'minecraft';
  return 'dark';
}

function loadTheme(): Theme {
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'minecraft') return stored;
  return 'dark';
}

export function McIcon({ kind, size = 20, className = '', testId }: { kind: 'creeper' | 'sword' | 'pickaxe'; size?: number; className?: string; testId?: string }) {
  return <img src={`/assets/mc/${kind}.png`} width={size} height={size} alt="" aria-hidden="true" className={`mc-icon ${className}`} data-testid={testId} />;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(loadTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.classList.toggle('minecraft', theme === 'minecraft');
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const label = theme === 'dark' ? 'Switch to light mode' : theme === 'light' ? 'Switch to Minecraft mode' : 'Switch to dark mode';

  return (
    <button data-testid="theme-toggle" onClick={() => setTheme((current) => nextTheme(current))} aria-label={label} className={`theme-toggle ${theme === 'minecraft' ? 'theme-toggle-mc' : ''}`}>
      {theme === 'minecraft' ? <McIcon kind="creeper" size={22} /> : theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
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
