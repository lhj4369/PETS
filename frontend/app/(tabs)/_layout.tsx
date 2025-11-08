import { Tabs } from "expo-router";
import { View } from "react-native";
import Navigator from "../../components/Navigator";
import { ENABLE_NAVIGATOR } from "../../config/navigator";

export default function TabsLayout() { 
  return (
    <View style={{ flex: 1 }}>
      <Tabs 
        screenOptions={{ 
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen name="home" options={{ title: "메인" }} />
        <Tabs.Screen name="timer" options={{ title: "타이머" }} />
        <Tabs.Screen name="records" options={{ title: "기록" }} />
        <Tabs.Screen name="ranking" options={{ title: "랭킹" }} />
        <Tabs.Screen name="challenges" options={{ title: "도전" }} />
        <Tabs.Screen name="settings" options={{ title: "설정" }} />
        <Tabs.Screen name="chatting" options={{ title: "채팅" }} />
        <Tabs.Screen name="achievement" options={{ title: "업적" }} />
        <Tabs.Screen name="customize" options={{ title: "커스터마이징" }} />
      </Tabs>
      {/* Navigator는 모든 tabs 화면에 전역으로 표시됩니다 */}
      {ENABLE_NAVIGATOR && <Navigator />}
    </View>
  );
}

