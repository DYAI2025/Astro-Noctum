import { useMemo, useState } from "react";
import {
  Alert,
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

type Props = {
  onCompleted: () => Promise<void>;
};

function formatDateForApi(date: string, time: string): string {
  return `${date}T${time}:00`;
}

export function OnboardingScreen({ onCompleted }: Props) {
  const { user } = useAuth();
  const [date, setDate] = useState("1990-01-01");
  const [time, setTime] = useState("12:00");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [lat, setLat] = useState("52.520000");
  const [lon, setLon] = useState("13.405000");
  const [tz, setTz] = useState("Europe/Berlin");
  const [submitting, setSubmitting] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupPlace = async () => {
    if (!placeQuery.trim()) {
      Alert.alert("Ort eingeben", "Bitte gib zuerst einen Ort ein.");
      return;
    }

    setResolving(true);
    try {
      // Use OpenStreetMap Nominatim (same as web app — no API key needed)
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

      // Detect timezone from coordinates using timeapi.io (free, no key)
      try {
        const tzResponse = await fetch(
          `https://timeapi.io/api/timezone/coordinate?latitude=${nextLat}&longitude=${nextLon}`,
        );
        const tzData = await tzResponse.json();
        if (tzData?.timeZone) {
          setTz(tzData.timeZone);
        }
      } catch {
        // Timezone detection failed — keep default, user can edit manually
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
      const message = "Please sign in again.";
      setError(message);
      Alert.alert("Authentication required", message);
      return;
    }

    const parsedLat = Number(lat);
    const parsedLon = Number(lon);

    if (!Number.isFinite(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      const message = "Latitude must be between -90 and 90.";
      setError(message);
      Alert.alert("Invalid latitude", message);
      return;
    }

    if (!Number.isFinite(parsedLon) || parsedLon < -180 || parsedLon > 180) {
      const message = "Longitude must be between -180 and 180.";
      setError(message);
      Alert.alert("Invalid longitude", message);
      return;
    }

    const normalizedTime = timeUnknown ? "12:00" : time;
    const birthDate = formatDateForApi(date, normalizedTime);

    setSubmitting(true);
    try {
      const reading = await calculateAll({
        date: birthDate,
        tz,
        lat: parsedLat,
        lon: parsedLon,
      });

      let interpretation: string;
      try {
        interpretation = await generateInterpretation(reading, "de");
      } catch {
        interpretation = "Dein kosmisches Profil wurde berechnet. Die KI-Deutung wird beim nächsten Öffnen nachgeladen.";
      }

      await persistReading(
        user.id,
        {
          date: birthDate,
          tz,
          lat: parsedLat,
          lon: parsedLon,
          place: placeName || placeQuery,
        },
        reading,
        interpretation,
      );

      await onCompleted();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      Alert.alert("Onboarding failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.badge}>Schritt 1 / 2</Text>
        <Text style={styles.title}>Geburtsdaten</Text>
        <Text style={styles.subtitle}>Gib deine Geburtsdaten ein, um dein kosmisches Profil zu erstellen.</Text>

        <View style={styles.group}>
          <Text style={styles.label}>Birth date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>Birth time (HH:MM)</Text>
          <TextInput
            style={styles.input}
            value={time}
            onChangeText={setTime}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!timeUnknown}
          />

          <Pressable
            accessibilityRole="button"
            style={[styles.pill, timeUnknown && styles.pillActive]}
            onPress={() => setTimeUnknown((prev) => !prev)}
          >
            <Text style={[styles.pillText, timeUnknown && styles.pillTextActive]}>
              {timeUnknown ? "Time unknown enabled" : "Mark time as unknown"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>Place lookup</Text>
          <TextInput
            style={styles.input}
            value={placeQuery}
            onChangeText={setPlaceQuery}
            autoCapitalize="words"
            autoCorrect={false}
            placeholder="Berlin, Germany"
            placeholderTextColor="#6f7785"
          />
          <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={lookupPlace} disabled={resolving}>
            <Text style={styles.secondaryButtonText}>{resolving ? "Resolving..." : "Resolve place + timezone"}</Text>
          </Pressable>
          {placeName ? <Text style={styles.helper}>Selected: {placeName}</Text> : null}
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>Latitude</Text>
          <TextInput style={styles.input} value={lat} onChangeText={setLat} autoCapitalize="none" />
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>Longitude</Text>
          <TextInput style={styles.input} value={lon} onChangeText={setLon} autoCapitalize="none" />
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>Timezone (IANA)</Text>
          <TextInput style={styles.input} value={tz} onChangeText={setTz} autoCapitalize="none" />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          style={[styles.primaryButton, submitting && styles.disabled]}
          onPress={submit}
          disabled={submitting}
        >
          <Text style={styles.primaryButtonText}>{submitting ? "Calculating..." : "Create my reading"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  disabled: {
    opacity: 0.65,
  },
});
