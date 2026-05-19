import { Platform } from "react-native";
import { PROVIDER_GOOGLE } from "../components/NativeMapView";

/** Android는 Google Maps, iOS는 기본(Apple) 지도 — iOS Google 키 미설정 시에도 동작 */
export function getNativeMapProvider() {
  return Platform.OS === "android" ? PROVIDER_GOOGLE : undefined;
}
