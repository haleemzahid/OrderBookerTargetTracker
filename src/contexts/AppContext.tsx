import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { ConfigProvider, theme } from 'antd';
import enUS from 'antd/locale/en_US';
import urPK from 'antd/locale/ur_PK';
import type { Language, Theme, Direction } from '../types';

interface AppContextType {
  theme: Theme;
  language: Language;
  direction: Direction;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [appTheme, setAppTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('en');

  const direction: Direction = language === 'ur' ? 'rtl' : 'ltr';

  const toggleTheme = () => {
    setAppTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const value = useMemo(() => ({
    theme: appTheme,
    language,
    direction,
    toggleTheme,
    setLanguage,
  }), [appTheme, language, direction]);

  return (
    <AppContext.Provider value={value}>
      <ConfigProvider
        theme={{
          algorithm: appTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        }}
        direction={direction}
        locale={language === 'ur' ? urPK : enUS}
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
