import React from "react";
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  DEFAULT_ANIMAL_IMAGE,
  useCustomization,
} from "../../context/CustomizationContext";

export interface DailyChatViewProps {
  currentScript: string;
  isScriptVisible: boolean;
  hasTapped: boolean;
  onAnimalPress: () => void;
  onSwitchToExercise: () => void;
}

export default function DailyChatView({
  currentScript,
  isScriptVisible,
  hasTapped,
  onAnimalPress,
  onSwitchToExercise,
}: DailyChatViewProps) {
  const { selectedAnimal } = useCustomization();
  const animalImage = selectedAnimal ?? DEFAULT_ANIMAL_IMAGE;

  return (
    <ImageBackground
      source={require("../../assets/images/chat_background_imsi.png")}
      style={styles.dailyBackground}
      imageStyle={styles.dailyBackgroundImage}
    >
      <View style={styles.dailyOverlay}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.animalWrapper}
          onPress={onAnimalPress}
        >
          <View style={styles.speechRegion}>
            {isScriptVisible && currentScript !== "" ? (
              <View style={styles.speechBubble}>
                <Text style={styles.speechText}>{currentScript}</Text>
                <View style={styles.speechTail} />
              </View>
            ) : (
              <View style={styles.speechPlaceholder} />
            )}
          </View>
          <Image
            source={animalImage}
            style={styles.animalImage}
            resizeMode="contain"
          />
          <Text
            style={[
              styles.tapHint,
              hasTapped && styles.tapHintHidden,
            ]}
          >
            동물을 터치해 대화를 시작해보세요
          </Text>
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
    paddingTop: 60,
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
  speechBubble: {
    backgroundColor: "rgba(255,255,255,0.9)",
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
    width: 220,
    height: 220,
  },
  tapHint: {
    marginTop: 16,
    fontSize: 15,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tapHintHidden: {
    opacity: 0,
  },
  switchButton: {
    marginTop: 80,
    paddingVertical: 16,
    paddingHorizontal: 28,
    backgroundColor: "#7fd1ae",
    borderRadius: 30,
    shadowColor: "#7fd1ae",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  switchButtonText: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "bold",
  },
});

