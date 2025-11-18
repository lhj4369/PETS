import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import { CustomizationProvider } from "../context/CustomizationContext";
import API_BASE_URL from "../config/api";

export default function RootLayout() {
  // KotraHope 폰트 로드
  useFonts({
    'KotraHope': require('../assets/fonts/KotraHope.ttf'),
  });

  // 전역 fetch 래핑: ngrok 경고 페이지 회피 헤더/쿼리 추가
  useEffect(() => {
    const originalFetch = global.fetch;
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const urlString = typeof input === "string" ? input : input.toString();
        let url = urlString;

        // API_BASE_URL로 나가는 요청에만 적용
        if (url.startsWith(API_BASE_URL)) {
          const hasQuery = url.includes("?");
          const skipParam = "ngrok-skip-browser-warning=true";
          if (!url.includes("ngrok-skip-browser-warning=")) {
            url = `${url}${hasQuery ? "&" : "?"}${skipParam}`;
          }

          // 헤더 병합
          const mergedHeaders: Record<string, string> = {
            ...(init?.headers as Record<string, string>),
            "ngrok-skip-browser-warning": "true",
          };

          return originalFetch(url, { ...init, headers: mergedHeaders });
        }

        return originalFetch(input as any, init);
      } catch {
        return originalFetch(input as any, init);
      }
    };

    return () => {
      global.fetch = originalFetch;
    };
  }, []);

  return (
    <SafeAreaProvider>
      <CustomizationProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </CustomizationProvider>
    </SafeAreaProvider>
  );
}
