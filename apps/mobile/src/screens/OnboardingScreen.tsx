/**
 * OnboardingScreen — Mobile onboarding with CosmicEncounterMobile-style backdrop.
 *
 * Phase state machine mirrors the web's mobile fallback flow:
 *   birth-input  → user fills birth data
 *   calculating  → BAFE calculation + persistence in progress
 *   ring-reveal  → SignaturCanvas shows the user's soulprint; tap to enter
 *
 * The animated orb backdrop (gold "Die Form" + cyan "Levi") is the native equivalent
 * of the web's CosmicEncounterMobile CSS fallback (two radial-gradient orbs).
 * Implements REQ-F-cosmic-encounter-onboarding acceptance criteria for mobile.
 */
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { calculateAll, generateInterpretation } from "../lib/reading";
import { persistReading } from "../lib/profile";
import { SignaturCanvas } from "../components/SignaturCanvas";

// ── Types ─────────────────────────────────────────────────────────────────────

type OnboardingPhase = 'birth-input' | 'calculating' | 'ring-reveal';

type Props = {
  onCompleted: () => Promise<void>;
};

// ── Soulprint derivation (mirrors FuRingScreen.generateFallbackSectors) ───────

/**
 * Derive 12 soulprint sectors from Wu-Xing element scores.
 * Maps 5 elements → 12 zodiac sectors using traditional element-sign affinity.
 */
function wuxingToSoulprint(elements: {
  Wood?: number; Fire?: number; Earth?: number; Metal?: number; Water?: number;
}): number[] {
  const e = [
    Number(elements.Wood  || 0),   // 0 Wood
    Number(elements.Fire  || 0),   // 1 Fire
    Number(elements.Earth || 0),   // 2 Earth
    Number(elements.Metal || 0),   // 3 Metal
    Number(elements.Water || 0),   // 4 Water
  ];
  const total = e.reduce((s, v) => s + v, 0) || 1;
  // Sector → element affinity (same as generateFallbackSectors in FuRingScreen)
  const sectorMap = [1, 2, 2, 4, 1, 2, 3, 4, 1, 2, 3, 4];
  return sectorMap.map((elIdx, i) => {
    const base = e[elIdx] / total;
    const jitter = 0.05 * Math.sin(i * 2.7);
    return Math.max(0.05, base + jitter);
  });
}

// ── Animated orb backdrop (CosmicEncounterMobile equivalent) ─────────────────

function OrbBackdrop({ visible }: { visible: boolean }) {
  const goldOpacity  = useRef(new Animated.Value(0)).current;
  const cyanOpacity  = useRef(new Animated.Value(0)).current;
  const goldScale    = useRef(new Animated.Value(0.8)).current;
  const cyanScale    = useRef(new Animated.Value(0.8)).current;
  const goldPulse    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let pulseAnimation: Animated.CompositeAnimation | null = null;

    if (visible) {
      Animated.parallel([
        Animated.spring(goldOpacity, { toValue: 1, useNativeDriver: true, friction: 5 }),
        Animated.spring(cyanOpacity, { toValue: 1, useNativeDriver: true, friction: 5, delay: 300 }),
        Animated.spring(goldScale,   { toValue: 1, useNativeDriver: true, friction: 6 }),
        Animated.spring(cyanScale,   { toValue: 1, useNativeDriver: true, friction: 6, delay: 300 }),
      ]).start(() => {
        pulseAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(goldPulse, { toValue: 1.08, duration: 2800, useNativeDriver: true }),
            Animated.timing(goldPulse, { toValue: 0.94, duration: 2800, useNativeDriver: true }),
          ])
        );
        pulseAnimation.start();
      });
    } else {
      Animated.parallel([
        Animated.timing(goldOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(cyanOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }

    return () => {
      pulseAnimation?.stop();
    };
  }, [visible, goldOpacity, cyanOpacity, goldScale, cyanScale, goldPulse]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Gold orb — "Die Form" (left side) */}
      <Animated.View style={[
        styles.orbGold,
        { opacity: goldOpacity, transform: [{ scale: Animated.multiply(goldScale, goldPulse) }] },
      ]} />
      {/* Cyan orb — "Levi" (right side) */}
      <Animated.View style={[
        styles.orbCyan,
        { opacity: cyanOpacity, transform: [{ scale: cyanScale }] },
      ]} />
    </View>
  );
}

// ── Birth input form ──────────────────────────────────────────────────────────

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isValidTime(s: string): boolean {
  return /^\d{2}:\d{2}$/.test(s);
}

