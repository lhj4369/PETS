import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import HomeButton from "../../components/HomeButton";
import ItemModal from "../../components/ItemModal";

export default function ItemScreen() {
  const handleClose = useCallback(() => {
    router.back();
  }, []);

  return (
    <View style={styles.container}>
      <HomeButton />
      <ItemModal visible={true} onClose={handleClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
