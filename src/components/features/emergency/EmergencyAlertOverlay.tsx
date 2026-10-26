import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Vibration } from 'react-native';
import { AlertTriangle, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useBleStore } from '@/services/ble-management/bleStore';
import { useBLE } from '@/context/BLEContext';

export function EmergencyAlertOverlay() {
  const { t } = useTranslation('settings');
  const { cancelEmergency } = useBLE();
  const emergencyActive = useBleStore((state) => state.emergencyActive);
  const emergencyType = useBleStore((state) => state.emergencyType);
  const emergencyCountdownSeconds = useBleStore((state) => state.emergencyCountdownSeconds);

  const [prevActive, setPrevActive] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Reset dismissed state when emergencyActive toggles
  if (emergencyActive !== prevActive) {
    setPrevActive(emergencyActive);
    if (!emergencyActive) {
      setDismissed(false);
      setCancelling(false);
    }
  }

  const isVisible = emergencyActive && !dismissed;

  useEffect(() => {
    if (isVisible) {
      // Vibrate pattern: wait 0ms, vibrate 600ms, pause 400ms, vibrate 600ms, repeating
      Vibration.vibrate([0, 600, 400, 600], true);
    } else {
      Vibration.cancel();
    }

    return () => {
      Vibration.cancel();
    };
  }, [isVisible]);

  const handleCancelSos = async () => {
    setCancelling(true);
    try {
      await cancelEmergency();
    } catch (err) {
      console.warn('Failed to cancel SOS:', err);
    } finally {
      setCancelling(false);
      setDismissed(true);
    }
  };

  if (!isVisible) {
    return null;
  }

  const typeKey = emergencyType ?? 'EMERGENCY';
  const typeLabel = t(`ble.emergency.types.${typeKey}`, {
    defaultValue: typeKey,
  });

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => setDismissed(true)}
    >
      <View className="flex-1 bg-black/75 items-center justify-center p-5">
        <View className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border-2 border-red-500 items-center">
          {/* Top Dismiss Button */}
          <TouchableOpacity
            onPress={() => setDismissed(true)}
            className="absolute top-4 right-4 p-2 rounded-full bg-neutral-100"
            activeOpacity={0.7}
            accessibilityLabel={t('ble.emergency.overlay.dismiss', { defaultValue: 'Dismiss' })}
          >
            <X size={20} color="#4B5563" />
          </TouchableOpacity>

          {/* Alarm Icon */}
          <View className="w-20 h-20 rounded-full bg-red-100 items-center justify-center mb-4 mt-2 border-4 border-red-200">
            <AlertTriangle size={42} color="#DC2626" />
          </View>

          {/* Heading */}
          <Text className="text-xl font-extrabold text-red-600 text-center uppercase tracking-wide">
            {t('ble.emergency.overlay.title', { defaultValue: 'CẢNH BÁO KHẨN CẤP' })}
          </Text>

          {/* Incident Type */}
          <View className="mt-2 px-3 py-1 rounded-full bg-red-50 border border-red-200">
            <Text className="text-sm font-bold text-red-700">{typeLabel}</Text>
          </View>

          {/* Countdown */}
          {typeof emergencyCountdownSeconds === 'number' ? (
            <View className="my-5 items-center">
              <Text className="text-5xl font-black text-red-600">
                {emergencyCountdownSeconds}
              </Text>
              <Text className="text-xs font-semibold text-neutral-500 uppercase mt-1">
                {t('ble.emergency.overlay.secondsLeft', { defaultValue: 'giây còn lại' })}
              </Text>
            </View>
          ) : (
            <View className="my-4">
              <Text className="text-base font-bold text-red-600 text-center">
                {t('ble.emergency.bodyConfirmed', { defaultValue: 'ĐÃ XÁC NHẬN TÌNH TRẠNG KHẨN CẤP!' })}
              </Text>
            </View>
          )}

          {/* Instruction */}
          <Text className="text-xs text-neutral-600 text-center leading-relaxed px-2 mb-6">
            {t('ble.emergency.overlay.description', {
              defaultValue:
                'Đồng hồ đã kích hoạt tín hiệu khẩn cấp. Nếu bạn vẫn ổn, hãy nhấn nút bên dưới để hủy gửi cảnh báo.',
            })}
          </Text>

          {/* Action Buttons */}
          <TouchableOpacity
            onPress={() => void handleCancelSos()}
            disabled={cancelling}
            className="w-full rounded-2xl bg-red-600 py-4 items-center shadow-lg active:opacity-90"
            activeOpacity={0.85}
          >
            <Text className="text-white font-extrabold text-base tracking-wider uppercase">
              {cancelling
                ? '...'
                : t('ble.emergency.overlay.cancel', { defaultValue: 'HỦY SOS (TÔI ỔN)' })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDismissed(true)}
            className="mt-3 py-2 px-4"
            activeOpacity={0.6}
          >
            <Text className="text-xs font-medium text-neutral-500">
              {t('ble.emergency.overlay.dismiss', { defaultValue: 'Đóng tạm thông báo' })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
