import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export function LoadingScreen({ label = "Loading Bazodiac..." }: { label?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#d4af37" />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#060b12",
    gap: 12,
    padding: 24,
  },
  label: {
    color: "#d9dce2",
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
