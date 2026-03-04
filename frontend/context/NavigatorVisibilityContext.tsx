import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NAVIGATOR_VISIBILITY_KEY = "@pets_navigator_visible";

type NavigatorVisibilityContextType = {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => Promise<void>;
  isLoading: boolean;
};

const NavigatorVisibilityContext = createContext<NavigatorVisibilityContextType | null>(null);

export function NavigatorVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisibleState] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(NAVIGATOR_VISIBILITY_KEY);
        setIsVisibleState(stored !== "false");
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const setIsVisible = useCallback(async (visible: boolean) => {
    setIsVisibleState(visible);
    try {
      await AsyncStorage.setItem(NAVIGATOR_VISIBILITY_KEY, String(visible));
    } catch {
      // ignore
    }
  }, []);

  return (
    <NavigatorVisibilityContext.Provider value={{ isVisible, setIsVisible, isLoading }}>
      {children}
    </NavigatorVisibilityContext.Provider>
  );
}

export function useNavigatorVisibility() {
  const ctx = useContext(NavigatorVisibilityContext);
  if (!ctx) throw new Error("useNavigatorVisibility must be used within NavigatorVisibilityProvider");
  return ctx;
}
