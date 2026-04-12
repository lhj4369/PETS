import { Tabs } from "expo-router";
import { View } from "react-native";

function TabsContent() {
  return (
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
        <Tabs.Screen name="defense" options={{ title: "디펜스" }} />
        <Tabs.Screen name="customize" options={{ title: "커스터마이징" }} />
      </Tabs>
    </View>
  );
}

export default function TabsLayout() {
  return <TabsContent />;
}

