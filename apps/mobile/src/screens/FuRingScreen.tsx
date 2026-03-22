import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QuizDefinition } from '@bazodiac/shared';
import { useAppState } from '../contexts/AppStateContext';
import { useBootstrapSignatur } from '../hooks/useBootstrapSignatur';
import { useQuizOfTheDay } from '../hooks/useQuizOfTheDay';
import QuizRenderer from '../components/QuizRenderer';
import { COLORS } from '../theme';
import SignaturRing from '../components/SignaturRing';
import { useSpaceWeather } from '../hooks/useSpaceWeather';

const SECTOR_LABELS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const SECTOR_EMOJIS = [
  '\u2648', '\u2649', '\u264A', '\u264B', '\u264C', '\u264D', '\u264E', '\u264F', '\u2650', '\u2651', '\u2652', '\u2653',
];

const SECTOR_COLORS = [
  '#D63B0F', '#3D8B37', '#C49A2A', '#2E6BB5', '#D63B0F', '#C49A2A',
  '#8A8A8A', '#2E6BB5', '#D63B0F', '#C49A2A', '#8A8A8A', '#2E6BB5',
];

// Generate fallback soulprint sectors from profile BAFE data
function generateFallbackSectors(profile: any): number[] {
  const wuxing = profile?.astro_json?.wuxing?.elements || {};
  const elements = [
    Number(wuxing.Wood || wuxing.Holz || 0),
    Number(wuxing.Fire || wuxing.Feuer || 0),
    Number(wuxing.Earth || wuxing.Erde || 0),
    Number(wuxing.Metal || wuxing.Metall || 0),
    Number(wuxing.Water || wuxing.Wasser || 0),
  ];
  const total = elements.reduce((s, v) => s + v, 0) || 1;
  // Distribute 5 elements across 12 sectors (fire→aries/leo/sag, etc.)
  const sectorMap = [1, 2, 2, 4, 1, 2, 3, 4, 1, 2, 3, 4]; // element index per sector
  return sectorMap.map(elIdx => {
    const base = elements[elIdx] / total;
    const jitter = 0.05 * Math.sin(elIdx * 2.7); // slight variation
    return Math.max(0.05, base + jitter);
  });
}

