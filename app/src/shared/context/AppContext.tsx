import React, { createContext, useContext, useEffect, useState } from 'react';
import i18n from '../localization/i18n';

export interface AppContextType {
  theme: 'light' | 'dark' | 'rangerGreen';
  setTheme: (theme: 'light' | 'dark' | 'rangerGreen') => void;
  fontSize: 'microscopic' | 'diminutive' | 'normie' | 'embiggened' | 'thiccc';
  setFontSize: (size: 'microscopic' | 'diminutive' | 'normie' | 'embiggened' | 'thiccc') => void;
  units: 'merican' | 'metric';
  setUnits: (units: 'merican' | 'metric') => void;
  language: string;
  setLanguage: (lang: string) => void;
  navBurger: boolean;
  setNavBurger: (burgerStyle: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<'light' | 'dark' | 'rangerGreen'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark' | 'rangerGreen') || 'dark';
  });

  const [fontSize, setFontSizeState] = useState<
    'microscopic' | 'diminutive' | 'normie' | 'embiggened' | 'thiccc'
  >(() => {
    return (localStorage.getItem('fontSize') as
      | 'microscopic'
      | 'diminutive'
      | 'normie'
      | 'embiggened'
      | 'thiccc') || 'normie';
  });

  const [units, setUnitsState] = useState<'merican' | 'metric'>(() => {
    return (localStorage.getItem('units') as 'merican' | 'metric') || 'merican';
  });

  const [language, setLanguageState] = useState<string>(() => {
    return localStorage.getItem('language') || 'en';
  });

  const [navBurger, setNavBurgerState] = useState<boolean>(() => {
    return localStorage.getItem('navBurger') === 'true';
  });

  const setTheme = (newTheme: 'light' | 'dark' | 'rangerGreen') => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const setFontSize = (size: 'microscopic' | 'diminutive' | 'normie' | 'embiggened' | 'thiccc') => {
    setFontSizeState(size);
    localStorage.setItem('fontSize', size);
    document.documentElement.setAttribute('data-font-size', size);
  };

  const setUnits = (newUnits: 'merican' | 'metric') => {
    setUnitsState(newUnits);
    localStorage.setItem('units', newUnits);
  };

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    i18n.changeLanguage(lang);
  };

  const setNavBurger = (burgerStyle: boolean) => {
    setNavBurgerState(burgerStyle);
    localStorage.setItem('navBurger', String(burgerStyle));
  };

  // Apply theme and font size on mount and when they change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-font-size', fontSize);
  }, [theme, fontSize]);

  const value: AppContextType = {
    theme,
    setTheme,
    fontSize,
    setFontSize,
    units,
    setUnits,
    language,
    setLanguage,
    navBurger,
    setNavBurger,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
