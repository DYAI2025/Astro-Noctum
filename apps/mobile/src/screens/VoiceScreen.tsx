import { Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { useMemo, useState } from "react";
import { useAppState } from "../contexts/AppStateContext";

export function VoiceScreen() {
  const { bootstrap, userId, tier } = useAppState();
  const [enabled, setEnabled] = useState(true);

  const voiceEnabled = bootstrap?.feature_flags.levi_voice_enabled ?? true;
  const requiresPremium = bootstrap?.voice.requires_premium ?? true;

  const url = useMemo(() => {
    const root = (bootstrap?.checkout.default_success_url || "https://bazodiac.space").replace("?upgrade=success", "");
    const query = new URLSearchParams({
      mobile: "1",
      module: "levi",
      user_id: userId,
      tier,
    });
    return `${root}?${query.toString()}`;
  }, [bootstrap, tier, userId]);

  if (!voiceEnabled) {
    return (
      <View style={styles.state}>
        <Text style={styles.title}>Levi is currently disabled</Text>
        <Text style={styles.body}>Remote flag has this module paused for rollout safety.</Text>
      </View>
    );
  }

  if (requiresPremium && tier !== "premium") {
    return (
      <View style={styles.state}>
        <Text style={styles.title}>Premium required</Text>
        <Text style={styles.body}>Upgrade in Dashboard to unlock Levi voice sessions.</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Levi Voice Surface</Text>
        <Pressable style={styles.toggle} onPress={() => setEnabled((prev) => !prev)}>
          <Text style={styles.toggleText}>{enabled ? "Pause" : "Resume"}</Text>
        </Pressable>
      </View>
      {enabled ? (
        <WebView source={{ uri: url }} style={styles.flex} />
      ) : (
        <View style={styles.state}>
          <Text style={styles.title}>Session paused</Text>
          <Text style={styles.body}>Tap Resume to continue the active voice experience.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#060b12" },
  header: {
    minHeight: 56,
    backgroundColor: "#0f1823",
    borderBottomWidth: 1,
    borderBottomColor: "#243447",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: "#f4f7fb",
    fontWeight: "700",
    fontSize: 15,
  },
  toggle: {
    minHeight: 40,
    minWidth: 72,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#32465f",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleText: {
    color: "#dce8f9",
    fontWeight: "700",
  },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#060b12",
    gap: 8,
  },
  title: {
    color: "#f5f8fc",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  body: {
    color: "#9eb1ca",
    textAlign: "center",
    lineHeight: 22,
  },
});
