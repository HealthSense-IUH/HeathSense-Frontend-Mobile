import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { AlertCircle, LogOut, ShieldCheck, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { UserSession } from '@/types/authentication';

interface LogoutButtonProps {
  user?: UserSession | null;
  onLogout: () => Promise<void>;
  isLoading?: boolean;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  user,
  onLogout,
  isLoading = false,
}) => {
  const { t } = useTranslation('auth');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const role = user?.role || 'MEMBER';

  const handleConfirmLogout = async () => {
    setShowConfirmModal(false);
    await onLogout();
  };

  return (
    <View className="w-full">
      {/* Profile Card if user exists */}
      {user && (
        <View className="bg-card border border-border rounded-3xl p-5 mb-4 shadow-sm">
          <View className="flex-row items-center">
            <View className="w-14 h-14 bg-primary/10 rounded-2xl items-center justify-center mr-4">
              <User size={28} color="#0F67FE" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground">
                {user.fullName || t('logout.defaultUser')}
              </Text>
              <Text className="text-xs text-muted-foreground mt-0.5">
                {user.email}
              </Text>
              <View className="flex-row items-center mt-2 bg-secondary/60 self-start px-2.5 py-1 rounded-full">
                <ShieldCheck size={12} color="#00349C" className="mr-1" />
                <Text className="text-[10px] font-bold text-secondary-foreground uppercase">
                  {t(`profile:role.${role}`, { defaultValue: role })}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Logout Action Button */}
      <Pressable
        onPress={() => setShowConfirmModal(true)}
        disabled={isLoading}
        className="w-full bg-destructive/10 border border-destructive/20 py-3.5 px-4 rounded-2xl flex-row items-center justify-center active:opacity-80"
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#DA1E2E" />
        ) : (
          <>
            <LogOut size={20} color="#DA1E2E" className="mr-2" />
            <Text className="text-sm font-bold text-destructive">
              {t('logout.button')}
            </Text>
          </>
        )}
      </Pressable>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center p-4">
          <View className="w-full max-w-sm bg-card border border-border rounded-3xl p-6 shadow-lg">
            <View className="w-12 h-12 bg-destructive/10 rounded-full items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} color="#DA1E2E" />
            </View>

            <Text className="text-lg font-bold text-foreground text-center mb-2">
              {t('logout.confirmTitle')}
            </Text>
            <Text className="text-xs text-muted-foreground text-center mb-6 leading-5">
              {t('logout.confirmMessage')}
            </Text>

            <View className="flex-row space-x-3">
              <Pressable
                onPress={() => setShowConfirmModal(false)}
                className="flex-1 bg-muted py-3 rounded-2xl items-center justify-center mr-2"
              >
                <Text className="text-sm font-semibold text-foreground">
                  {t('common:actions.cancel')}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmLogout}
                className="flex-1 bg-destructive py-3 rounded-2xl items-center justify-center ml-2"
              >
                <Text className="text-sm font-bold text-white">
                  {t('logout.confirm')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
