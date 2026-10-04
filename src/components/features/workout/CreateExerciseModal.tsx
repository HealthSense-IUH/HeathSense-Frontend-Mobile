import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Check, ChevronDown, X } from 'lucide-react-native';
import { ExerciseCategory, TrackingMetricType } from '@/services/workout/workoutTypes';
import { getCategoryLabel, getTrackingTypeLabel } from '@/services/workout/workoutI18n';
import { useWorkoutCatalogStore } from '@/services/workout/workoutCatalogStore';
import { useTranslation } from 'react-i18next';

interface CreateExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated?: (exerciseId: string) => void;
}

const CATEGORIES: ExerciseCategory[] = [
  'GENERAL',
  'AEROBIC',
  'FREE_WEIGHT',
  'MACHINE_WEIGHT',
  'WILDERNESS',
  'WATER',
  'WINTER',
  'BALL',
];

const TRACKING_TYPES: TrackingMetricType[] = [
  'TIME_CALORIES',
  'DISTANCE_GPS',
  'SETS_REST',
];

export const CreateExerciseModal: React.FC<CreateExerciseModalProps> = ({
  visible,
  onClose,
  onCreated,
}) => {
  const { t } = useTranslation('workout');
  const addCustomExercise = useWorkoutCatalogStore((state) => state.addCustomExercise);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>('GENERAL');
  const [trackingType, setTrackingType] = useState<TrackingMetricType>('TIME_CALORIES');

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showTrackingDropdown, setShowTrackingDropdown] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      setErrorMsg(t('createExercise.nameRequired'));
      return;
    }

    const created = addCustomExercise({
      name: name.trim(),
      category,
      trackingType,
      met: trackingType === 'DISTANCE_GPS' ? 6.5 : trackingType === 'SETS_REST' ? 4.5 : 4.0,
      iconName: category === 'BALL' ? 'Trophy' : category === 'WATER' ? 'Waves' : 'Activity',
      description: t('createExercise.customDescription'),
    });

    setName('');
    setErrorMsg('');
    setShowCategoryDropdown(false);
    setShowTrackingDropdown(false);
    onClose();

    if (onCreated) {
      onCreated(created.id);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-end bg-black/60"
        onPress={() => {
          setShowCategoryDropdown(false);
          setShowTrackingDropdown(false);
          onClose();
        }}
      >
        <Pressable
          className="bg-slate-900 rounded-t-3xl p-6 border-t border-slate-800"
          style={{ maxHeight: '85%' }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-xl font-bold text-white tracking-tight">
              {t('catalog.createExercise')}
            </Text>
            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center active:opacity-75"
            >
              <X color="#94A3B8" size={18} />
            </Pressable>
          </View>

          {/* Form Content */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Input Name */}
            <View className="mb-5">
              <Text className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                {t('createExercise.nameLabel')}
              </Text>
              <TextInput
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder={t('createExercise.namePlaceholder')}
                placeholderTextColor="#64748B"
                className="bg-slate-800/90 text-white font-medium px-4 py-3.5 rounded-2xl border border-slate-700 text-base"
              />
              {errorMsg ? (
                <Text className="text-red-400 text-xs mt-1.5 font-medium ml-1">
                  {errorMsg}
                </Text>
              ) : null}
            </View>

            {/* Tracking Type Dropdown */}
            <View className="mb-5">
              <Text className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                {t('createExercise.trackingLabel')}
              </Text>
              <Pressable
                onPress={() => {
                  setShowTrackingDropdown(!showTrackingDropdown);
                  setShowCategoryDropdown(false);
                }}
                className="bg-slate-800/90 flex-row items-center justify-between px-4 py-3.5 rounded-2xl border border-slate-700 active:opacity-80"
              >
                <Text className="text-emerald-400 font-medium text-base" numberOfLines={1}>
                  {getTrackingTypeLabel(trackingType)}
                </Text>
                <ChevronDown color="#94A3B8" size={18} />
              </Pressable>

              {showTrackingDropdown && (
                <View className="mt-2 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
                  {TRACKING_TYPES.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => {
                        setTrackingType(item);
                        setShowTrackingDropdown(false);
                      }}
                      className="flex-row items-center justify-between px-4 py-3 border-b border-slate-700/60 active:bg-slate-700/50"
                    >
                      <Text
                        className={`text-sm ${
                          trackingType === item ? 'text-emerald-400 font-semibold' : 'text-slate-300'
                        }`}
                      >
                        {getTrackingTypeLabel(item)}
                      </Text>
                      {trackingType === item && <Check color="#10B981" size={18} />}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Category Dropdown */}
            <View className="mb-6">
              <Text className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                {t('createExercise.categoryLabel')}
              </Text>
              <Pressable
                onPress={() => {
                  setShowCategoryDropdown(!showCategoryDropdown);
                  setShowTrackingDropdown(false);
                }}
                className="bg-slate-800/90 flex-row items-center justify-between px-4 py-3.5 rounded-2xl border border-slate-700 active:opacity-80"
              >
                <Text className="text-emerald-400 font-medium text-base">
                  {getCategoryLabel(category)}
                </Text>
                <ChevronDown color="#94A3B8" size={18} />
              </Pressable>

              {showCategoryDropdown && (
                <View className="mt-2 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => {
                        setCategory(cat);
                        setShowCategoryDropdown(false);
                      }}
                      className="flex-row items-center justify-between px-4 py-3 border-b border-slate-700/60 active:bg-slate-700/50"
                    >
                      <Text
                        className={`text-sm ${
                          category === cat ? 'text-emerald-400 font-semibold' : 'text-slate-300'
                        }`}
                      >
                        {getCategoryLabel(cat)}
                      </Text>
                      {category === cat && <Check color="#10B981" size={18} />}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons: Thoát | Lưu */}
          <View className="flex-row gap-3 pt-2">
            <Pressable
              onPress={onClose}
              className="flex-1 py-3.5 rounded-2xl bg-slate-800 items-center justify-center border border-slate-700 active:opacity-75"
            >
              <Text className="text-slate-300 font-semibold text-base">{t('common.exit')}</Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              className="flex-1 py-3.5 rounded-2xl bg-emerald-600 items-center justify-center shadow-md active:opacity-75"
            >
              <Text className="text-white font-bold text-base">{t('common:actions.save')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
