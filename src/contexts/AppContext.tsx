import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { ConfigProvider, theme } from 'antd';
import enUS from 'antd/locale/en_US';
import type { Theme } from '../types';

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [appTheme, setAppTheme] = useState<Theme>('light');

  const toggleTheme = () => {
    setAppTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const value = useMemo(() => ({
    theme: appTheme,
    toggleTheme,
  }), [appTheme]);

  return (
    <AppContext.Provider value={value}>
      <ConfigProvider
        theme={{
          algorithm: appTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        }}
        componentSize='middle'
        locale={enUS}
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
