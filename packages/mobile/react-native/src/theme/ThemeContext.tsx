import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import { theme, Theme } from './index';
import { storage } from '../services/storage.service';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setDarkMode: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: theme.light,
  isDark: false,
  toggleTheme: () => {},
  setDarkMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = storage.getBoolean('theme_dark');
    if (stored !== undefined) return stored;
    return systemScheme === 'dark';
  });

  useEffect(() => {
    storage.set('theme_dark', isDark);
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => !prev);
  }, []);

  const setDarkMode = useCallback((dark: boolean) => {
    setIsDark(dark);
  }, []);

  const value = useMemo(
    () => ({
      theme: isDark ? theme.dark : theme.light,
      isDark,
      toggleTheme,
      setDarkMode,
    }),
    [isDark, toggleTheme, setDarkMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
