import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { computeFusionSignal } from '@bazodiac/shared';
import { useAppState } from '../contexts/AppStateContext';
import { SignaturCanvas } from '../components/SignaturCanvas';

function vectorFrom(input: unknown): number[] {
  if (Array.isArray(input)) {
    return new Array(12).fill(0).map((_, idx) => Number(input[idx] ?? 0));
  }
  if (input && typeof input === 'object') {
    const values = Object.values(input as Record<string, unknown>).map(
      (value) => Number(value || 0),
    );
    if (values.length >= 12) return values.slice(0, 12);
  }
  return new Array(12).fill(0);
}

export function FuRingScreen() {
  const { profile } = useAppState();
  const isFocused = useIsFocused();

  const fusion = useMemo(() => {
    const astro = profile?.astro_json || {};
    const western = vectorFrom(astro?.fusion?.western ?? astro?.western?.vector);
    const bazi = vectorFrom(astro?.fusion?.bazi ?? astro?.bazi?.vector);
    const wuxing = vectorFrom(astro?.fusion?.wuxing ?? astro?.wuxing?.vector);
    const quiz = vectorFrom(astro?.fusion?.quiz ?? astro?.quiz?.vector);
    return computeFusionSignal(western, bazi, wuxing, quiz, Number(astro?.quiz?.completed || 0), 7);
  }, [profile]);

  return (
    <View style={styles.container}>
      {/* 3D Signatur — fills available space */}
      <View style={styles.canvasWrapper}>
        <SignaturCanvas sectors={fusion.sectors} paused={!isFocused} />
      </View>

      {/* Status bar — resolution + peak sectors */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          Resolution: {fusion.resolution}%
        </Text>
        <Text style={styles.statusText}>
          Peak: S{fusion.peakSectors.map((s) => s + 1).join(', S')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030308',
  },
  canvasWrapper: {
    flex: 1,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  statusText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
