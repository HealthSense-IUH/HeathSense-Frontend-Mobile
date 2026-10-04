import React from 'react';
import { View } from 'react-native';
import { getSportThemeConfig } from './sportThemeConfig';

export const SportSummaryHeaderGraphic: React.FC<{
  exerciseId?: string;
  exerciseName?: string;
}> = ({ exerciseId = '', exerciseName = '' }) => {
  const config = getSportThemeConfig(exerciseId, exerciseName);
  return <View>{config.renderGraphic()}</View>;
};
