import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AlertCircle, Eye, EyeOff, Lock, Mail, LogIn } from 'lucide-react-native';
import { LoginRequest } from '@/types/authentication';
import { MedicalInput } from '@/components/ui/MedicalInput';
import { GradientButton } from '@/components/ui/GradientButton';

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
    } catch {
      // Error handled by parent
    }
  };

  const displayError = localError || error;

  return (
    <View className="w-full bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-100">
      {/* Medical Lock Badge Icon */}
      <View className="flex items-center -mt-1 justify-center mb-6">
        <View className="w-14 h-14 rounded-2xl bg-medical-50 border border-blue-100/80 items-center justify-center shadow-sm">
          <Lock size={28} color="#0D6EFD" />
        </View>
      </View>
      
      {/* Card Heading */}
      <View className="items-center mb-6">
        <Text className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Chào mừng trở lại!
        </Text>
        <Text className="text-xs sm:text-sm text-slate-500 mt-1">
          Đăng nhập vào tài khoản HealthSense của bạn
        </Text>
      </View>

      {/* Error Alert Banner */}
      {displayError ? (
        <View className="flex-row items-center bg-rose-50 border border-rose-200 p-3.5 rounded-xl mb-4">
          <AlertCircle size={20} color="#E11D48" className="mr-2" />
          <Text className="text-xs font-semibold text-rose-600 flex-1">
            {displayError}
          </Text>
        </View>
      ) : null}

      {/* Inputs */}
      <View className="space-y-4 w-full">
        <MedicalInput
          label="EMAIL"
          icon={<Mail size={20} />}
          placeholder="nhapemail@domain.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          editable={!isLoading}
          returnKeyType="next"
          onSubmitEditing={() => passwordInputRef.current?.focus()}
        />

        <View className="space-y-1.5 w-full">
          <View className="flex-row items-center justify-between z-10 relative">
            <Text className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">MẬT KHẨU</Text>
            <Pressable hitSlop={8}>
              <Text className="text-[11px] font-semibold text-medical-500">Quên mật khẩu?</Text>
            </Pressable>
          </View>
          <MedicalInput
            ref={passwordInputRef}
            icon={<Lock size={20} />}
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            rightElement={
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                {showPassword ? (
                  <EyeOff size={20} color="#94A3B8" />
                ) : (
                  <Eye size={20} color="#94A3B8" />
                )}
              </Pressable>
            }
          />
        </View>

        {/* Submit Button */}
        <View className="pt-2">
          <GradientButton 
            title={isLoading ? 'Đang xử lý...' : 'Đăng nhập'} 
            onPress={handleSubmit} 
            disabled={isLoading}
            icon={!isLoading ? <LogIn size={16} color="white" /> : <ActivityIndicator size="small" color="white" />}
          />
        </View>
      </View>

      {/* Divider & Sign Up Redirection */}
      {onNavigateToRegister && (
        <View className="flex-row items-center justify-center mt-6 pt-5 border-t border-slate-100">
          <Text className="text-xs sm:text-sm text-slate-500 font-normal">
            Chưa có tài khoản?{' '}
          </Text>
          <Pressable onPress={onNavigateToRegister} hitSlop={8}>
            <Text className="text-xs sm:text-sm font-bold text-medical-500 ml-1">
              Đăng ký ngay
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};
