/**
 * react-native-maps 웹용 stub 모듈
 * 웹 빌드 시 react-native-maps 대신 사용됩니다.
 * react-native-maps는 iOS/Android 전용 네이티브 모듈이므로 웹에서 사용할 수 없습니다.
 */
const React = require('react');
const { View } = require('react-native');

// MapView 대체 (빈 View)
const MapView = (props) => React.createElement(View, { ...props, style: [{ flex: 1 }, props.style] });

// Marker, Polyline - 웹에서는 빈 컴포넌트 (JSX 사용 시 에러 방지)
const Marker = (props) => null;
const Polyline = (props) => null;
const PROVIDER_GOOGLE = undefined;

module.exports = {
  default: MapView,
  MapView,
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  // react-native-maps가 export하는 다른 컴포넌트들 (호환성)
  Animated: MapView,
  Overlay: View,
  Heatmap: View,
  Polygon: View,
  Circle: View,
  Callout: View,
  UrlTile: View,
  WMSTile: View,
  LocalTile: View,
  Geojson: View,
  AnimatedRegion: () => null,
  MapCalloutSubview: View,
  CalloutSubview: View,
  MapCallout: View,
  MapLocalTile: View,
  MapWMSTile: View,
  MapUrlTile: View,
  MapCircle: View,
  MapPolygon: View,
  MapHeatmap: View,
  MapPolyline: Polyline,
  MapOverlay: View,
  MapMarker: Marker,
  MAP_TYPES: {},
};