export function FuRingScreen() {
  const { profile, userId, tier } = useAppState();
  const { bootstrap, loading } = useBootstrapSignatur(profile);
  const { kpIndex } = useSpaceWeather();
  const [selectedSector, setSelectedSector] = useState<{ index: number; value: number } | null>(null);

  // ---- Quiz des Tages state ----
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [activeQuiz, setActiveQuiz] = useState<QuizDefinition | null>(null);
  const quizOfTheDay = useQuizOfTheDay(completed);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const raw = await AsyncStorage.getItem(`quiz_completed_${userId}`);
      if (!active) return;
      if (raw) {
        try {
          setCompleted(JSON.parse(raw) as Record<string, boolean>);
        } catch {
          setCompleted({});
        }
      }
    };
    void load();
    return () => { active = false; };
  }, [userId]);

  const sectors = useMemo(() => {
    if (!soulprintSectors) return null;
    const max = Math.max(...soulprintSectors, 0.01);
    return soulprintSectors.map((value, i) => ({
      label: SECTOR_LABELS[i],
      emoji: SECTOR_EMOJIS[i],
      color: SECTOR_COLORS[i],
      value,
      pct: Math.round((value / max) * 100),
    }));
  }, [soulprintSectors]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.gold} size="large" />
        <Text style={styles.loadingText}>Signatur wird geladen...</Text>
      </View>
    );
  }

  // Use bootstrap data if available, otherwise fallback to profile
  const soulprintSectors = useMemo(() => {
    if (bootstrap?.soulprint_sectors) return bootstrap.soulprint_sectors;
    if (profile?.astro_json) return generateFallbackSectors(profile);
    return null;
  }, [bootstrap, profile]);

  const profileSummary = useMemo(() => {
    if (bootstrap?.profile) return bootstrap.profile;
    return {
      sun_sign: profile?.sun_sign || '—',
      moon_sign: profile?.moon_sign || '—',
      ascendant_sign: profile?.asc_sign || '—',
      day_master: profile?.astro_json?.bazi?.day_master || '—',
      harmony_index: 0.5,
    };
  }, [bootstrap, profile]);

  if (!soulprintSectors) {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>{'\u2726'}</Text>
        <Text style={styles.title}>Signatur</Text>
        <Text style={styles.subtitle}>
          Erstelle zuerst dein kosmisches Profil.
        </Text>
      </View>
    );
  }

  const bp = profileSummary;
  const seed = bootstrap?.signature_blueprint?.seed || '—';
  const harmony = bp.harmony_index ?? 0.5;
  const harmonyPct = Math.round(harmony * 100);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Signatur Ring Visualization */}
      <View style={styles.ringContainer}>
        <SignaturRing
          sectors={soulprintSectors}
          harmonyIndex={harmony}
          kpIndex={kpIndex}
          size={280}
          onSectorTap={(index, value) => setSelectedSector({ index, value })}
        />
        {selectedSector && (
          <Text style={styles.sectorTooltip}>
            {SECTOR_EMOJIS[selectedSector.index]} {SECTOR_LABELS[selectedSector.index]} — {selectedSector.value.toFixed(2)}
          </Text>
        )}
      </View>

      {/* Profile summary */}
      <View style={styles.card}>
        <Text style={styles.kicker}>DEINE SIGNATUR</Text>
        <Text style={styles.profileLine}>
          {'\u2609'} {bp.sun_sign} {'\u00B7'} {'\u263D'} {bp.moon_sign} {'\u00B7'} {'\u2191'} {bp.ascendant_sign}
        </Text>
        <Text style={styles.profileLine}>
          Tagesmeister: {bp.day_master}
        </Text>
        <View style={styles.harmonyRow}>
          <Text style={styles.harmonyLabel}>Harmonie-Index</Text>
          <View style={styles.harmonyTrack}>
            <View style={[styles.harmonyFill, { width: `${harmonyPct}%` }]} />
          </View>
          <Text style={styles.harmonyPct}>{harmonyPct}%</Text>
        </View>
      </View>

      {/* Soulprint Sectors */}
      <View style={styles.card}>
        <Text style={styles.kicker}>SOULPRINT {'\u00B7'} 12 SEKTOREN</Text>
        {sectors.map((s, i) => (
          <View key={i} style={styles.sectorRow}>
            <Text style={styles.sectorEmoji}>{s.emoji}</Text>
            <Text style={styles.sectorLabel}>{s.label}</Text>
            <View style={styles.sectorTrack}>
              <View
                style={[
                  styles.sectorFill,
                  { backgroundColor: s.color, width: `${Math.max(s.pct, 2)}%` },
                ]}
              />
            </View>
            <Text style={styles.sectorValue}>{s.value.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Signature Seed */}
      <View style={styles.card}>
        <Text style={styles.kicker}>SIGNATUR-SEED</Text>
        <Text style={styles.seedText}>{seed}</Text>
      </View>

      {/* Quiz des Tages */}
      {quizOfTheDay && (
        <Pressable
          style={styles.quizCard}
          onPress={() => setActiveQuiz(quizOfTheDay)}
        >
          <Text style={styles.quizKicker}>QUIZ DES TAGES</Text>
          <View style={styles.quizRow}>
            <Text style={styles.quizEmoji}>{quizOfTheDay.emoji}</Text>
            <View style={styles.quizTextGroup}>
              <Text style={styles.quizTitle}>{quizOfTheDay.titleDe}</Text>
              <Text style={styles.quizSubtitle}>{quizOfTheDay.subtitleDe}</Text>
            </View>
          </View>
          <View style={styles.quizCta}>
            <Text style={styles.quizCtaText}>Starten</Text>
          </View>
        </Pressable>
      )}

      {/* Quiz Modal */}
      <Modal visible={activeQuiz !== null} animationType="slide" presentationStyle="fullScreen">
        {activeQuiz && (
          <QuizRenderer
            quiz={activeQuiz}
            onComplete={(result) => {
              const updated = { ...completed, [activeQuiz.id]: true };
              setCompleted(updated);
              AsyncStorage.setItem(`quiz_completed_${userId}`, JSON.stringify(updated));
              setActiveQuiz(null);
            }}
            onClose={() => setActiveQuiz(null)}
            isPremium={tier === 'premium'}
          />
        )}
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  ringContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  sectorTooltip: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    color: COLORS.textDim,
    marginTop: 12,
    fontSize: 14,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textDim,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  kicker: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  profileLine: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  harmonyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  harmonyLabel: {
    color: COLORS.textDim,
    fontSize: 12,
    width: 100,
  },
  harmonyTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#1a2636',
    borderRadius: 3,
    overflow: 'hidden',
  },
  harmonyFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.gold,
  },
  harmonyPct: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '700',
    width: 36,
    textAlign: 'right',
  },
  sectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  sectorEmoji: {
    fontSize: 16,
    width: 24,
    textAlign: 'center',
  },
  sectorLabel: {
    color: COLORS.textDim,
    fontSize: 11,
    width: 72,
  },
  sectorTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#1a2636',
    borderRadius: 3,
    overflow: 'hidden',
  },
  sectorFill: {
    height: 6,
    borderRadius: 3,
  },
  sectorValue: {
    color: COLORS.textDim,
    fontSize: 10,
    width: 36,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  seedText: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: undefined, // monospace would be ideal but RN default is fine
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  quizCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGold,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  quizKicker: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  quizRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quizEmoji: {
    fontSize: 32,
  },
  quizTextGroup: {
    flex: 1,
    gap: 2,
  },
  quizTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  quizSubtitle: {
    color: COLORS.textDim,
    fontSize: 12,
    lineHeight: 18,
  },
  quizCta: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  quizCtaText: {
    color: COLORS.bg,
    fontSize: 15,
    fontWeight: '800',
  },
});
