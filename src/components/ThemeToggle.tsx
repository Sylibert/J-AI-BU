import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface ThemeToggleProps {
  themeState: ReturnType<typeof useTheme>;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ themeState }) => {
  const { isDark, toggleTheme } = themeState;

  const handleClick = () => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(10);
    }
    toggleTheme();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
      className="relative w-[44px] h-[44px] rounded-full border border-[var(--border-subtle)] bg-[var(--card-bg)] text-[var(--text-main)] flex items-center justify-center cursor-pointer shadow-[var(--shadow-btn)] active:scale-90 transition-all duration-200"
    >
      {isDark ? (
        <Sun className="w-[19px] h-[19px] stroke-[2.2] text-[#FFD60A] transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-[19px] h-[19px] stroke-[2.0] text-[var(--text-main)] transition-transform duration-200 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
};
