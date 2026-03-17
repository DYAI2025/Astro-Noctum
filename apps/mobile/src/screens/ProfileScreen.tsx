import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useAppState } from "../contexts/AppStateContext";
import { COLORS } from "../theme";

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { profile, tier, refreshProfile } = useAppState();

  const handleSignOut = () => {
    Alert.alert("Abmelden", "Möchtest du dich wirklich abmelden?", [
      { text: "Abbrechen", style: "cancel" },
      { text: "Abmelden", style: "destructive", onPress: () => void signOut() },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.kicker}>ACCOUNT</Text>
        <Text style={styles.value}>{user?.email ?? "—"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.kicker}>MITGLIEDSCHAFT</Text>
        <View style={styles.tierRow}>
          <Text style={[styles.tierBadge, tier === "premium" && styles.tierPremium]}>
            {tier === "premium" ? "✦ Premium" : "Free"}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.kicker}>KOSMISCHES PROFIL</Text>
        <Text style={styles.value}>
          {profile?.sun_sign || "—"} ☉ · {profile?.moon_sign || "—"} ☽ · {profile?.asc_sign || "—"} ↑
        </Text>
        <Text style={styles.meta}>
          Berechnet: {profile?.astro_computed_at
            ? new Date(profile.astro_computed_at).toLocaleDateString("de-DE")
            : "—"}
        </Text>
      </View>

      <Pressable style={styles.actionButton} onPress={() => void refreshProfile()}>
        <Text style={styles.actionText}>Profil aktualisieren</Text>
      </Pressable>

      <Pressable style={[styles.actionButton, styles.destructive]} onPress={handleSignOut}>
        <Text style={styles.destructiveText}>Abmelden</Text>
      </Pressable>

      <Text style={styles.version}>Bazodiac v0.1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  kicker: { color: COLORS.gold, fontSize: 10, fontWeight: "700", letterSpacing: 2 },
  value: { color: COLORS.text, fontSize: 16, fontWeight: "600" },
  meta: { color: COLORS.textDim, fontSize: 12 },
  tierRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tierBadge: { color: COLORS.textDim, fontSize: 16, fontWeight: "700" },
  tierPremium: { color: COLORS.gold },
  actionButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  actionText: { color: COLORS.text, fontWeight: "600", fontSize: 15 },
  destructive: {
    borderColor: "rgba(220, 50, 50, 0.3)",
    backgroundColor: "rgba(220, 50, 50, 0.08)",
  },
  destructiveText: { color: "#dc3232", fontWeight: "600", fontSize: 15 },
  version: { color: COLORS.textDim, fontSize: 11, textAlign: "center", marginTop: 12, opacity: 0.5 },
});
