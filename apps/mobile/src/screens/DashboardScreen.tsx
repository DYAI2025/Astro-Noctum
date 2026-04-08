import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import type { DimensionValue } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAppState } from "../contexts/AppStateContext";
import { beginCheckout } from "../lib/checkout";
import { authedFetch } from "../lib/api";
import { useSpaceWeather } from "../hooks/useSpaceWeather";
import { useDailyHoroscope } from "../hooks/useDailyHoroscope";
import { useVibes } from "../hooks/useVibes";
import { useWeeklyInsights } from "../hooks/useWeeklyInsights";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function DashboardScreen() {
  const navigation = useNavigation<Navigation>();
  const { profile, tier, bootstrap, refreshProfile } = useAppState();
  const { kpIndex, loading: weatherLoading } = useSpaceWeather();
  const { daily, loading: dailyLoading } = useDailyHoroscope(profile);
  const [busyCheckout, setBusyCheckout] = useState(false);
  const [busyShare, setBusyShare] = useState(false);
  const [showVibesLevel3, setShowVibesLevel3] = useState(false);
  const [showWeekly, setShowWeekly] = useState(false);
  const vibes = useVibes();
  const weekly = useWeeklyInsights();

  const summary = useMemo(() => {
    const sun = profile?.sun_sign || "-";
    const moon = profile?.moon_sign || "-";
    const asc = profile?.asc_sign || "-";
    return `${sun} Sun • ${moon} Moon • ${asc} Rising`;
  }, [profile]);

  const wuxingElements = useMemo(() => {
    const els = profile?.astro_json?.wuxing?.elements || {};
    return [
      { key: 'Wood', label: 'Holz', chinese: '木', color: '#3D8B37', value: Number(els.Wood || els.Holz || 0) },
      { key: 'Fire', label: 'Feuer', chinese: '火', color: '#D63B0F', value: Number(els.Fire || els.Feuer || 0) },
      { key: 'Earth', label: 'Erde', chinese: '土', color: '#C49A2A', value: Number(els.Earth || els.Erde || 0) },
      { key: 'Metal', label: 'Metall', chinese: '金', color: '#8A8A8A', value: Number(els.Metal || els.Metall || 0) },
      { key: 'Water', label: 'Wasser', chinese: '水', color: '#2E6BB5', value: Number(els.Water || els.Wasser || 0) },
    ];
  }, [profile]);
  const wuxingTotal = useMemo(() => wuxingElements.reduce((s, e) => s + e.value, 0), [wuxingElements]);
  const wuxingMax = useMemo(() => Math.max(...wuxingElements.map(e => e.value), 1), [wuxingElements]);

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
        <Text style={styles.kicker}>Kosmisches Profil</Text>
        <Text style={styles.title}>{summary}</Text>
        <Text style={styles.meta}>Tier: {tier === "premium" ? "Premium" : "Free"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.kicker}>Weltraumwetter</Text>
        <Text style={styles.titleSmall}>{weatherLoading ? "Loading..." : `Kp ${kpIndex.toFixed(1)}`}</Text>
        <Text style={styles.body}>Aktuelle geomagnetische Aktivität beeinflusst deine Transit-Intensität.</Text>
      </View>

      {wuxingTotal > 0 && (
        <View style={styles.card}>
          <Text style={styles.kicker}>WUXING 五行</Text>
          {wuxingElements.map(el => {
            const pct = Math.round((el.value / wuxingTotal) * 100);
            const barWidth: DimensionValue = `${(el.value / wuxingMax) * 100}%`;
            return (
              <View key={el.key} style={styles.wuxingRow}>
                <Text style={[styles.wuxingLabel, { color: el.color }]}>{el.chinese}</Text>
                <Text style={styles.wuxingName}>{el.label}</Text>
                <View style={styles.wuxingTrack}>
                  <View style={[styles.wuxingFill, { backgroundColor: el.color, width: barWidth }]} />
                </View>
                <Text style={styles.wuxingPct}>{pct}%</Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.kicker}>TAGESIMPULS</Text>
        {dailyLoading ? (
          <Text style={styles.body}>Dein Tageshoroskop wird geladen...</Text>
        ) : daily ? (
          <>
            <Text style={styles.titleSmall}>{daily.fusion.summary}</Text>
            <Text style={styles.body}>{daily.fusion.action}</Text>
            {daily.fusion.pushworthy && daily.fusion.push_text && (
              <View style={styles.pushHighlight}>
                <Text style={styles.pushText}>⚡ {daily.fusion.push_text}</Text>
              </View>
            )}
          </>
        ) : (
          <Text style={styles.body}>Tagesimpuls nicht verfügbar.</Text>
        )}
      </View>

      {/* ── Vibes Card ───────────────────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.kicker}>Vibe — Dein Jetzt-Impuls</Text>

        {/* Level 1 + Level 2 always above fold on 375px (REQ-USA-mobile-first-readability) */}
        {vibes.data ? (
          <>
            {/* Source: /api/vibes → level1.text (Kurzsignal) */}
            <Text style={styles.vibesLevel1}>{vibes.data.level1.text}</Text>

            {/* Source: /api/vibes → level2.text (Treiber) */}
            <Text style={[styles.body, { marginTop: 4 }]}>{vibes.data.level2.text}</Text>

            {/* Level 3 behind "Warum?" tap */}
            {vibes.data.level3 && (
              <Pressable onPress={() => setShowVibesLevel3(v => !v)} style={{ marginTop: 8 }}>
                <Text style={styles.vibesWhy}>{showVibesLevel3 ? 'Weniger' : 'Warum sehe ich das? →'}</Text>
              </Pressable>
            )}
            {showVibesLevel3 && vibes.data.level3 && (
              /* Source: /api/vibes → level3.text (Erklärung) */
              <Text style={[styles.body, styles.vibesLevel3]}>{vibes.data.level3.text}</Text>
            )}

            {vibes.cooldown && (
              <Text style={styles.vibesCooldown}>
                Nächster Vibe ab {new Date(vibes.cooldown).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
              </Text>
            )}
          </>
        ) : vibes.error ? (
          <Text style={styles.errorText}>{vibes.error}</Text>
        ) : (
          <Text style={[styles.body, { opacity: 0.5 }]}>Hol dir deinen persönlichen Vibe für die nächsten 2 Stunden.</Text>
        )}

        <Pressable
          style={[styles.vibesButton, vibes.loading && { opacity: 0.5 }]}
          onPress={vibes.fetch}
          disabled={vibes.loading}
        >
          <Text style={styles.vibesButtonText}>
            {vibes.loading ? 'Analysiere...' : vibes.data ? 'Neu laden' : 'Vibe abrufen'}
          </Text>
        </Pressable>
      </View>

      {/* ── Weekly Insights Card ──────────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.kicker}>Deine Woche — {weekly.data?.week_label ?? 'Wochenimpulse'}</Text>

        {weekly.data ? (
          <>
            {/* Top-3 above fold (REQ-USA-mobile-first-readability) */}
            {weekly.data.areas
              .slice(0, showWeekly ? undefined : 3)
              .map((area, i) => (
                <View key={area.area} style={[
                  styles.weeklyArea,
                  area.isTopThree && styles.weeklyAreaTop,
                ]}>
                  {area.isTopThree && (
                    <Text style={styles.weeklyTopBadge}># {i + 1}</Text>
                  )}
                  <Text style={styles.weeklyAreaLabel}>{area.area}</Text>
                  {/* Source: /api/weekly-insights → areas[].tendency */}
                  <Text style={styles.weeklyTendency}>{area.tendency}</Text>
                  {/* Source: /api/weekly-insights → areas[].statement (Gemini) */}
                  <Text style={[styles.body, { marginTop: 2 }]}>{area.statement}</Text>
                </View>
              ))}

            {weekly.data.areas.length > 3 && (
              <Pressable onPress={() => setShowWeekly(v => !v)} style={{ marginTop: 4 }}>
                <Text style={styles.vibesWhy}>
                  {showWeekly ? 'Weniger anzeigen' : `Alle ${weekly.data!.areas.length} Bereiche →`}
                </Text>
              </Pressable>
            )}
          </>
        ) : weekly.error ? (
          <Text style={styles.errorText}>{weekly.error}</Text>
        ) : (
          <Text style={[styles.body, { opacity: 0.5 }]}>7 Lebensbereiche — Trends für diese Woche.</Text>
        )}

        <Pressable
          style={[styles.vibesButton, weekly.loading && { opacity: 0.5 }]}
          onPress={weekly.fetch}
          disabled={weekly.loading}
        >
          <Text style={styles.vibesButtonText}>
            {weekly.loading ? 'Lade Insights...' : weekly.data ? 'Aktualisieren' : 'Woche laden'}
          </Text>
        </Pressable>
      </View>

      <Pressable style={styles.signaturButton} onPress={() => navigation.getParent()?.navigate("Signatur")}>
        <Text style={styles.signaturText}>Zur Signatur</Text>
      </Pressable>

      <View style={styles.actionRow}>
        <Pressable style={[styles.actionButton, styles.secondary]} onPress={openShare} disabled={busyShare}>
          <Text style={styles.secondaryText}>{busyShare ? "Sharing..." : "Teilen"}</Text>
        </Pressable>

        {tier !== "premium" ? (
          <Pressable style={[styles.actionButton, styles.premium]} onPress={openUpgrade} disabled={busyCheckout}>
            <Text style={styles.premiumText}>{busyCheckout ? "Opening..." : "Upgrade"}</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.actionButton, styles.secondary]} onPress={() => void refreshProfile()}>
            <Text style={styles.secondaryText}>Aktualisieren</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#0f1823",
    borderColor: "#1a2636",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
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
    color: "#8fa0bc",
    fontSize: 13,
  },
  body: {
    color: "#d0dae8",
    lineHeight: 22,
    fontSize: 14,
  },
  // ── Vibes styles ────────────────────────────────────────────────────────
  vibesLevel1: {
    color: "#f5f8fd",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 26,
  },
  vibesLevel3: {
    fontStyle: "italic",
    opacity: 0.75,
  },
  vibesWhy: {
    color: "#d4af37",
    fontSize: 13,
    fontWeight: "600",
  },
  vibesCooldown: {
    color: "#8fa0bc",
    fontSize: 12,
    marginTop: 4,
  },
  vibesButton: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d4af3755",
    alignItems: "center",
    justifyContent: "center",
  },
  vibesButtonText: {
    color: "#d4af37",
    fontSize: 15,
    fontWeight: "700",
  },
  // ── Weekly Insights styles ───────────────────────────────────────────
  weeklyArea: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1a2636",
    gap: 2,
  },
  weeklyAreaTop: {
    borderLeftWidth: 3,
    borderLeftColor: "#d4af37",
    paddingLeft: 10,
    marginLeft: -2,
  },
  weeklyTopBadge: {
    color: "#d4af37",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  weeklyAreaLabel: {
    color: "#f5f8fd",
    fontSize: 15,
    fontWeight: "600",
  },
  weeklyTendency: {
    color: "#8fa0bc",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    lineHeight: 20,
  },
  signaturButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  signaturText: {
    color: "#060b12",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
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
  pushHighlight: {
    marginTop: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#d4af37',
    borderRadius: 8,
    padding: 10,
  },
  pushText: {
    color: '#d4af37',
    fontSize: 13,
    fontWeight: '600',
  },
  wuxingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  wuxingLabel: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  wuxingName: {
    color: '#8fa0bc',
    fontSize: 12,
    width: 48,
  },
  wuxingTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#1a2636',
    borderRadius: 3,
    overflow: 'hidden',
  },
  wuxingFill: {
    height: 6,
    borderRadius: 3,
  },
  wuxingPct: {
    color: '#8fa0bc',
    fontSize: 11,
    width: 32,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
