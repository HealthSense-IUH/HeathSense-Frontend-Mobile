import React, { forwardRef, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { AlertCircle, ArrowRight, AtSign, CircleX, Eye, EyeOff, Lock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { LoginRequest } from '@/types/authentication';

/** Màu theo thiết kế Stitch "Đăng nhập xác thực" (Clinical Clarity & Modern Pulse) */
const BRAND = '#2B6CB0';
const ON_SURFACE = '#0B1C30';
const ON_SURFACE_VARIANT = '#424655';
const OUTLINE = '#727787';

interface LoginFormProps {
  onSubmit: (data: LoginRequest) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
  onNavigateToRegister?: () => void;
}

interface AuthFieldProps extends TextInputProps {
  label: string;
  icon: React.ReactNode;
  rightElement?: React.ReactNode;
}

/** Ô nhập của màn đăng nhập: nhãn nhỏ phía trên, khung cao 52 bo 16, sáng lên khi đang nhập. */
const AuthField = forwardRef<TextInput, AuthFieldProps>(({ label, icon, rightElement, onFocus, onBlur, ...props }, ref) => {
  const [focused, setFocused] = useState(false);

  return (
    <View className="w-full" style={{ gap: 4 }}>
      <Text className="text-[11px] font-semibold" style={{ color: ON_SURFACE_VARIANT }}>
        {label}
      </Text>
      <View
        className="flex-row items-center w-full px-3"
        style={{
          height: 52,
          gap: 8,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: focused ? 'rgba(43, 108, 176, 0.45)' : 'rgba(226, 232, 240, 0.8)',
          backgroundColor: focused ? '#FFFFFF' : '#F8FAFC',
          boxShadow: focused ? '0 4px 12px rgba(15, 23, 42, 0.08)' : undefined,
        }}
      >
        {icon}
        <TextInput
          ref={ref}
          className="flex-1 text-sm h-full"
          style={{ color: ON_SURFACE }}
          placeholderTextColor={OUTLINE}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {rightElement}
      </View>
    </View>
  );
});
AuthField.displayName = 'AuthField';

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading,
  error,
  onNavigateToRegister,
}) => {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    setLocalError(null);
    if (!email.trim()) {
      setLocalError(t('validation.emailRequired'));
      return;
    }
    if (!password) {
      setLocalError(t('validation.passwordRequired'));
      return;
    }

    try {
      await onSubmit({ email: email.trim(), password });
    } catch {
      // Error handled by parent
    }
  };

  const displayError = localError || error;

  return (
    <View
      className="w-full bg-white p-6"
      style={{
        borderRadius: 32,
        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 4px 12px -2px rgba(0, 0, 0, 0.03)',
      }}
    >
      <Text className="text-xl font-bold tracking-tight mb-6" style={{ color: ON_SURFACE }}>
        {t('login.title')}
      </Text>

      {displayError ? (
        <View className="flex-row items-center bg-rose-50 border border-rose-200 p-3.5 rounded-2xl mb-4">
          <AlertCircle size={20} color="#E11D48" />
          <Text className="text-xs font-semibold text-rose-600 flex-1 ml-2">{displayError}</Text>
        </View>
      ) : null}

      <View className="w-full" style={{ gap: 16 }}>
        <AuthField
          ref={emailInputRef}
          label={t('login.emailLabel')}
          icon={<AtSign size={20} color={ON_SURFACE_VARIANT} />}
          placeholder={t('login.emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          editable={!isLoading}
          returnKeyType="next"
          onSubmitEditing={() => passwordInputRef.current?.focus()}
          rightElement={
            email ? (
              <Pressable
                onPress={() => {
                  setEmail('');
                  emailInputRef.current?.focus();
                }}
                hitSlop={8}
                accessibilityLabel={t('login.clearInput')}
                className="p-1"
              >
                <CircleX size={18} color={OUTLINE} />
              </Pressable>
            ) : null
          }
        />

        <AuthField
          ref={passwordInputRef}
          label={t('login.passwordLabel')}
          icon={<Lock size={20} color={ON_SURFACE_VARIANT} />}
          placeholder="••••••••••••"
          secureTextEntry={!showPassword}
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          rightElement={
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={8}
              accessibilityLabel={showPassword ? t('password.hide') : t('password.show')}
              className="p-1"
            >
              {showPassword ? (
                <EyeOff size={20} color={ON_SURFACE_VARIANT} />
              ) : (
                <Eye size={20} color={ON_SURFACE_VARIANT} />
              )}
            </Pressable>
          }
        />

        <Pressable
          onPress={handleSubmit}
          disabled={isLoading}
          accessibilityRole="button"
          className="w-full flex-row items-center justify-center mt-2 active:opacity-90"
          style={{
            height: 50,
            gap: 8,
            borderRadius: 9999,
            backgroundColor: BRAND,
            opacity: isLoading ? 0.7 : 1,
            boxShadow: '0 4px 16px rgba(43, 108, 176, 0.25)',
          }}
        >
          {isLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
          <Text className="text-white text-sm font-semibold tracking-wide">
            {isLoading ? t('login.submitting') : t('login.submit')}
          </Text>
          {!isLoading ? <ArrowRight size={20} color="#FFFFFF" /> : null}
        </Pressable>
      </View>

      {onNavigateToRegister && (
        <View className="flex-row items-center justify-center pt-5 mt-2">
          <Text className="text-xs" style={{ color: ON_SURFACE_VARIANT }}>
            {t('login.noAccount')}
          </Text>
          <Pressable onPress={onNavigateToRegister} hitSlop={8}>
            <Text className="text-xs font-semibold ml-1" style={{ color: BRAND }}>
              {t('login.registerNow')}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};
