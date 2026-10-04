import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import {
  CalendarDays,
  ChevronLeft,
  CreditCard,
  Edit2,
  Eye,
  EyeOff,
  HeartHandshake,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { profileApi } from '@/services/profile.service';
import { useAuthStore } from '@/services/authentication/authStore';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { formatDateTime } from '@/utils/formatters';
import type { ProfileUpdateRequest, UserProfile } from '@/types/profile';

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  ACTIVE: { label: 'Đang hoạt động', bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', dot: '#10B981' },
  PENDING_VERIFY: { label: 'Chờ xác thực', bg: '#FFFBEB', text: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
  INACTIVE: { label: 'Không hoạt động', bg: '#F1F5F9', text: '#475569', border: '#E2E8F0', dot: '#94A3B8' },
  LOCKED: { label: 'Đã khóa', bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA', dot: '#EF4444' },
  BANNED: { label: 'Bị cấm', bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', dot: '#2563EB' },
};

const ROLE_LABEL: Record<string, string> = { MEMBER: 'Hội viên', DOCTOR: 'Bác sĩ', ADMIN: 'Quản trị viên', SUPER_ADMIN: 'Quản trị cấp cao' };
const GENDER_OPTIONS = [
  { key: 'MALE', label: 'Nam' },
  { key: 'FEMALE', label: 'Nữ' },
  { key: 'OTHER', label: 'Khác' },
];
const genderLabel = (g?: string) => GENDER_OPTIONS.find((o) => o.key === g)?.label || 'Chưa xác định';

/** Che số nhạy cảm, chỉ để lại 4 ký tự cuối (giống web). */
const mask = (val?: string) => (!val ? 'Chưa cung cấp' : val.length <= 4 ? '****' : `${'*'.repeat(Math.max(4, val.length - 4))}${val.slice(-4)}`);

interface FormState {
  displayName: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  citizenId: string;
  bankAccount: string;
  healthInsuranceNumber: string;
}

const toForm = (u: UserProfile): FormState => ({
  displayName: u.displayName || u.fullName || '',
  phone: u.phone || '',
  dateOfBirth: u.dateOfBirth || '',
  gender: u.gender || '',
  address: u.address || '',
  citizenId: u.citizenId || '',
  bankAccount: u.bankAccount || '',
  healthInsuranceNumber: u.healthInsuranceNumber || '',
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="bg-card border border-border rounded-3xl p-5 mb-4">
      <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ icon, label, value, last }: { icon: React.ReactNode; label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row items-center py-3 ${last ? '' : 'border-b border-border/50'}`} style={{ gap: 12 }}>
      <View className="w-9 h-9 bg-primary/10 rounded-xl items-center justify-center">{icon}</View>
      <View className="flex-1">
        <Text className="text-[11px] text-muted-foreground">{label}</Text>
        <Text className="text-sm font-semibold text-foreground mt-0.5">{value}</Text>
      </View>
    </View>
  );
}

function Field({ label, value, onChange, placeholder, required, keyboardType, maxLength, multiline }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'numeric'; maxLength?: number; multiline?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text className="text-xs font-semibold text-foreground">
        {label} {required ? <Text className="text-rose-500">*</Text> : null}
      </Text>
      <TextInput
        className={`border border-border rounded-xl px-4 text-foreground bg-background text-sm ${multiline ? 'py-3 min-h-[80px]' : 'h-11'}`}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

/** Hồ sơ tài khoản (giống web /app/general/profile): xem + chỉnh sửa thông tin cá nhân và định danh. */
export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [editing, setEditing] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);

  const { data: profile, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: [QUERY_KEYS.USER_PROFILE],
    queryFn: profileApi.getMe,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: ProfileUpdateRequest) => profileApi.updateMe(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData([QUERY_KEYS.USER_PROFILE], updated);
      if (authUser) setUser({ ...authUser, fullName: updated.displayName || updated.fullName || authUser.fullName });
      setEditing(false);
      Alert.alert('Cập nhật hồ sơ thành công', 'Thông tin cá nhân và định danh của bạn đã được lưu.');
    },
    onError: (err: any) => {
      Alert.alert('Cập nhật hồ sơ thất bại', err?.response?.data?.message || err?.message || 'Vui lòng thử lại sau.');
    },
  });

  const startEdit = () => {
    if (!profile) return;
    setForm(toForm(profile));
    setEditing(true);
  };

  const handleSave = () => {
    if (!form) return;
    const name = form.displayName.trim();
    if (!name) return Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên hiển thị.');
    if (name.length > 120) return Alert.alert('Không hợp lệ', 'Tên hiển thị không được vượt quá 120 ký tự.');
    if (form.phone.trim().length > 30) return Alert.alert('Không hợp lệ', 'Số điện thoại không được vượt quá 30 ký tự.');
    if (form.dateOfBirth.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth.trim())) return Alert.alert('Không hợp lệ', 'Ngày sinh phải có định dạng YYYY-MM-DD.');
    if (form.citizenId.trim().length > 20) return Alert.alert('Không hợp lệ', 'Số CCCD không được vượt quá 20 ký tự.');
    saveMutation.mutate({
      displayName: name,
      phone: form.phone.trim() || undefined,
      dateOfBirth: form.dateOfBirth.trim() || undefined,
      gender: form.gender || undefined,
      address: form.address.trim() || undefined,
      citizenId: form.citizenId.trim() || undefined,
      bankAccount: form.bankAccount.trim() || undefined,
      healthInsuranceNumber: form.healthInsuranceNumber.trim() || undefined,
    });
  };

  const status = profile?.status ? STATUS_BADGE[profile.status] || { label: profile.status, bg: '#F1F5F9', text: '#334155', border: '#E2E8F0', dot: '#64748B' } : null;
  const name = profile?.displayName || profile?.fullName || 'Người dùng';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  const renderView = () => {
    if (!profile) return null;
    return (
      <>
        <View className="bg-card border border-border rounded-3xl p-5 mb-4 items-center">
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={{ width: 88, height: 88, borderRadius: 44 }} contentFit="cover" />
          ) : (
            <View className="w-[88px] h-[88px] rounded-full bg-primary/10 items-center justify-center">
              <Text className="text-2xl font-bold text-primary">{initials || 'HS'}</Text>
            </View>
          )}
          <Text className="text-lg font-bold text-foreground mt-3">{name}</Text>
          <View className="flex-row items-center mt-1.5" style={{ gap: 8 }}>
            <View className="flex-row items-center bg-secondary/60 px-2.5 py-1 rounded-full" style={{ gap: 4 }}>
              <ShieldCheck size={12} color="#00349C" />
              <Text className="text-[10px] font-bold text-secondary-foreground uppercase">{ROLE_LABEL[profile.role || ''] || profile.role || 'Hội viên'}</Text>
            </View>
            {status ? (
              <View className="flex-row items-center px-2.5 py-1 rounded-full border" style={{ gap: 6, backgroundColor: status.bg, borderColor: status.border }}>
                <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.dot }} />
                <Text className="text-[10px] font-bold" style={{ color: status.text }}>{status.label}</Text>
              </View>
            ) : null}
          </View>
          <View className="flex-row items-center mt-2" style={{ gap: 6 }}>
            <Mail size={13} color="#64748B" />
            <Text className="text-xs text-muted-foreground">{profile.email || 'Chưa liên kết email'}</Text>
          </View>
          <Pressable onPress={startEdit} className="mt-4 h-10 px-4 rounded-xl bg-primary flex-row items-center active:opacity-90" style={{ gap: 6 }}>
            <Edit2 size={14} color="#FFFFFF" />
            <Text className="text-white text-xs font-bold">Chỉnh sửa hồ sơ & Định danh</Text>
          </Pressable>
        </View>

        <Section title="Thông tin cá nhân & Liên hệ">
          <InfoRow icon={<Phone size={16} color="#0D6EFD" />} label="Số điện thoại" value={profile.phone || 'Chưa cập nhật'} />
          <InfoRow icon={<CalendarDays size={16} color="#0D6EFD" />} label="Ngày sinh" value={profile.dateOfBirth ? profile.dateOfBirth.split('-').reverse().join('/') : 'Chưa cập nhật'} />
          <InfoRow icon={<UserIcon size={16} color="#0D6EFD" />} label="Giới tính" value={genderLabel(profile.gender)} />
          <InfoRow icon={<MapPin size={16} color="#0D6EFD" />} label="Địa chỉ liên hệ" value={profile.address || 'Chưa thiết lập địa chỉ'} last />
        </Section>

        <Section title="Thông tin định danh (CCCD / CMND)">
          <Pressable onPress={() => setShowSensitive((v) => !v)} className="flex-row items-center self-end mb-1 active:opacity-70" style={{ gap: 4 }}>
            {showSensitive ? <EyeOff size={14} color="#0D6EFD" /> : <Eye size={14} color="#0D6EFD" />}
            <Text className="text-xs font-semibold text-primary">{showSensitive ? 'Ẩn thông tin bảo mật' : 'Hiện thông tin bảo mật'}</Text>
          </Pressable>
          <InfoRow icon={<CreditCard size={16} color="#0D6EFD" />} label="Số Căn cước công dân (CCCD)" value={showSensitive ? profile.citizenId || 'Chưa cung cấp' : mask(profile.citizenId)} />
          <InfoRow icon={<CreditCard size={16} color="#0D6EFD" />} label="Tài khoản ngân hàng" value={showSensitive ? profile.bankAccount || 'Chưa cung cấp' : mask(profile.bankAccount)} />
          <InfoRow icon={<HeartHandshake size={16} color="#0D6EFD" />} label="Mã số Thẻ BHYT" value={showSensitive ? profile.healthInsuranceNumber || 'Chưa cung cấp' : mask(profile.healthInsuranceNumber)} last />
          <View className="flex-row mt-3" style={{ gap: 10 }}>
            {[
              { label: 'CCCD Mặt Trước', url: profile.identityCardFrontUrl, rotate: profile.identityCardFrontRotate },
              { label: 'CCCD Mặt Sau', url: profile.identityCardBackUrl, rotate: profile.identityCardBackRotate },
            ].map((side) => (
              <View key={side.label} className="flex-1 rounded-2xl border border-dashed border-border bg-muted/30 p-2 items-center" style={{ gap: 6 }}>
                <Text className="text-[11px] font-semibold text-foreground">{side.label}</Text>
                {side.url ? (
                  <Image source={{ uri: side.url }} style={{ width: '100%', aspectRatio: 1.58, borderRadius: 10, transform: [{ rotate: `${side.rotate || 0}deg` }] }} contentFit="cover" />
                ) : (
                  <Text className="text-[11px] text-muted-foreground py-6">Chưa tải ảnh</Text>
                )}
              </View>
            ))}
          </View>
          <Text className="text-[11px] text-muted-foreground mt-2">Tải ảnh CCCD và đổi ảnh đại diện hiện thực hiện trên web.</Text>
        </Section>

        <Section title="Bảo mật & Thời gian hệ thống">
          <InfoRow icon={<CalendarDays size={16} color="#0D6EFD" />} label="Ngày tham gia" value={formatDateTime(profile.createdAt, 'Chưa xác định')} />
          <InfoRow icon={<RefreshCw size={16} color="#0D6EFD" />} label="Cập nhật lần cuối" value={formatDateTime(profile.updatedAt, 'Chưa xác định')} last />
        </Section>
      </>
    );
  };

  const renderEdit = () => {
    if (!form) return null;
    const set = (key: keyof FormState) => (v: string) => setForm((f) => (f ? { ...f, [key]: v } : f));
    return (
      <View className="bg-card border border-border rounded-3xl p-5 mb-4" style={{ gap: 16 }}>
        <View>
          <Text className="text-base font-bold text-foreground">Cập nhật hồ sơ & Định danh cá nhân</Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            Các trường đánh dấu <Text className="text-rose-500">*</Text> là bắt buộc.
          </Text>
        </View>

        <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">1. Thông tin cá nhân cơ bản</Text>
        <Field label="Tên hiển thị" required value={form.displayName} onChange={set('displayName')} placeholder="Nhập họ và tên hiển thị" maxLength={120} />
        <Field label="Số điện thoại" value={form.phone} onChange={set('phone')} placeholder="VD: 0909 123 456" keyboardType="phone-pad" maxLength={30} />
        <Field label="Ngày sinh (YYYY-MM-DD)" value={form.dateOfBirth} onChange={set('dateOfBirth')} placeholder="VD: 1990-05-20" keyboardType="numeric" maxLength={10} />
        <View style={{ gap: 6 }}>
          <Text className="text-xs font-semibold text-foreground">Giới tính</Text>
          <View className="flex-row" style={{ gap: 8 }}>
            {GENDER_OPTIONS.map((g) => {
              const active = form.gender === g.key;
              return (
                <Pressable key={g.key} onPress={() => set('gender')(g.key)} className={`flex-1 h-10 rounded-xl border items-center justify-center ${active ? 'bg-primary border-primary' : 'bg-background border-border'}`}>
                  <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-foreground'}`}>{g.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <Field label="Địa chỉ liên hệ" value={form.address} onChange={set('address')} placeholder="Nhập địa chỉ, số nhà, phường/xã, quận/huyện, tỉnh/thành phố" multiline />

        <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">2. Thông tin định danh & Bảo mật</Text>
        <Field label="Số CCCD / CMND" value={form.citizenId} onChange={set('citizenId')} placeholder="VD: 079204001234" keyboardType="numeric" maxLength={20} />
        <Field label="Tài khoản ngân hàng" value={form.bankAccount} onChange={set('bankAccount')} placeholder="VD: 1029384756 - Vietcombank" />
        <Field label="Mã số Thẻ BHYT" value={form.healthInsuranceNumber} onChange={set('healthInsuranceNumber')} placeholder="VD: DN4790123456789" />

        <View className="flex-row pt-2" style={{ gap: 10 }}>
          <Pressable onPress={() => setEditing(false)} disabled={saveMutation.isPending} className="flex-1 h-11 rounded-xl border border-border bg-background items-center justify-center active:opacity-80">
            <Text className="text-xs font-semibold text-foreground">Hủy bỏ</Text>
          </Pressable>
          <Pressable onPress={handleSave} disabled={saveMutation.isPending} className="flex-1 h-11 rounded-xl bg-primary flex-row items-center justify-center active:opacity-90" style={{ gap: 6, opacity: saveMutation.isPending ? 0.6 : 1 }}>
            {saveMutation.isPending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Save size={14} color="#FFFFFF" />}
            <Text className="text-xs font-bold text-white">Lưu thay đổi</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper
      title="Hồ sơ tài khoản"
      description="Thông tin liên hệ, định danh và bảo mật tài khoản"
      withKeyboardHandling
      headerLeft={
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/settings' as any))} className="h-10 w-10 items-center justify-center bg-muted rounded-full active:opacity-70" aria-label="Quay lại">
          <ChevronLeft size={24} color="#0F172A" />
        </Pressable>
      }
      headerRight={
        <Pressable onPress={() => refetch()} className="h-10 w-10 items-center justify-center bg-white border border-slate-200/80 rounded-full active:opacity-70" aria-label="Làm mới">
          {isFetching && !isLoading ? <ActivityIndicator size="small" color="#0D6EFD" /> : <RefreshCw size={18} color="#64748B" />}
        </Pressable>
      }
    >
      <View className="px-5 pb-10 mt-2">
        {isLoading ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#0D6EFD" />
            <Text className="text-xs text-muted-foreground mt-3">Đang tải thông tin tài khoản...</Text>
          </View>
        ) : error && !profile ? (
          <View className="bg-rose-50 border border-rose-200 rounded-2xl p-5 items-center" style={{ gap: 8 }}>
            <Text className="text-sm font-semibold text-rose-700">Không thể tải thông tin hồ sơ</Text>
            <Pressable onPress={() => refetch()} className="h-9 px-4 rounded-xl bg-white border border-border items-center justify-center">
              <Text className="text-xs font-semibold text-foreground">Thử kết nối lại</Text>
            </Pressable>
          </View>
        ) : editing ? (
          renderEdit()
        ) : (
          renderView()
        )}
      </View>
    </ScreenWrapper>
  );
}
