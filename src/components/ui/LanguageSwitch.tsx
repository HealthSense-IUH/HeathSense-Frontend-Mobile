import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { APP_LANGUAGES, currentLanguage, setAppLanguage, type AppLanguage } from '@/i18n';

const FLAGS: Record<AppLanguage, number> = {
  vi: require('../../../assets/images/flags/vn.png'),
  en: require('../../../assets/images/flags/uk.png'),
};

/** Nút cờ: bấm là đổi sang ngôn ngữ còn lại (giống nút nổi trên landing của web). */
export function LanguageFlagButton({ size = 40 }: { size?: number }) {
  const { t, i18n } = useTranslation();
  const current = currentLanguage();
  const next: AppLanguage = current === 'vi' ? 'en' : 'vi';
  void i18n.language; // đọc để re-render khi đổi ngôn ngữ
  return (
    <Pressable
      onPress={() => void setAppLanguage(next)}
      accessibilityRole="button"
      accessibilityLabel={t('language.switchTo', { language: t(`language.${next}`) })}
      className="items-center justify-center rounded-full bg-white border border-slate-200/80 active:opacity-80"
      style={{ width: size, height: size, boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)' }}
    >
      <Image source={FLAGS[next]} style={{ width: size * 0.6, height: size * 0.6, borderRadius: size * 0.3 }} resizeMode="cover" />
    </Pressable>
  );
}

/** Chọn ngôn ngữ dạng hai lựa chọn (dùng trong Cài đặt). */
export function LanguageSegment() {
  const { t, i18n } = useTranslation();
  void i18n.language;
  const current = currentLanguage();
  return (
    <View className="flex-row bg-muted/60 p-1 rounded-xl">
      {APP_LANGUAGES.map((lang) => {
        const active = lang === current;
        return (
          <Pressable
            key={lang}
            onPress={() => void setAppLanguage(lang)}
            className={`flex-1 py-2 rounded-lg flex-row items-center justify-center ${active ? 'bg-background shadow-xs' : ''}`}
            style={{ gap: 6 }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Image source={FLAGS[lang]} style={{ width: 18, height: 18, borderRadius: 9 }} resizeMode="cover" />
            <Text className={`text-xs font-bold ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{t(`language.${lang}`)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
