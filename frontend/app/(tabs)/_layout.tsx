import { Tabs } from "expo-router";
import { createContext, useContext, useState } from "react";

type TabBarContextType = {
  isTabBarVisible: boolean;
  setTabBarVisible: (visible: boolean) => void;
};

const TabBarContext = createContext<TabBarContextType>({
  isTabBarVisible: true,
  setTabBarVisible: () => {},
});

export const useTabBar = () => useContext(TabBarContext);

export default function TabsLayout() {
  const [isTabBarVisible, setTabBarVisible] = useState(true);

  return (
    <TabBarContext.Provider value={{ isTabBarVisible, setTabBarVisible }}>
      <Tabs 
        screenOptions={{ 
          headerShown: false,
          tabBarStyle: { 
            display: isTabBarVisible ? 'flex' : 'none' 
          }
        }}
      >
        <Tabs.Screen name="home" options={{ title: "메인" }} />
        <Tabs.Screen name="timer" options={{ title: "타이머" }} />
        <Tabs.Screen name="records" options={{ title: "기록" }} />
        <Tabs.Screen name="ranking" options={{ title: "랭킹" }} />
        <Tabs.Screen name="challenges" options={{ title: "도전" }} />
        <Tabs.Screen name="settings" options={{ title: "설정" }} />
      </Tabs>
    </TabBarContext.Provider>
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarStyle: { display: 'none' } // 하단 탭 숨기기
      }}
    >
      <Tabs.Screen name="home" options={{ title: "메인" }} />
      <Tabs.Screen name="timer" options={{ title: "타이머" }} />
      <Tabs.Screen name="records" options={{ title: "기록" }} />
      <Tabs.Screen name="ranking" options={{ title: "랭킹" }} />
      <Tabs.Screen name="challenges" options={{ title: "도전" }} />
      <Tabs.Screen name="settings" options={{ title: "설정" }} />
      <Tabs.Screen name="customize" options={{ title: "커스터마이징" }} />
    </Tabs>
  );
}

