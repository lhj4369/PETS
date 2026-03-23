import React from "react";
import { View } from "react-native";

// 웹에서는 실제 지도를 사용하지 않고, 단순한 래퍼/더미 컴포넌트를 제공한다.
// 이렇게 하면 웹 번들에 react-native-maps가 포함되지 않는다.

export const MapView: React.ComponentType<any> = (props) => {
  return <View {...props} />;
};

export const Marker: React.ComponentType<any> = () => null;

export const Polyline: React.ComponentType<any> = () => null;

export const PROVIDER_GOOGLE: any = undefined;

