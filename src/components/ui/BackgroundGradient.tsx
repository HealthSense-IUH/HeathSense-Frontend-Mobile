import React from 'react';
import { View, StyleSheet } from 'react-native';

export function BackgroundGradient() {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#F4F7FB', overflow: 'hidden' }]}>
      {/* 3 Đốm sáng môi trường chuẩn Stitch Dashboard */}
      <View
        className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-blue-200/40 pointer-events-none"
        style={{ opacity: 0.55 }}
      />
      <View
        className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-rose-100/35 pointer-events-none"
        style={{ opacity: 0.45 }}
      />
      <View
        className="absolute bottom-24 left-1/4 w-72 h-72 rounded-full bg-emerald-100/30 pointer-events-none"
        style={{ opacity: 0.4 }}
      />
    </View>
  );
}

