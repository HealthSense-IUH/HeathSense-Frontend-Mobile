import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export interface WheelPickerItem {
  label: string;
  value: number;
}

interface WheelPickerProps {
  data: WheelPickerItem[];
  selectedValue: number;
  onValueChange: (value: number) => void;
  itemHeight?: number;
  unit?: string;
  width?: number | string;
  fontSize?: number;
}

export const WheelPicker: React.FC<WheelPickerProps> = ({
  data,
  selectedValue,
  onValueChange,
  itemHeight = 46,
  unit,
  width = 120,
  fontSize = 32,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const isUserScrolling = useRef(false);

  const selectedIndex = Math.max(
    0,
    data.findIndex((item) => item.value === selectedValue)
  );

  // Auto-scroll to selected index on mount or when externally changed
  useEffect(() => {
    if (!isUserScrolling.current && flatListRef.current && selectedIndex >= 0) {
      flatListRef.current.scrollToOffset({
        offset: selectedIndex * itemHeight,
        animated: false,
      });
    }
  }, [selectedIndex, itemHeight]);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / itemHeight);
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));

    if (data[clampedIndex] && data[clampedIndex].value !== selectedValue) {
      onValueChange(data[clampedIndex].value);
    }
    isUserScrolling.current = false;
  };

  const handleItemPress = (index: number) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({
        offset: index * itemHeight,
        animated: true,
      });
      if (data[index]) {
        onValueChange(data[index].value);
      }
    }
  };

  const containerHeight = itemHeight * 3;

  return (
    <View
      style={{
        height: containerHeight,
        width: typeof width === 'number' ? width : undefined,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      className={typeof width === 'string' ? width : ''}
    >
      <FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={(item) => String(item.value)}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
        onScrollBeginDrag={() => {
          isUserScrolling.current = true;
        }}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        contentContainerStyle={{
          paddingTop: itemHeight,
          paddingBottom: itemHeight,
        }}
        renderItem={({ item, index }) => {
          const isSelected = index === selectedIndex;
          const isNeighbor =
            index === selectedIndex - 1 || index === selectedIndex + 1;

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleItemPress(index)}
              style={{
                height: itemHeight,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <View className="flex-row items-baseline justify-center">
                <Text
                  style={{
                    fontSize: isSelected ? fontSize : fontSize * 0.85,
                    fontWeight: isSelected ? '800' : '500',
                    color: isSelected
                      ? '#020617' // Slate 950
                      : isNeighbor
                      ? '#CBD5E1' // Slate 300
                      : '#E2E8F0', // Slate 200
                  }}
                >
                  {item.label}
                </Text>

                {isSelected && unit && (
                  <Text className="text-base font-bold text-slate-900 ml-2">
                    {unit}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};