function formatDateForApi(date: string, time: string): string {
  return `${date}T${time}:00`;
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function OnboardingScreen({ onCompleted }: Props) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<OnboardingPhase>('birth-input');
  const [soulprintSectors, setSoulprintSectors] = useState<number[] | null>(null);

  // Form fields
  const [date, setDate]           = useState("1990-01-01");
  const [time, setTime]           = useState("12:00");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [placeQuery, setPlaceQuery]   = useState("");
  const [placeName, setPlaceName]     = useState("");
  const [lat, setLat]               = useState("52.520000");
  const [lon, setLon]               = useState("13.405000");
  const [tz, setTz]                 = useState("Europe/Berlin");
  const [error, setError]           = useState<string | null>(null);
  const [resolving, setResolving]   = useState(false);

  const lookupPlace = async () => {
    if (!placeQuery.trim()) {
      Alert.alert("Ort eingeben", "Bitte gib zuerst einen Ort ein.");
      return;
    }
    setResolving(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeQuery)}&format=json&limit=1&addressdetails=1`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Bazodiac-Mobile/1.0' },
      });
      const results = await response.json();
      const best = results?.[0];
      if (!best) {
        Alert.alert("Ort nicht gefunden", "Versuche einen anderen Suchbegriff.");
        return;
      }
      const nextLat = Number(best.lat);
      const nextLon = Number(best.lon);
      setLat(nextLat.toFixed(6));
      setLon(nextLon.toFixed(6));
      setPlaceName(best.display_name || placeQuery);
      try {
        const tzResponse = await fetch(
          `https://timeapi.io/api/timezone/coordinate?latitude=${nextLat}&longitude=${nextLon}`,
        );
        const tzData = await tzResponse.json();
        if (tzData?.timeZone) setTz(tzData.timeZone);
      } catch {
        // Keep default timezone — user can edit manually
      }
    } catch (err) {
      Alert.alert("Suche fehlgeschlagen", err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setResolving(false);
    }
  };

  const submit = async () => {
    setError(null);

    if (!user) {
      const message = "Bitte melde dich erneut an.";
      setError(message);
      Alert.alert("Anmeldung erforderlich", message);
      return;
    }

    const parsedLat = Number(lat);
    const parsedLon = Number(lon);

    if (!Number.isFinite(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      const message = "Breitengrad muss zwischen -90 und 90 liegen.";
      setError(message);
      Alert.alert("Ungültiger Breitengrad", message);
      return;
    }
    if (!Number.isFinite(parsedLon) || parsedLon < -180 || parsedLon > 180) {
      const message = "Längengrad muss zwischen -180 und 180 liegen.";
      setError(message);
      Alert.alert("Ungültiger Längengrad", message);
      return;
    }

    if (!isValidDate(date)) {
      const message = "Bitte gib das Datum im Format JJJJ-MM-TT ein.";
      setError(message);
      Alert.alert("Ungültiges Datum", message);
      return;
    }
    if (!timeUnknown && !isValidTime(time)) {
      const message = "Bitte gib die Uhrzeit im Format HH:MM ein.";
      setError(message);
      Alert.alert("Ungültige Uhrzeit", message);
      return;
    }

    const normalizedTime = timeUnknown ? "12:00" : time;
    const birthDate = formatDateForApi(date, normalizedTime);

    setPhase('calculating');
    try {
      const reading = await calculateAll({ date: birthDate, tz, lat: parsedLat, lon: parsedLon });

      let interpretation: string;
      try {
        interpretation = await generateInterpretation(reading, "de");
      } catch {
        interpretation = "Dein kosmisches Profil wurde berechnet. Die KI-Deutung wird beim nächsten Öffnen nachgeladen.";
      }

      await persistReading(
        user.id,
        { date: birthDate, tz, lat: parsedLat, lon: parsedLon, place: placeName || placeQuery },
        reading,
        interpretation,
      );

      // Derive soulprint sectors from Wu-Xing calculation and transition to ring-reveal
      const sectors = wuxingToSoulprint(reading.wuxing?.elements ?? {});
      setSoulprintSectors(sectors);
      setPhase('ring-reveal');
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler";
      setError(message);
      Alert.alert("Berechnung fehlgeschlagen", message);
      setPhase('birth-input');
    }
  };

  const proceed = () => {
    void onCompleted();
  };

  // ── Ring-reveal phase ─────────────────────────────────────────────────────
  if (phase === 'ring-reveal') {
    return (
      <View style={styles.revealContainer}>
        <View style={StyleSheet.absoluteFill}>
          <SignaturCanvas sectors={soulprintSectors ?? undefined} paused={false} />
        </View>
        <View style={styles.revealOverlay}>
          <Text style={styles.revealLabel}>Deine Signatur</Text>
          <Text style={styles.revealSubtitle}>
            Das Muster deiner kosmischen Prägung ist entstanden.
          </Text>
          <Pressable
            accessibilityRole="button"
            style={styles.proceedButton}
            onPress={proceed}
          >
            <Text style={styles.proceedButtonText}>Mein Universum entdecken →</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Calculating phase ─────────────────────────────────────────────────────
  if (phase === 'calculating') {
    return (
      <View style={styles.calculatingContainer}>
        <OrbBackdrop visible={true} />
        <View style={styles.calculatingContent}>
          <Text style={styles.calculatingTitle}>Berechnung läuft</Text>
          <Text style={styles.calculatingSubtitle}>
            Dein kosmisches Profil wird aus Geburtsdaten, Wu-Xing-Kräften und westlicher Astrologie berechnet...
          </Text>
        </View>
      </View>
    );
  }

  // ── Birth-input phase (default) ───────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <OrbBackdrop visible={true} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.badge}>Schritt 1 / 2</Text>
        <Text style={styles.title}>Geburtsdaten</Text>
        <Text style={styles.subtitle}>
          Gib deine Geburtsdaten ein, um dein kosmisches Profil zu erstellen.
        </Text>

        <View style={styles.group}>
          <Text style={styles.label}>Geburtsdatum (JJJJ-MM-TT)</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            autoCapitalize="none"
            autoCorrect={false}
            testID="birth-date-input"
          />
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>Geburtszeit (HH:MM)</Text>
          <TextInput
            style={styles.input}
            value={time}
            onChangeText={setTime}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!timeUnknown}
            testID="birth-time-input"
          />
          <Pressable
            accessibilityRole="button"
            style={[styles.pill, timeUnknown && styles.pillActive]}
            onPress={() => setTimeUnknown((prev) => !prev)}
          >
            <Text style={[styles.pillText, timeUnknown && styles.pillTextActive]}>
              {timeUnknown ? "Uhrzeit unbekannt (aktiv)" : "Uhrzeit unbekannt markieren"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>Ortssuche</Text>
          <TextInput
            style={styles.input}
            value={placeQuery}
            onChangeText={setPlaceQuery}
            autoCapitalize="words"
            autoCorrect={false}
            placeholder="Berlin, Deutschland"
            placeholderTextColor="#6f7785"
            testID="place-search-input"
          />
          <Pressable
            accessibilityRole="button"
            style={styles.secondaryButton}
            onPress={lookupPlace}
            disabled={resolving}
          >
            <Text style={styles.secondaryButtonText}>
              {resolving ? "Wird ermittelt..." : "Ort + Zeitzone ermitteln"}
            </Text>
          </Pressable>
          {placeName ? <Text style={styles.helper}>Ausgewählt: {placeName}</Text> : null}
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>Breitengrad</Text>
          <TextInput
            style={styles.input}
            value={lat}
            onChangeText={setLat}
            autoCapitalize="none"
            testID="lat-input"
          />
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>Längengrad</Text>
          <TextInput
            style={styles.input}
            value={lon}
            onChangeText={setLon}
            autoCapitalize="none"
            testID="lon-input"
          />
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>Zeitzone (IANA)</Text>
          <TextInput
            style={styles.input}
            value={tz}
            onChangeText={setTz}
            autoCapitalize="none"
            testID="tz-input"
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          style={styles.primaryButton}
          onPress={submit}
          testID="submit-button"
        >
          <Text style={styles.primaryButtonText}>Mein Reading erstellen</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const styles = StyleSheet.create({
  // ── Birth-input phase
  safe: {
    flex: 1,
    backgroundColor: "#060b12",
  },
  container: {
    padding: 20,
    gap: 14,
  },
  badge: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#d4af37",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#f6f8fb",
  },
  subtitle: {
    fontSize: 14,
    color: "#98a6be",
    lineHeight: 22,
    marginBottom: 6,
  },
  group: {
    gap: 8,
  },
  label: {
    color: "#c3ccd9",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2b3950",
    backgroundColor: "#131d2b",
    color: "#eef2fa",
    paddingHorizontal: 14,
    fontSize: 16,
  },
  helper: {
    color: "#8fa0bc",
    fontSize: 12,
  },
  error: {
    color: "#ff7a7a",
    fontSize: 13,
    lineHeight: 20,
  },
  pill: {
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#44516a",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  pillActive: {
    borderColor: "#d4af37",
    backgroundColor: "#d4af3720",
  },
  pillText: {
    color: "#9da9bc",
    fontSize: 13,
  },
  pillTextActive: {
    color: "#f6e8ba",
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#55627c",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: "#dbe2ef",
    fontWeight: "600",
  },
  primaryButton: {
    marginTop: 8,
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#0d1624",
    fontWeight: "700",
    fontSize: 15,
  },

  // ── Orb backdrop (CosmicEncounterMobile native equivalent)
  orbGold: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#D4AF37',
    top: SCREEN_H * 0.25,
    left: SCREEN_W * 0.05,
    // Soft glow via shadow
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 60,
  },
  orbCyan: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#00F5FF',
    top: SCREEN_H * 0.3,
    right: SCREEN_W * 0.05,
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 50,
  },

  // ── Calculating phase
  calculatingContainer: {
    flex: 1,
    backgroundColor: "#060b12",
    alignItems: 'center',
    justifyContent: 'center',
  },
  calculatingContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  calculatingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f6f8fb',
    textAlign: 'center',
  },
  calculatingSubtitle: {
    fontSize: 14,
    color: '#98a6be',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Ring-reveal phase
  revealContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  revealOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 32,
    paddingBottom: 48,
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  revealLabel: {
    fontSize: 13,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: '#d4af37',
  },
  revealSubtitle: {
    fontSize: 16,
    color: '#c3ccd9',
    textAlign: 'center',
    lineHeight: 24,
  },
  proceedButton: {
    marginTop: 8,
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: '#d4af37',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    width: '100%',
  },
  proceedButtonText: {
    color: '#0d1624',
    fontWeight: '700',
    fontSize: 15,
  },
});
