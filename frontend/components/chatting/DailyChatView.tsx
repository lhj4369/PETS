import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import {
  DEFAULT_ANIMAL_IMAGE,
  useCustomization,
} from "../../context/CustomizationContext";

export interface DailyChatViewProps {
  currentScript: string;
  isScriptVisible: boolean;
  /** 대사 없을 때 상시 표시 문구 (동물별 확장 시 사용) */
  placeholderPhrase?: string;
  onAnimalPress: () => void;
  onSwitchToExercise: () => void;
}

export default function DailyChatView({
  currentScript,
  isScriptVisible,
  placeholderPhrase = "…",
  onAnimalPress,
  onSwitchToExercise,
}: DailyChatViewProps) {
  const { width, height } = useWindowDimensions();
  const { selectedAnimal } = useCustomization();
  const animalImage = selectedAnimal ?? DEFAULT_ANIMAL_IMAGE;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bubbleScale = useRef(new Animated.Value(0.95)).current;

  // 말풍선 등장: opacity + scale 애니메이션
  useEffect(() => {
    if (isScriptVisible && currentScript !== "") {
      bubbleOpacity.setValue(0);
      bubbleScale.setValue(0.95);
      Animated.parallel([
        Animated.timing(bubbleOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(bubbleScale, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isScriptVisible, currentScript]);

  // 동물 비중: 화면 너비의 약 58%로 키워 소통감 강조
  const animalSize = Math.round(width * 0.58);
  const topPadding = height * 0.14;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.96,
      duration: 80,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleAnimalPress = () => {
    onAnimalPress();
  };

  return (
    <ImageBackground
      source={require("../../assets/images/chat_background_imsi.png")}
      style={styles.dailyBackground}
      imageStyle={styles.dailyBackgroundImage}
    >
      <View style={[styles.dailyOverlay, { paddingTop: topPadding }]}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.animalWrapper}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handleAnimalPress}
        >
          <View style={styles.speechRegion}>
            {isScriptVisible && currentScript !== "" ? (
              <Animated.View
                style={[
                  styles.speechBubble,
                  {
                    opacity: bubbleOpacity,
                    transform: [{ scale: bubbleScale }],
                  },
                ]}
              >
                <Text style={styles.speechText}>{currentScript}</Text>
                <View style={styles.speechTail} />
              </Animated.View>
            ) : (
              <View style={styles.speechPlaceholderBubble}>
                <Text style={styles.speechPlaceholderText}>{placeholderPhrase}</Text>
                <View style={[styles.speechTail, styles.speechPlaceholderTail]} />
              </View>
            )}
          </View>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Image
              source={animalImage}
              style={[styles.animalImage, { width: animalSize, height: animalSize }]}
              resizeMode="contain"
            />
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchButton} onPress={onSwitchToExercise}>
          <Text style={styles.switchButtonText}>운동 조언 받으러 가기</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  dailyBackground: {
    flex: 1,
  },
  dailyBackgroundImage: {
    width: "100%",
    height: "100%",
  },
  dailyOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  animalWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  speechRegion: {
    minHeight: 120,
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
  },
  speechPlaceholder: {
    height: 80,
  },
  speechPlaceholderBubble: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
    marginBottom: 12,
    minHeight: 52,
    position: "relative",
  },
  speechPlaceholderText: {
    fontSize: 15,
    color: "#888",
    textAlign: "center",
  },
  speechPlaceholderTail: {
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  speechBubble: {
    backgroundColor: "rgba(255,255,255,0.98)",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    marginBottom: 12,
    maxWidth: 300,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    position: "relative",
  },
  speechText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
    textAlign: "center",
  },
  speechTail: {
    position: "absolute",
    bottom: -12,
    left: "50%",
    marginLeft: -12,
    width: 24,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.9)",
    transform: [{ rotate: "45deg" }],
  },
  animalImage: {
    // width/height는 useWindowDimensions 기반으로 동적 적용
  },
  switchButton: {
    marginTop: 32,
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: "rgba(127, 209, 174, 0.5)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.12)",
  },
  switchButtonText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
  },
});

