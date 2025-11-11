import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    shadow: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
}

const lightTheme: Theme = {
  colors: {
    primary: '#3B82F6',
    secondary: '#6366F1',
    background: '#EFE9D5',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    shadow: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
};

const darkTheme: Theme = {
  colors: {
    // AMOLED-inspired palette
    primary: '#5E5CE6',        // Accent purple for actions
    secondary: '#34D399',      // Optional secondary accent (mint)
    background: '#121212',     // App background (deep black)
    surface: '#1C1C1E',        // Headers / elevated surfaces
    card: '#1F1F21',           // Cards and containers
    text: '#FFFFFF',           // Primary text
    textSecondary: '#B0B0B0',  // Secondary text
    border: '#2C2C2E',         // Subtle borders
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#5E5CE6',
    shadow: '#00000080',       // Soft shadow with opacity
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      // Force dark mode regardless of saved preference
      setIsDark(true);
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTheme = async (isDarkMode: boolean) => {
    try {
      await AsyncStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    // Force dark mode: do not allow toggling to light
    setIsDark(true);
    saveTheme(true);
  };

  const setTheme = (isDarkMode: boolean) => {
    setIsDark(isDarkMode);
    saveTheme(isDarkMode);
  };

  const theme = isDark ? darkTheme : lightTheme;

  if (isLoading) {
    return null; // or a loading spinner
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {/* Ensure status bar text is readable and background matches theme */}
      <StatusBar
        style={isDark ? 'light' : 'dark'}
        backgroundColor={theme.colors.background}
        translucent={false}
      />
      {children}
    </ThemeContext.Provider>
  );
}

// Utility function to create themed styles
export function createThemedStyles<T>(
  styleFunction: (theme: Theme) => T
) {
  return (theme: Theme): T => styleFunction(theme);
}

// Hook to create themed styles
export function useThemedStyles<T>(
  styleFunction: (theme: Theme) => T
): T {
  const { theme } = useTheme();
  return styleFunction(theme);
}
