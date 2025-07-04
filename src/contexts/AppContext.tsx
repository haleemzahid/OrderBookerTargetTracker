import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect } from 'react';
import { ConfigProvider, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { localeConfig } from '../config/locales';
import type { Theme, Direction } from '../types';

interface AppContextType {
  theme: Theme;
  language: string;
  direction: Direction;
  toggleTheme: () => void;
  setLanguage: (lang: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [appTheme, setAppTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<string>(i18n.language);

  const currentLocale = localeConfig[language] || localeConfig.en;
  const direction: Direction = currentLocale.direction;

  const toggleTheme = () => {
    setAppTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
  };

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  const value = useMemo(() => ({
    theme: appTheme,
    language,
    direction,
    toggleTheme,
    setLanguage: handleLanguageChange,
  }), [appTheme, language, direction]);

  return (
    <AppContext.Provider value={value}>
      <ConfigProvider
        theme={{
          algorithm: appTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        }}
        direction={direction}
        locale={currentLocale.antdLocale}
      >
        {children}
      </ConfigProvider>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
