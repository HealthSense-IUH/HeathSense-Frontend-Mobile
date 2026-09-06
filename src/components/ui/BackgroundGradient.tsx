import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function BackgroundGradient() {
  return (
    <LinearGradient
      colors={['#F0F6FF', '#F8FAFC', '#F1F5F9']}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
}
