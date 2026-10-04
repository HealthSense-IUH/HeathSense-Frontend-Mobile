import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useAuthStore } from '@/services/authentication/authStore';
import { useLogoutMutation } from '@/hooks/mutations/useAuthMutations';
import { useBLE } from '@/context/BLEContext';
import { LogoutButton } from '@/components/features/auth/LogoutButton';
import { Battery, ChevronRight, Info, Radio, Trash2, User as UserIcon, Watch } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { LanguageSegment } from '@/components/ui/LanguageSwitch';
import { useTranslation } from 'react-i18next';

export default function SettingsScreen() {
  const { t } = useTranslation('settings');
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogoutMutation();
  const { knownDevice, connectedDevice, forgetDevice, batteryLevel } = useBLE();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.replace('/(public)/login' as any);
  };

  return (
    <ScreenWrapper
      title={t('common:tabs.settings')}
      withBottomNav
      description={t('page.description')}
    >
      <View className="px-5 mt-4">
        {/* Bluetooth Device Management Section */}
        <View className="bg-card border border-border rounded-3xl p-5 shadow-sm mb-6">
          <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
            {t('device.sectionTitle')}
          </Text>

          <View className="flex-row items-center justify-between mb-4 bg-background p-4 rounded-2xl border border-border">
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-11 h-11 bg-primary/10 rounded-xl items-center justify-center mr-3">
                <Watch size={22} color={THEME.colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
                  {knownDevice ? knownDevice.name || t('device.wearable') : t('device.notPaired')}
                </Text>
                <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
                  {connectedDevice ? t('device.statusConnected') : knownDevice ? t('device.statusDisconnected') : t('device.tapToScan')}
                </Text>
              </View>
            </View>
            {connectedDevice && batteryLevel !== null && (
              <View className="flex-row items-center bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <Battery color="#10B981" size={14} className="mr-1" />
                <Text className="text-xs font-bold text-emerald-600">{batteryLevel}%</Text>
              </View>
            )}
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push('/(public)/scan' as any)}
              className="flex-1 bg-primary py-3 px-4 rounded-2xl flex-row items-center justify-center active:opacity-80"
            >
              <Radio color="#FFFFFF" size={16} className="mr-2" />
              <Text className="text-xs font-bold text-white">
                {knownDevice ? t('device.rescan') : t('device.findAndConnect')}
              </Text>
            </TouchableOpacity>

            {knownDevice && (
              <TouchableOpacity
                onPress={() => void forgetDevice()}
                className="bg-destructive/10 border border-destructive/20 py-3 px-4 rounded-2xl flex-row items-center justify-center active:opacity-80"
              >
                <Trash2 color={THEME.colors.error} size={16} className="mr-1.5" />
                <Text className="text-xs font-bold text-destructive">{t('device.unpair')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tài khoản: hồ sơ cá nhân (giống mục Hồ sơ trên web) */}
        <View className="bg-card border border-border rounded-3xl p-5 shadow-sm mb-6">
          <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{t('account.sectionTitle')}</Text>
          <TouchableOpacity
            onPress={() => router.push('/profile' as any)}
            activeOpacity={0.8}
            className="flex-row items-center py-2"
          >
            <View className="w-9 h-9 bg-primary/10 rounded-xl items-center justify-center mr-3">
              <UserIcon size={18} color={THEME.colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">{t('account.profile')}</Text>
              <Text className="text-xs text-muted-foreground">{t('profile:page.subtitle')}</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
          <View className="py-3 border-t border-border/40 mt-1">
            <Text className="text-sm font-semibold text-foreground mb-2">{t('common:language.label')}</Text>
            <LanguageSegment />
          </View>
          <View className="flex-row items-center py-2 border-t border-border/40">
            <View className="w-9 h-9 bg-accent/20 rounded-xl items-center justify-center mr-3">
              <Info size={18} color={THEME.colors.statusNormal} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">{t('about.appName')}</Text>
              <Text className="text-xs text-muted-foreground">{t('about.version', { version: Constants.expoConfig?.version ?? '--' })}</Text>
            </View>
          </View>
        </View>

        {/* Logout Profile Card & Button */}
        <View className="mb-6">
          <LogoutButton user={user} onLogout={handleLogout} isLoading={logoutMutation.isPending} />
        </View>
      </View>
    </ScreenWrapper>
  );
}
