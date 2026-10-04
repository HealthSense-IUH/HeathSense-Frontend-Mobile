import 'intl-pluralrules';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { createMMKV } from 'react-native-mmkv';
import vi from './locales/vi';
import en from './locales/en';

export type AppLanguage = 'vi' | 'en';
export const APP_LANGUAGES: AppLanguage[] = ['vi', 'en'];

const storage = createMMKV({ id: 'healthsense-i18n' });
const LANGUAGE_KEY = 'language';

/** Ngôn ngữ đã chọn; chưa chọn thì theo máy (máy tiếng Anh → en, còn lại → vi). */
function detectLanguage(): AppLanguage {
  const saved = storage.getString(LANGUAGE_KEY);
  if (saved === 'vi' || saved === 'en') return saved;
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale || '';
    return locale.toLowerCase().startsWith('en') ? 'en' : 'vi';
  } catch {
    return 'vi';
  }
}

void i18n.use(initReactI18next).init({
  resources: { vi, en },
  lng: detectLanguage(),
  fallbackLng: 'vi',
  defaultNS: 'common',
  ns: Object.keys(vi),
  interpolation: { escapeValue: false },
  returnNull: false,
});

export function currentLanguage(): AppLanguage {
  return i18n.language === 'en' ? 'en' : 'vi';
}

/** Locale cho toLocaleString / Intl (ngày, số) theo ngôn ngữ đang chọn. */
export function currentIntlLocale(): 'vi-VN' | 'en-US' {
  return currentLanguage() === 'en' ? 'en-US' : 'vi-VN';
}

export async function setAppLanguage(lang: AppLanguage) {
  storage.set(LANGUAGE_KEY, lang);
  await i18n.changeLanguage(lang);
}

export default i18n;
