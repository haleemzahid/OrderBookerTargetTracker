import { useTranslation } from 'react-i18next';

export const useI18n = () => {
  const { t, i18n } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };
  
  const currentLanguage = i18n.language;
  const isRTL = currentLanguage === 'ur';
  
  return {
    t,
    changeLanguage,
    currentLanguage,
    isRTL,
    // Helper functions for common translations
    dashboard: (key: string, options?: any): string => t(`dashboard.${key}`, options) as string,
    orderBookers: (key: string, options?: any): string => t(`orderBookers.${key}`, options) as string,
    common: (key: string, options?: any): string => t(`common.${key}`, options) as string,
  };
};

export default useI18n;
