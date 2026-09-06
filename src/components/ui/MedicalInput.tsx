import React, { useState, forwardRef } from 'react';
import { View, TextInput, TextInputProps, Text } from 'react-native';

interface MedicalInputProps extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerClassName?: string;
}

export const MedicalInput = forwardRef<TextInput, MedicalInputProps>(({ 
  label, 
  icon, 
  rightElement, 
  containerClassName = '',
  ...props 
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={`space-y-1.5 w-full ${containerClassName}`}>
      {/* Label */}
      {label && (
        <Text className="text-[11px] mb-[6px] font-bold tracking-wider text-slate-500 uppercase">
          {label}
        </Text>
      )}

      {/* Input Container */}
      <View 
        className={`relative flex-row items-center w-full rounded-xl border ${
          isFocused ? 'bg-white border-medical-500' : 'bg-slate-50 border-slate-200'
        }`}
        style={{
          shadowColor: 'rgba(13, 110, 253, 0.2)',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isFocused ? 1 : 0,
          shadowRadius: 4,
          elevation: isFocused ? 2 : 0,
        }}
      >
        {icon && (
          <View className="pl-3.5 absolute z-10 flex items-center justify-center h-full">
            {React.cloneElement(icon as React.ReactElement<any>, {
              color: isFocused ? '#0D6EFD' : '#94A3B8'
            })}
          </View>
        )}

        {/* Input */}
        <TextInput
          ref={ref}
          className={`flex-1 py-3 text-slate-800 text-sm h-12 ${icon ? 'pl-11' : 'pl-4'} ${rightElement ? 'pr-11' : 'pr-4'}`}
          placeholderTextColor="#94A3B8"
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />

        {/* Right Element (e.g. Eye Toggle) */}
        {rightElement && (
          <View className="pr-3.5 absolute right-0 z-10 flex items-center justify-center h-full">
            {rightElement}
          </View>
        )}
      </View>
    </View>
  );
});

MedicalInput.displayName = 'MedicalInput';
