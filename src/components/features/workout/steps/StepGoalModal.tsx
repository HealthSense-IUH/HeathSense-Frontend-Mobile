import React, { useState } from 'react';
import { View, Text, Modal, TextInput, Pressable } from 'react-native';
import { Target } from 'lucide-react-native';

interface StepGoalModalProps {
  visible: boolean;
  currentTargetGoal: number;
  onClose: () => void;
  onSave: (newGoal: number) => void;
}

interface StepGoalFormProps {
  currentTargetGoal: number;
  onClose: () => void;
  onSave: (newGoal: number) => void;
}

const StepGoalForm: React.FC<StepGoalFormProps> = ({
  currentTargetGoal,
  onClose,
  onSave,
}) => {
  const [goalText, setGoalText] = useState(() => currentTargetGoal.toString());

  const handleSave = () => {
    const parsed = parseInt(goalText, 10);
    if (!isNaN(parsed) && parsed >= 500 && parsed <= 50000) {
      onSave(parsed);
    }
    onClose();
  };

  return (
    <View className="flex-1 bg-black/60 items-center justify-center p-5">
      <View className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl">
        <View className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 items-center justify-center mx-auto mb-4">
          <Target color="#10B981" size={24} />
        </View>

        <Text className="text-lg font-bold text-slate-900 text-center mb-1">
          Mục tiêu số bước
        </Text>
        <Text className="text-xs text-slate-500 text-center mb-5">
          Thiết lập mục tiêu bước chân hàng ngày để duy trì lối sống lành mạnh.
        </Text>

        <View className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-5 flex-row items-center justify-center">
          <TextInput
            value={goalText}
            onChangeText={setGoalText}
            keyboardType="numeric"
            className="text-2xl font-extrabold text-slate-900 text-center w-full"
            placeholder="6000"
          />
        </View>

        <View className="flex-row gap-3">
          <Pressable
            onPress={onClose}
            className="flex-1 py-3 rounded-2xl bg-slate-100 items-center justify-center active:opacity-75"
          >
            <Text className="text-sm font-semibold text-slate-700">Hủy</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            className="flex-1 py-3 rounded-2xl bg-[#00C8FF] items-center justify-center active:opacity-85 shadow-sm"
          >
            <Text className="text-sm font-bold text-white">Lưu mục tiêu</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export const StepGoalModal: React.FC<StepGoalModalProps> = ({
  visible,
  currentTargetGoal,
  onClose,
  onSave,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {visible ? (
        <StepGoalForm
          key={currentTargetGoal}
          currentTargetGoal={currentTargetGoal}
          onClose={onClose}
          onSave={onSave}
        />
      ) : null}
    </Modal>
  );
};

