import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Trans, useTranslation } from 'react-i18next';
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

/** Màu huy hiệu trạng thái tài khoản; nhãn lấy từ profile:status.* */
const STATUS_BADGE: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  ACTIVE: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', dot: '#10B981' },
  PENDING_VERIFY: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
  INACTIVE: { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0', dot: '#94A3B8' },
  LOCKED: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA', dot: '#EF4444' },
  BANNED: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', dot: '#2563EB' },
};
const STATUS_BADGE_FALLBACK = { bg: '#F1F5F9', text: '#334155', border: '#E2E8F0', dot: '#64748B' };

const GENDER_KEYS = ['MALE', 'FEMALE', 'OTHER'] as const;

/** Che số nhạy cảm, chỉ để lại 4 ký tự cuối (giống web). */
const mask = (val: string | undefined, notProvided: string) =>
  !val ? notProvided : val.length <= 4 ? '****' : `${'*'.repeat(Math.max(4, val.length - 4))}${val.slice(-4)}`;

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
  const { t } = useTranslation('profile');
  const router = useRouter();
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [editing, setEditing] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);

  const notProvided = t('card.notProvided');
  const genderLabel = (g?: string) => (g && GENDER_KEYS.includes(g as (typeof GENDER_KEYS)[number]) ? t(`gender.${g}`) : t('card.notSpecified'));

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
      Alert.alert(t('toast.saveSuccessTitle'), t('toast.saveSuccessDescription'));
    },
    onError: (err: any) => {
      Alert.alert(t('toast.saveFailed'), err?.response?.data?.message || err?.message || t('common:error.generic'));
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
    if (!name) return Alert.alert(t('validation.missingTitle'), t('validation.displayNameRequired'));
    if (name.length > 120) return Alert.alert(t('validation.invalidTitle'), t('validation.displayNameTooLong'));
    if (form.phone.trim().length > 30) return Alert.alert(t('validation.invalidTitle'), t('validation.phoneTooLong'));
    if (form.dateOfBirth.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth.trim())) return Alert.alert(t('validation.invalidTitle'), t('validation.dateOfBirthFormat'));
    if (form.citizenId.trim().length > 20) return Alert.alert(t('validation.invalidTitle'), t('validation.citizenIdTooLong'));
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

  const status = profile?.status
    ? { ...(STATUS_BADGE[profile.status] || STATUS_BADGE_FALLBACK), label: t(`status.${profile.status}`, { defaultValue: profile.status }) }
    : null;
  const roleCode = profile?.role || 'MEMBER';
  const roleLabel = t(`role.${roleCode}`, { defaultValue: roleCode });
  const name = profile?.displayName || profile?.fullName || t('card.defaultUser');
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
              <Text className="text-[10px] font-bold text-secondary-foreground uppercase">{roleLabel}</Text>
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
            <Text className="text-xs text-muted-foreground">{profile.email || t('card.noEmail')}</Text>
          </View>
          <Pressable onPress={startEdit} className="mt-4 h-10 px-4 rounded-xl bg-primary flex-row items-center active:opacity-90" style={{ gap: 6 }}>
            <Edit2 size={14} color="#FFFFFF" />
            <Text className="text-white text-xs font-bold">{t('card.edit')}</Text>
          </Pressable>
        </View>

        <Section title={t('view.personalTitle')}>
          <InfoRow icon={<Phone size={16} color="#0D6EFD" />} label={t('fields.phone')} value={profile.phone || t('card.notUpdated')} />
          <InfoRow icon={<CalendarDays size={16} color="#0D6EFD" />} label={t('fields.dateOfBirth')} value={profile.dateOfBirth ? profile.dateOfBirth.split('-').reverse().join('/') : t('card.notUpdated')} />
          <InfoRow icon={<UserIcon size={16} color="#0D6EFD" />} label={t('fields.gender')} value={genderLabel(profile.gender)} />
          <InfoRow icon={<MapPin size={16} color="#0D6EFD" />} label={t('fields.address')} value={profile.address || t('card.noAddress')} last />
        </Section>

        <Section title={t('view.identityTitle')}>
          <Pressable onPress={() => setShowSensitive((v) => !v)} className="flex-row items-center self-end mb-1 active:opacity-70" style={{ gap: 4 }}>
            {showSensitive ? <EyeOff size={14} color="#0D6EFD" /> : <Eye size={14} color="#0D6EFD" />}
            <Text className="text-xs font-semibold text-primary">{showSensitive ? t('view.hideSensitive') : t('view.showSensitive')}</Text>
          </Pressable>
          <InfoRow icon={<CreditCard size={16} color="#0D6EFD" />} label={t('view.citizenId')} value={showSensitive ? profile.citizenId || notProvided : mask(profile.citizenId, notProvided)} />
          <InfoRow icon={<CreditCard size={16} color="#0D6EFD" />} label={t('fields.bankAccount')} value={showSensitive ? profile.bankAccount || notProvided : mask(profile.bankAccount, notProvided)} />
          <InfoRow icon={<HeartHandshake size={16} color="#0D6EFD" />} label={t('fields.healthInsurance')} value={showSensitive ? profile.healthInsuranceNumber || notProvided : mask(profile.healthInsuranceNumber, notProvided)} last />
          <View className="flex-row mt-3" style={{ gap: 10 }}>
            {[
              { key: 'front', label: t('cccd.front'), url: profile.identityCardFrontUrl, rotate: profile.identityCardFrontRotate },
              { key: 'back', label: t('cccd.back'), url: profile.identityCardBackUrl, rotate: profile.identityCardBackRotate },
            ].map((side) => (
              <View key={side.key} className="flex-1 rounded-2xl border border-dashed border-border bg-muted/30 p-2 items-center" style={{ gap: 6 }}>
                <Text className="text-[11px] font-semibold text-foreground">{side.label}</Text>
                {side.url ? (
                  <Image source={{ uri: side.url }} style={{ width: '100%', aspectRatio: 1.58, borderRadius: 10, transform: [{ rotate: `${side.rotate || 0}deg` }] }} contentFit="cover" />
                ) : (
                  <Text className="text-[11px] text-muted-foreground py-6">{t('cccd.notUploaded')}</Text>
                )}
              </View>
            ))}
          </View>
          <Text className="text-[11px] text-muted-foreground mt-2">{t('cccd.webOnlyNote')}</Text>
        </Section>

        <Section title={t('view.securityTitle')}>
          <InfoRow icon={<CalendarDays size={16} color="#0D6EFD" />} label={t('view.joinedAt')} value={formatDateTime(profile.createdAt, t('card.notSpecified'))} />
          <InfoRow icon={<RefreshCw size={16} color="#0D6EFD" />} label={t('view.lastUpdated')} value={formatDateTime(profile.updatedAt, t('card.notSpecified'))} last />
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
          <Text className="text-base font-bold text-foreground">{t('form.title')}</Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            <Trans t={t} i18nKey="form.requiredNote" components={{ mark: <Text className="text-rose-500" /> }} />
          </Text>
        </View>

        <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('form.section1')}</Text>
        <Field label={t('fields.displayName')} required value={form.displayName} onChange={set('displayName')} placeholder={t('form.displayNamePlaceholder')} maxLength={120} />
        <Field label={t('fields.phone')} value={form.phone} onChange={set('phone')} placeholder={t('form.phonePlaceholder')} keyboardType="phone-pad" maxLength={30} />
        <Field label={t('form.dateOfBirthLabel')} value={form.dateOfBirth} onChange={set('dateOfBirth')} placeholder={t('form.dateOfBirthPlaceholder')} keyboardType="numeric" maxLength={10} />
        <View style={{ gap: 6 }}>
          <Text className="text-xs font-semibold text-foreground">{t('fields.gender')}</Text>
          <View className="flex-row" style={{ gap: 8 }}>
            {GENDER_KEYS.map((key) => {
              const active = form.gender === key;
              return (
                <Pressable key={key} onPress={() => set('gender')(key)} className={`flex-1 h-10 rounded-xl border items-center justify-center ${active ? 'bg-primary border-primary' : 'bg-background border-border'}`}>
                  <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-foreground'}`}>{t(`gender.${key}`)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <Field label={t('fields.address')} value={form.address} onChange={set('address')} placeholder={t('form.addressPlaceholder')} multiline />

        <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">{t('form.section2')}</Text>
        <Field label={t('fields.citizenId')} value={form.citizenId} onChange={set('citizenId')} placeholder={t('form.citizenIdPlaceholder')} keyboardType="numeric" maxLength={20} />
        <Field label={t('fields.bankAccount')} value={form.bankAccount} onChange={set('bankAccount')} placeholder={t('form.bankAccountPlaceholder')} />
        <Field label={t('fields.healthInsurance')} value={form.healthInsuranceNumber} onChange={set('healthInsuranceNumber')} placeholder={t('form.healthInsurancePlaceholder')} />

        <View className="flex-row pt-2" style={{ gap: 10 }}>
          <Pressable onPress={() => setEditing(false)} disabled={saveMutation.isPending} className="flex-1 h-11 rounded-xl border border-border bg-background items-center justify-center active:opacity-80">
            <Text className="text-xs font-semibold text-foreground">{t('form.cancel')}</Text>
          </Pressable>
          <Pressable onPress={handleSave} disabled={saveMutation.isPending} className="flex-1 h-11 rounded-xl bg-primary flex-row items-center justify-center active:opacity-90" style={{ gap: 6, opacity: saveMutation.isPending ? 0.6 : 1 }}>
            {saveMutation.isPending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Save size={14} color="#FFFFFF" />}
            <Text className="text-xs font-bold text-white">{t('form.save')}</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper
      title={t('page.title')}
      description={t('page.subtitle')}
      withKeyboardHandling
      headerLeft={
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/settings' as any))} className="h-10 w-10 items-center justify-center bg-muted rounded-full active:opacity-70" aria-label={t('common:actions.back')}>
          <ChevronLeft size={24} color="#0F172A" />
        </Pressable>
      }
      headerRight={
        <Pressable onPress={() => refetch()} className="h-10 w-10 items-center justify-center bg-white border border-slate-200/80 rounded-full active:opacity-70" aria-label={t('common:actions.refresh')}>
          {isFetching && !isLoading ? <ActivityIndicator size="small" color="#0D6EFD" /> : <RefreshCw size={18} color="#64748B" />}
        </Pressable>
      }
    >
      <View className="px-5 pb-10 mt-2">
        {isLoading ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#0D6EFD" />
            <Text className="text-xs text-muted-foreground mt-3">{t('page.loading')}</Text>
          </View>
        ) : error && !profile ? (
          <View className="bg-rose-50 border border-rose-200 rounded-2xl p-5 items-center" style={{ gap: 8 }}>
            <Text className="text-sm font-semibold text-rose-700">{t('page.loadErrorTitle')}</Text>
            <Pressable onPress={() => refetch()} className="h-9 px-4 rounded-xl bg-white border border-border items-center justify-center">
              <Text className="text-xs font-semibold text-foreground">{t('page.retry')}</Text>
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
