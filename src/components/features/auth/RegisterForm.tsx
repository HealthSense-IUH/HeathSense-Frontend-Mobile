import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AlertCircle, Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { RegisterRequest } from '@/types/authentication';

interface RegisterFormProps {
  onSubmit: (data: RegisterRequest) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
  onNavigateToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  isLoading,
  error,
  onNavigateToLogin,
}) => {
  const { t } = useTranslation('auth');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    setLocalError(null);
    if (!fullName.trim()) {
      setLocalError(t('validation.fullNameRequired'));
      return;
    }
    if (!email.trim()) {
      setLocalError(t('validation.emailRequired'));
      return;
    }
    if (!password || password.length < 8) {
      setLocalError(t('validation.passwordMinLength'));
      return;
    }
    if (password !== confirmPassword) {
      setLocalError(t('validation.passwordMismatch'));
      return;
    }

    try {
      await onSubmit({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });
    } catch {
      // Error handled by parent
    }
  };

  const displayError = localError || error;

  return (
    <View className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-sm">
      {/* Header */}
      <View className="items-center mb-6">
        <View className="w-14 h-14 bg-primary/10 rounded-2xl items-center justify-center mb-3">
          <User size={28} color="#0F67FE" />
        </View>
        <Text className="text-2xl font-bold text-foreground text-center">
          {t('register.title')}
        </Text>
        <Text className="text-sm text-muted-foreground text-center mt-1">
          {t('register.subtitle')}
        </Text>
      </View>

      {/* Error Banner */}
      {displayError ? (
        <View className="flex-row items-center bg-destructive/10 border border-destructive/20 p-3.5 rounded-2xl mb-4">
          <AlertCircle size={20} color="#DA1E2E" className="mr-2" />
          <Text className="text-xs font-semibold text-destructive flex-1">
            {displayError}
          </Text>
        </View>
      ) : null}

      {/* Inputs */}
      <View className="space-y-3">
        {/* Full Name */}
        <View className="space-y-1 mb-3">
          <Text className="text-xs font-semibold text-muted-foreground mb-1 uppercase">
            {t('register.fullNameLabel')}
          </Text>
          <View className="flex-row items-center bg-background border border-border rounded-2xl px-3.5 py-3">
            <User size={18} color="#9EA7B8" className="mr-2.5" />
            <TextInput
              className="flex-1 text-sm text-foreground font-medium p-0"
              placeholder={t('register.fullNamePlaceholder')}
              placeholderTextColor="#9EA7B8"
              value={fullName}
              onChangeText={setFullName}
              editable={!isLoading}
              returnKeyType="next"
              onSubmitEditing={() => emailInputRef.current?.focus()}
            />
          </View>
        </View>

        {/* Email */}
        <View className="space-y-1 mb-3">
          <Text className="text-xs font-semibold text-muted-foreground mb-1 uppercase">
            {t('register.emailLabel')}
          </Text>
          <View className="flex-row items-center bg-background border border-border rounded-2xl px-3.5 py-3">
            <Mail size={18} color="#9EA7B8" className="mr-2.5" />
            <TextInput
              ref={emailInputRef}
              className="flex-1 text-sm text-foreground font-medium p-0"
              placeholder={t('register.emailPlaceholder')}
              placeholderTextColor="#9EA7B8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
            />
          </View>
        </View>

        {/* Password */}
        <View className="space-y-1 mb-3">
          <Text className="text-xs font-semibold text-muted-foreground mb-1 uppercase">
            {t('register.passwordLabel')}
          </Text>
          <View className="flex-row items-center bg-background border border-border rounded-2xl px-3.5 py-3">
            <Lock size={18} color="#9EA7B8" className="mr-2.5" />
            <TextInput
              ref={passwordInputRef}
              className="flex-1 text-sm text-foreground font-medium p-0"
              placeholder="••••••••"
              placeholderTextColor="#9EA7B8"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={8}
              accessibilityLabel={showPassword ? t('password.hide') : t('password.show')}
              className="ml-2"
            >
              {showPassword ? (
                <EyeOff size={18} color="#9EA7B8" />
              ) : (
                <Eye size={18} color="#9EA7B8" />
              )}
            </Pressable>
          </View>
        </View>

        {/* Confirm Password */}
        <View className="space-y-1 mb-5">
          <Text className="text-xs font-semibold text-muted-foreground mb-1 uppercase">
            {t('register.confirmPasswordLabel')}
          </Text>
          <View className="flex-row items-center bg-background border border-border rounded-2xl px-3.5 py-3">
            <Lock size={18} color="#9EA7B8" className="mr-2.5" />
            <TextInput
              ref={confirmPasswordInputRef}
              className="flex-1 text-sm text-foreground font-medium p-0"
              placeholder="••••••••"
              placeholderTextColor="#9EA7B8"
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!isLoading}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={isLoading}
          className={`w-full bg-primary py-3.5 rounded-2xl items-center justify-center shadow-md active:opacity-90 ${
            isLoading ? 'opacity-70' : ''
          }`}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-base font-bold text-primary-foreground">
              {t('register.submit')}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Switch to Login */}
      {onNavigateToLogin && (
        <View className="flex-row items-center justify-center mt-6 pt-4 border-t border-border/40">
          <Text className="text-xs text-muted-foreground">
            {t('register.hasAccount')}{' '}
          </Text>
          <Pressable onPress={onNavigateToLogin} hitSlop={8}>
            <Text className="text-xs font-bold text-primary">
              {t('register.loginNow')}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};
