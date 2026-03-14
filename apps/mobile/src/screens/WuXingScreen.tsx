import { FlatList, StyleSheet, Text, View } from "react-native";
import { useMemo } from "react";
import { useAppState } from "../contexts/AppStateContext";

type ElementScore = { key: string; value: number };

const ORDER = ["Wood", "Fire", "Earth", "Metal", "Water"];

export function WuXingScreen() {
  const { profile } = useAppState();

  const elements = useMemo<ElementScore[]>(() => {
    const source = profile?.astro_json?.wuxing?.elements || {};
    return ORDER.map((key) => ({ key, value: Number(source[key] ?? 0) }));
  }, [profile]);

  const max = Math.max(1, ...elements.map((entry) => entry.value));
  const dominant = profile?.astro_json?.wuxing?.dominant_element || "Unknown";

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>Wu Xing Balance</Text>
        <Text style={styles.subtitle}>Element distribution from your latest profile computation.</Text>
      </View>

      <FlatList
        data={elements}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const width = `${Math.round((item.value / max) * 100)}%`;
          return (
            <View style={styles.item}>
              <View style={styles.rowTop}>
                <Text style={styles.label}>{item.key}</Text>
                <Text style={styles.value}>{item.value.toFixed(3)}</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: width as `${number}%` }]} />
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.footerLabel}>Dominant Element</Text>
            <Text style={styles.footerValue}>{dominant}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#060b12" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2c3f",
  },
  title: {
    color: "#f4f7fb",
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: "#9cb1cb",
    fontSize: 13,
  },
  list: {
    padding: 16,
    gap: 10,
  },
  item: {
    borderColor: "#233244",
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: "#0f1823",
    padding: 12,
    gap: 8,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: "#dce6f7",
    fontSize: 14,
    fontWeight: "600",
  },
  value: {
    color: "#9db1cd",
    fontSize: 12,
  },
  track: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#203146",
  },
  fill: {
    height: "100%",
    backgroundColor: "#6bc8ff",
  },
  footer: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderColor: "#263b54",
    borderWidth: 1,
    backgroundColor: "#121f30",
    gap: 6,
  },
  footerLabel: {
    color: "#9cb1cb",
    textTransform: "uppercase",
    fontSize: 11,
    letterSpacing: 1.2,
  },
  footerValue: {
    color: "#f4f7fb",
    fontSize: 19,
    fontWeight: "700",
  },
});
