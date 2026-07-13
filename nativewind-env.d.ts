/// <reference types="nativewind/types" />

import 'react-native-svg';
declare module 'react-native-svg' {
  export interface SvgProps {
    className?: string;
  }
  export interface CommonPathProps {
    className?: string;
  }
}
