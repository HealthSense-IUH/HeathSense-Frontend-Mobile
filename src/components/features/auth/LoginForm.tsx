import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { LoginRequest } from '@/types/authentication';

interface LoginFormProps {
  onSubmit: (data: LoginRequest) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
  onNavigateToRegister?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading,
  error,
  onNavigateToRegister,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const passwordInputRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    setLocalError(null);
    if (!email.trim()) {
      setLocalError('Vui lòng nhập Email.');
      return;
    }
    if (!password) {
      setLocalError('Vui lòng nhập mật khẩu.');
      return;
    }

    try {
      await onSubmit({ email: email.trim(), password });
    } catch (err: any) {
      // Error handled by parent
    }
  };

  const displayError = localError || error;

  return (
    <View className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-sm">
      {/* Header */}
      <View className="items-center mb-6">
        <View className="w-14 h-14 bg-primary/10 rounded-2xl items-center justify-center mb-3">
          <Lock size={28} color="#0F67FE" />
        </View>
        <Text className="text-2xl font-bold text-foreground text-center">
          Chào mừng trở lại!
        </Text>
        <Text className="text-sm text-muted-foreground text-center mt-1">
          Đăng nhập vào tài khoản HealthSense của bạn
        </Text>
      </View>

      {/* Error Alert Banner */}
      {displayError ? (
        <View className="flex-row items-center bg-destructive/10 border border-destructive/20 p-3.5 rounded-2xl mb-4">
          <AlertCircle size={20} color="#DA1E2E" className="mr-2" />
          <Text className="text-xs font-semibold text-destructive flex-1">
            {displayError}
          </Text>
        </View>
      ) : null}

      {/* Inputs */}
      <View className="space-y-4">
        {/* Email Input */}
        <View className="space-y-1 mb-4">
          <Text className="text-xs font-semibold text-muted-foreground mb-1">
            EMAIL
          </Text>
          <View className="flex-row items-center bg-background border border-border rounded-2xl px-3.5 py-3">
            <Mail size={18} color="#9EA7B8" className="mr-2.5" />
            <TextInput
              className="flex-1 text-sm text-foreground font-medium p-0"
              placeholder="nhapemail@domain.com"
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

        {/* Password Input */}
        <View className="space-y-1 mb-6">
          <Text className="text-xs font-semibold text-muted-foreground mb-1">
            MẬT KHẨU
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
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={8}
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
              Đăng nhập
            </Text>
          )}
        </Pressable>
      </View>

      {/* Switch to Register */}
      {onNavigateToRegister && (
        <View className="flex-row items-center justify-center mt-6 pt-4 border-t border-border/40">
          <Text className="text-xs text-muted-foreground">
            Chưa có tài khoản?{' '}
          </Text>
          <Pressable onPress={onNavigateToRegister} hitSlop={8}>
            <Text className="text-xs font-bold text-primary">
              Đăng ký ngay
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};
