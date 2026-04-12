import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWindowDimensions } from "react-native";

type TabItem = {
  label: string;
  path: string;
  activeMatchPath: string;
};

export default function DevQuickTabNav() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const pathname = usePathname();

  const items = useMemo<TabItem[]>(
    () => [
      { label: "로그인", path: "/", activeMatchPath: "/" },
      { label: "홈", path: "/(tabs)/home?devNav=1", activeMatchPath: "/home" },
      { label: "타이머", path: "/(tabs)/timer", activeMatchPath: "/timer" },
      { label: "기록", path: "/(tabs)/records", activeMatchPath: "/records" },
      { label: "랭킹", path: "/(tabs)/ranking", activeMatchPath: "/ranking" },
      { label: "도전", path: "/(tabs)/challenges", activeMatchPath: "/challenges" },
      { label: "채팅", path: "/(tabs)/chatting", activeMatchPath: "/chatting" },
      { label: "커스텀", path: "/(tabs)/customize", activeMatchPath: "/customize" },
    ],
    []
  );

  // 우측 중앙 (Safe Area 고려)
  const top =
    insets.top +
    (height - insets.top - insets.bottom) / 2 -
    styles.fab.height / 2;

  const close = () => setOpen(false);

  const go = (path: string) => {
    setOpen(false);
    router.push(path as any);
  };

  const normalizedPathname = useMemo(() => {
    if (!pathname) return "/";
    return pathname.replace(/^\/\(tabs\)/, "");
  }, [pathname]);

  return (
    <>
      <TouchableOpacity
        style={[styles.fab, { top }]}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="개발용 탭 네비게이션 열기"
      >
        <Text style={styles.fabText}>⇄</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={styles.panel} onPress={() => undefined}>
            <Text style={styles.title}>DEV 탭 이동</Text>
            {items.map((it) => {
              const active = normalizedPathname === it.activeMatchPath;
              return (
                <TouchableOpacity
                  key={it.path}
                  style={[styles.item, active ? styles.itemActive : undefined]}
                  onPress={() => go(it.path)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.itemText,
                      active ? styles.itemTextActive : undefined,
                    ]}
                  >
                    {it.label}
                  </Text>
                  <Text
                    style={[
                      styles.itemPath,
                      active ? styles.itemTextActive : undefined,
                    ]}
                  >
                    {it.activeMatchPath}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.82)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  fabText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 12,
  },
  panel: {
    width: 240,
    borderRadius: 16,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#eef2f7",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 8,
    backgroundColor: "#ffffff",
  },
  itemActive: {
    borderColor: "#1f6feb",
    backgroundColor: "#eff6ff",
  },
  itemText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  itemTextActive: {
    color: "#1f6feb",
  },
  itemPath: {
    marginTop: 2,
    fontSize: 11,
    color: "#64748b",
  },
});

