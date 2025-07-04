import { Locale } from 'antd/es/locale';
import enUS from 'antd/locale/en_US';
import urPK from 'antd/locale/ur_PK';

export interface LocaleConfig {
  key: string;
  label: string;
  antdLocale: Locale;
  direction: 'ltr' | 'rtl';
}

export const localeConfig: Record<string, LocaleConfig> = {
  en: {
    key: 'en',
    label: 'English',
    antdLocale: enUS,
    direction: 'ltr',
  },
  ur: {
    key: 'ur',
    label: 'اردو',
    antdLocale: urPK,
    direction: 'rtl',
  },
};

export const availableLocales = Object.keys(localeConfig);
export const defaultLocale = 'en';
