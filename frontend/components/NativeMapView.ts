// TypeScript 타입 폴백 파일.
// 런타임에는 Metro 번들러가 NativeMapView.native.tsx / NativeMapView.web.tsx 를 우선 사용한다.
import React from "react";
import { View } from "react-native";

export const MapView: React.ComponentType<any> = View;
export const Marker: React.ComponentType<any> = () => null;
export const Polyline: React.ComponentType<any> = () => null;
export const PROVIDER_GOOGLE: any = undefined;
