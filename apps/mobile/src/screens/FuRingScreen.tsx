import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { computeFusionSignal } from "@bazodiac/shared";
import { useAppState } from "../contexts/AppStateContext";

type SectorRow = { index: number; value: number };

function vectorFrom(input: unknown): number[] {
  if (Array.isArray(input)) {
    return new Array(12).fill(0).map((_, idx) => Number(input[idx] ?? 0));
  }

  if (input && typeof input === "object") {
    const values = Object.values(input as Record<string, unknown>).map((value) => Number(value || 0));
    if (values.length >= 12) {
      return values.slice(0, 12);
    }
  }

  return new Array(12).fill(0);
}

export function FuRingScreen() {
  const { profile, bootstrap } = useAppState();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fusion = useMemo(() => {
    const astro = profile?.astro_json || {};
    const western = vectorFrom(astro?.fusion?.western ?? astro?.western?.vector);
    const bazi = vectorFrom(astro?.fusion?.bazi ?? astro?.bazi?.vector);
    const wuxing = vectorFrom(astro?.fusion?.wuxing ?? astro?.wuxing?.vector);
    const quiz = vectorFrom(astro?.fusion?.quiz ?? astro?.quiz?.vector);
    return computeFusionSignal(western, bazi, wuxing, quiz, Number(astro?.quiz?.completed || 0), 7);
  }, [profile]);

  const sectors = useMemo<SectorRow[]>(
    () => fusion.sectors.map((value, index) => ({ index, value })),
    [fusion.sectors],
  );

  if (showAdvanced) {
    const advancedUrl = `${bootstrap?.checkout.default_success_url?.replace("?upgrade=success", "") || "https://bazodiac.space"}?mobile=1&module=fu-ring`;
    return (
      <View style={styles.flex}>
        <View style={styles.toolbar}>
          <Text style={styles.toolbarTitle}>Fu Ring Advanced View</Text>
          <Pressable style={styles.toolbarButton} onPress={() => setShowAdvanced(false)}>
            <Text style={styles.toolbarButtonText}>Close</Text>
          </Pressable>
        </View>
        <WebView source={{ uri: advancedUrl }} style={styles.flex} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>Fusion Ring Signal</Text>
        <Text style={styles.subtitle}>Parity-safe native bars + optional embedded advanced visual.</Text>
      </View>

      <FlatList
        data={sectors}
        keyExtractor={(item) => String(item.index)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const normalized = Math.max(0, Math.min(1, (item.value + 1) / 2));
          return (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Sector {item.index + 1}</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.round(normalized * 100)}%` }]} />
              </View>
              <Text style={styles.rowValue}>{item.value.toFixed(2)}</Text>
            </View>
          );
        }}
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.footerText}>Peak sectors: {fusion.peakSectors.map((idx) => idx + 1).join(", ")}</Text>
            <Pressable style={styles.button} onPress={() => setShowAdvanced(true)}>
              <Text style={styles.buttonText}>Open Advanced Visual</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#060b12" },
  header: {
    padding: 16,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#1e2d40",
  },
  title: {
    color: "#f3f7fc",
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: "#9bb0cc",
    fontSize: 13,
  },
  list: {
    padding: 16,
    gap: 10,
  },
  row: {
    backgroundColor: "#0f1823",
    borderColor: "#213042",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  rowLabel: {
    color: "#d9e2ef",
    fontSize: 13,
    fontWeight: "600",
  },
  track: {
    height: 10,
    backgroundColor: "#203146",
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: "#d4af37",
  },
  rowValue: {
    color: "#9db0c9",
    fontSize: 12,
  },
  footer: {
    marginTop: 8,
    gap: 12,
    paddingBottom: 32,
  },
  footerText: {
    color: "#c4d1e4",
    fontSize: 13,
  },
  button: {
    minHeight: 48,
    borderRadius: 24,
    borderColor: "#2d405a",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#122033",
  },
  buttonText: {
    color: "#dce8f8",
    fontWeight: "700",
  },
  toolbar: {
    minHeight: 56,
    backgroundColor: "#0f1823",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomColor: "#243447",
    borderBottomWidth: 1,
  },
  toolbarTitle: {
    color: "#f4f7fb",
    fontSize: 15,
    fontWeight: "700",
  },
  toolbarButton: {
    minWidth: 72,
    minHeight: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#31455f",
    borderWidth: 1,
  },
  toolbarButtonText: {
    color: "#dbe6f8",
    fontWeight: "700",
  },
});
