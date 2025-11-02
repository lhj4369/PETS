//타이머 화면
import { View, Text, TouchableOpacity, StyleSheet, Animated, SafeAreaView } from "react-native";
import { useState, useEffect, useRef } from "react";
import Header from "../../components/Header";

export default function TimerScreen() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [displayTime, setDisplayTime] = useState(0); 

  
  const secondRotation = useRef(new Animated.Value(0)).current;
  const minuteRotation = useRef(new Animated.Value(0)).current;
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 연속적인 애니메이션
  const animate = () => {
    if (startTimeRef.current !== null) {
      const now = Date.now();
      const elapsed = elapsedTime + (now - startTimeRef.current);
      
      // 밀리초 단위로 각도 계산
      const secondAngle = (elapsed / 1000) * 6; // 1초에 6도
      const minuteAngle = (elapsed / 60000) * 6; // 1분에 6도
      
      secondRotation.setValue(secondAngle % 360);
      minuteRotation.setValue(minuteAngle % 360);
      
      // 디스플레이 시간도 업데이트
      setDisplayTime(elapsed);
      
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      animationFrameRef.current = requestAnimationFrame(animate);      
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (startTimeRef.current !== null) {
        const newElapsed = elapsedTime + (Date.now() - startTimeRef.current);
        setElapsedTime(newElapsed);
        setDisplayTime(newElapsed);
        startTimeRef.current = null;
      }     
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, elapsedTime]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedTime(0);
    setDisplayTime(0);
    startTimeRef.current = null;
    secondRotation.setValue(0);
    minuteRotation.setValue(0);
  };

  return (
    <SafeAreaView style={styles.container}>
       <Header showBackButton={true} showMenuButton={true} menuType="timer" />
      {/* 아날로그 시계 */}
      <View style={styles.clockContainer}>
        <View style={styles.clockFace}>
          {/* 시간 마커 (12, 3, 6, 9) */}
          <View style={[styles.marker, { top: 10, left: '50%', marginLeft: -1 }]} />
          <View style={[styles.marker, { top: '50%', right: 10, marginTop: -1, width: 20, height: 2 }]} />
          <View style={[styles.marker, { bottom: 10, left: '50%', marginLeft: -1 }]} />
          <View style={[styles.marker, { top: '50%', left: 10, marginTop: -1, width: 20, height: 2 }]} />
          
          {/* 중앙 점 */}
          <View style={styles.centerDot} />
          
          {/* 분침 */}
          <Animated.View 
            style={[
              styles.minuteHand, 
              { 
                transform: [
                  { rotate: minuteRotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg']
                  })}
                ] 
              }
            ]} 
          />
          
          {/* 초침 */}
          <Animated.View 
            style={[
              styles.secondHand, 
              { 
                transform: [
                  { rotate: secondRotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg']
                  })}
                ] 
              }
            ]} 
          />
        </View>
      </View>

      {/* 디지털 시간 표시 */}
      <Text style={styles.digitalTime}>{formatTime(displayTime)}</Text>
      
      {/* 컨트롤 버튼 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, isRunning ? styles.stopButton : styles.startButton]}
          onPress={handleStartStop}
        >
          <Text style={styles.buttonText}>
            {isRunning ? "■" : "▶"}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.resetButton]}
          onPress={handleReset}
        >
          <Text style={styles.buttonText}>↻</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const CLOCK_SIZE = 280;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  clockContainer: {
    marginBottom: 40,
  },
  clockFace: {
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    borderRadius: CLOCK_SIZE / 2,
    backgroundColor: "#fff",
    borderWidth: 8,
    borderColor: "#2c3e50",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  marker: {
    position: "absolute",
    width: 2,
    height: 20,
    backgroundColor: "#2c3e50",
  },
  centerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#e74c3c",
    position: "absolute",
    zIndex: 10,
  },
  minuteHand: {
    position: "absolute",
    width: 5,
    height: 95,
    backgroundColor: "#34495e",
    borderRadius: 2.5,
    bottom: "50%",
    transformOrigin: "bottom",
  },
  secondHand: {
    position: "absolute",
    width: 2,
    height: 110,
    backgroundColor: "#e74c3c",
    borderRadius: 1,
    bottom: "50%",
    transformOrigin: "bottom",
  },
  digitalTime: {
    fontSize: 36,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 30,
    fontVariant: ["tabular-nums"],
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 20,
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  startButton: {
    backgroundColor: "#27ae60",
  },
  stopButton: {
    backgroundColor: "#e74c3c",
  },
  resetButton: {
    backgroundColor: "#3498db",
  },
  buttonText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
});