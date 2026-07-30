import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager, NativeModules, Platform } from 'react-native';
import { storage } from '../services/storage.service';
import arCommon from './ar/common.json';
import enCommon from './en/common.json';

const LANGUAGE_KEY = 'language';

const getDeviceLanguage = (): string => {
  let locale = 'ar';
  if (Platform.OS === 'ios') {
    locale =
      NativeModules.SettingsManager?.settings?.AppleLocale ??
      NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ??
      'ar';
  } else {
    locale = NativeModules.I18nManager?.localeIdentifier ?? 'ar';
  }
  return locale.startsWith('ar') ? 'ar' : 'en';
};

const changeRTL = (isRTL: boolean) => {
  I18nManager.forceRTL(isRTL);
  I18nManager.allowRTL(isRTL);
  if (Platform.OS === 'android') {
    NativeModules?.I18nManager?.forceRTL(isRTL);
  }
};

export const resources = {
  ar: {
    common: arCommon,
  },
  en: {
    common: enCommon,
  },
};

const savedLanguage = storage.getString(LANGUAGE_KEY);
const deviceLanguage = getDeviceLanguage();
const initialLanguage = savedLanguage || deviceLanguage || 'ar';

changeRTL(initialLanguage === 'ar');

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: 'ar',
  ns: ['common'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v3',
});

export const changeLanguage = (lang: 'ar' | 'en') => {
  i18n.changeLanguage(lang);
  storage.setString(LANGUAGE_KEY, lang);
  changeRTL(lang === 'ar');
};

export const getCurrentLanguage = (): 'ar' | 'en' => {
  return (i18n.language as 'ar' | 'en') || 'ar';
};

export const isRTL = (): boolean => {
  return getCurrentLanguage() === 'ar';
};

export default i18n;
