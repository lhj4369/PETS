import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CustomizationProvider } from "../context/CustomizationContext";

export default function RootLayout() {
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
