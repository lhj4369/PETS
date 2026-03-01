import { Tabs } from "expo-router";
import { View } from "react-native";
import Navigator from "../../components/Navigator";
import { ENABLE_NAVIGATOR } from "../../config/navigator";
import { SettingsModalProvider } from "../../context/SettingsModalContext";
import SettingsModal from "../../components/SettingsModal";

export default function TabsLayout() {
  return (
    <SettingsModalProvider>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: "none" },
          }}
        >
          <Tabs.Screen name="home" options={{ title: "메인" }} />
          <Tabs.Screen name="timer" options={{ title: "타이머" }} />
          <Tabs.Screen name="records" options={{ title: "기록" }} />
          <Tabs.Screen name="ranking" options={{ title: "랭킹" }} />
          <Tabs.Screen name="challenges" options={{ title: "도전" }} />
          <Tabs.Screen name="chatting" options={{ title: "채팅" }} />
          <Tabs.Screen name="quest" options={{ title: "퀘스트" }} />
          <Tabs.Screen name="customize" options={{ title: "커스터마이징" }} />
        </Tabs>
        {ENABLE_NAVIGATOR && <Navigator />}
        <SettingsModal />
      </View>
    </SettingsModalProvider>
  );
}

