import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAppState } from "../contexts/AppStateContext";
import { beginCheckout } from "../lib/checkout";
import { authedFetch } from "../lib/api";
import { useSpaceWeather } from "../hooks/useSpaceWeather";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

function extractInterpretation(profile: any): string {
  return String(profile?.astro_json?.interpretation || "");
}

export function DashboardScreen() {
  const navigation = useNavigation<Navigation>();
  const { profile, tier, bootstrap, refreshProfile } = useAppState();
  const { kpIndex, loading: weatherLoading } = useSpaceWeather();
  const [busyCheckout, setBusyCheckout] = useState(false);
  const [busyShare, setBusyShare] = useState(false);

  const summary = useMemo(() => {
    const sun = profile?.sun_sign || "-";
    const moon = profile?.moon_sign || "-";
    const asc = profile?.asc_sign || "-";
    return `${sun} Sun • ${moon} Moon • ${asc} Rising`;
  }, [profile]);

  const interpretation = useMemo(() => extractInterpretation(profile), [profile]);

  const openUpgrade = async () => {
    setBusyCheckout(true);
    try {
      const result = await beginCheckout(bootstrap);
      if (result === "success") {
        await refreshProfile();
        Alert.alert("Upgrade confirmed", "Premium access is now active on your profile.");
      } else if (result === "cancel") {
        Alert.alert("Upgrade canceled", "No payment was captured.");
      }
    } catch (error) {
      Alert.alert("Checkout failed", error instanceof Error ? error.message : "Unknown checkout error");
    } finally {
      setBusyCheckout(false);
    }
  };

  const openShare = async () => {
    setBusyShare(true);
    try {
      const response = await authedFetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "mobile" }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `share failed (${response.status})`);
      }

      const payload = (await response.json()) as { shareUrl?: string };
      const shareUrl = payload?.shareUrl;
      if (!shareUrl) {
        throw new Error("Missing share URL");
      }

      await Share.share({
        message: `My Bazodiac profile: ${shareUrl}`,
        url: shareUrl,
      });
    } catch (error) {
      Alert.alert("Share failed", error instanceof Error ? error.message : "Unknown share error");
    } finally {
      setBusyShare(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.kicker}>Cosmic Profile</Text>
        <Text style={styles.title}>{summary}</Text>
        <Text style={styles.meta}>Tier: {tier === "premium" ? "Premium" : "Free"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.kicker}>Space Weather</Text>
        <Text style={styles.titleSmall}>{weatherLoading ? "Loading..." : `Kp ${kpIndex.toFixed(1)}`}</Text>
        <Text style={styles.body}>Current geomagnetic signal feeds your transit intensity layer.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.kicker}>Interpretation</Text>
        <Text style={styles.body} numberOfLines={8}>
          {interpretation || "Your interpretation is ready once onboarding finishes."}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.actionButton} onPress={() => navigation.navigate("Voice")}>
          <Text style={styles.actionText}>Open Levi Voice</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={() => navigation.navigate("Quiz") }>
          <Text style={styles.actionText}>Quiz Signals</Text>
        </Pressable>
      </View>

      <View style={styles.actionRow}>
        <Pressable style={[styles.actionButton, styles.secondary]} onPress={openShare} disabled={busyShare}>
          <Text style={styles.secondaryText}>{busyShare ? "Sharing..." : "Share Profile"}</Text>
        </Pressable>

        {tier !== "premium" ? (
          <Pressable style={[styles.actionButton, styles.premium]} onPress={openUpgrade} disabled={busyCheckout}>
            <Text style={styles.premiumText}>{busyCheckout ? "Opening..." : "Upgrade"}</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.actionButton, styles.secondary]} onPress={() => void refreshProfile()}>
            <Text style={styles.secondaryText}>Refresh</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: "#0f1823",
    borderColor: "#243447",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  kicker: {
    color: "#d4af37",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontSize: 11,
  },
  title: {
    color: "#f5f8fd",
    fontSize: 20,
    fontWeight: "700",
  },
  titleSmall: {
    color: "#f5f8fd",
    fontSize: 18,
    fontWeight: "700",
  },
  meta: {
    color: "#95a6be",
    fontSize: 13,
  },
  body: {
    color: "#d0dae8",
    lineHeight: 22,
    fontSize: 14,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: "#1c2b3c",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  actionText: {
    color: "#dce5f2",
    fontWeight: "700",
  },
  secondary: {
    backgroundColor: "#152131",
    borderColor: "#2d3e55",
    borderWidth: 1,
  },
  secondaryText: {
    color: "#b8c5d8",
    fontWeight: "700",
  },
  premium: {
    backgroundColor: "#d4af37",
  },
  premiumText: {
    color: "#101926",
    fontWeight: "800",
  },
});
