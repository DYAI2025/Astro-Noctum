/**
 * SignaturRing — 12-sector soulprint ring visualization
 *
 * Pure React Native implementation using Animated API + Views arranged
 * radially. No Skia or react-native-svg dependency required.
 *
 * Each sector is a colored bar radiating outward from center, with length
 * proportional to the sector value. The center shows the Kohärenz-Index
 * as a gold-ringed percentage. Transit modulation (kpIndex) adds a
 * pulsing scale animation.
 */

import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme';

// expo-haptics is optional — gracefully degrade if not installed
let Haptics: { impactAsync: (style: string) => Promise<void> } | null = null;
let ImpactFeedbackStyle: { Light: string } = { Light: 'light' };
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('expo-haptics');
  Haptics = mod;
  ImpactFeedbackStyle = mod.ImpactFeedbackStyle ?? ImpactFeedbackStyle;
} catch {
  // expo-haptics not available — taps will work without haptic feedback
}

// --- Constants -----------------------------------------------------------

const SECTOR_COLORS = [
  '#D63B0F', // 0  Aries     — Fire
  '#3D8B37', // 1  Taurus    — Earth/Wood
  '#C49A2A', // 2  Gemini    — Air/Earth
  '#2E6BB5', // 3  Cancer    — Water
  '#D63B0F', // 4  Leo       — Fire
  '#C49A2A', // 5  Virgo     — Earth
  '#8A8A8A', // 6  Libra     — Metal/Air
  '#2E6BB5', // 7  Scorpio   — Water
  '#D63B0F', // 8  Sagittarius — Fire
  '#C49A2A', // 9  Capricorn — Earth
  '#8A8A8A', // 10 Aquarius  — Metal/Air
  '#2E6BB5', // 11 Pisces    — Water
];

const SECTOR_GLYPHS = [
  '\u2648', // Aries
  '\u2649', // Taurus
  '\u264A', // Gemini
  '\u264B', // Cancer
  '\u264C', // Leo
  '\u264D', // Virgo
  '\u264E', // Libra
  '\u264F', // Scorpio
  '\u2650', // Sagittarius
  '\u2651', // Capricorn
  '\u2652', // Aquarius
  '\u2653', // Pisces
];

const BAR_WIDTH = 8;
const MIN_BAR_LENGTH = 16;
const MAX_BAR_LENGTH = 44;
const CENTER_RADIUS = 36;
const GLYPH_OFFSET = 10; // extra pixels past bar tip for glyph placement

// --- Types ---------------------------------------------------------------

export interface SignaturRingProps {
  /** 12 soulprint sector values (typically 0-1 range) */
  sectors: number[];
  /** Overall Kohärenz-Index, 0-1 */
  harmonyIndex: number;
  /** Kp geomagnetic index, 0-9. Drives transit pulse animation */
  kpIndex?: number;
  /** Outer dimension of the component in px (default 280) */
  size?: number;
  /** Called when a sector bar is tapped */
  onSectorTap?: (index: number, value: number) => void;
}

// --- Component -----------------------------------------------------------

export default function SignaturRing({
  sectors,
  harmonyIndex,
  kpIndex = 0,
  size = 280,
  onSectorTap,
}: SignaturRingProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Derive max value for normalization (avoid division by zero)
  const maxValue = Math.max(...sectors, 0.01);
  const ringRadius = size * 0.36; // ~100px at size 280
  const halfSize = size / 2;

  // --- Transit pulse animation ---
  useEffect(() => {
    pulseAnim.stopAnimation();
    glowAnim.stopAnimation();

    if (kpIndex >= 5) {
      // Strong pulse + gold glow
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false, // opacity interpolation on shadow
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ]),
      ).start();
    } else if (kpIndex >= 3) {
      // Subtle pulse, no glow
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();
      glowAnim.setValue(0);
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }

    return () => {
      pulseAnim.stopAnimation();
      glowAnim.stopAnimation();
    };
  }, [kpIndex, pulseAnim, glowAnim]);

  // --- Derived glow border color ---
  const glowBorderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(212,175,55,0)', 'rgba(212,175,55,0.6)'],
  });

  // --- Tap handler ---
  const handleTap = (index: number) => {
    Haptics?.impactAsync(ImpactFeedbackStyle.Light);
    onSectorTap?.(index, sectors[index] ?? 0);
  };

  // --- Render sector bars ---
  const renderSectors = () =>
    Array.from({ length: 12 }).map((_, i) => {
      const value = sectors[i] ?? 0;
      const normalized = value / maxValue;
      const barLength = MIN_BAR_LENGTH + normalized * MAX_BAR_LENGTH;
      const angleDeg = (i / 12) * 360 - 90; // -90 so index 0 points up
      const angleRad = (angleDeg * Math.PI) / 180;
      const color = SECTOR_COLORS[i];

      // Bar center sits at ringRadius from center of the component
      const barCenterDist = ringRadius;
      const barX = halfSize + Math.cos(angleRad) * barCenterDist - BAR_WIDTH / 2;
      const barY = halfSize + Math.sin(angleRad) * barCenterDist - barLength / 2;

      // Glyph placement at the outer tip
      const glyphDist = ringRadius + barLength / 2 + GLYPH_OFFSET;
      const glyphX = halfSize + Math.cos(angleRad) * glyphDist;
      const glyphY = halfSize + Math.sin(angleRad) * glyphDist;

      return (
        <Pressable
          key={i}
          onPress={() => handleTap(i)}
          hitSlop={6}
          style={{ position: 'absolute' as const }}
        >
          {/* Sector bar */}
          <View
            style={{
              position: 'absolute',
              left: barX,
              top: barY,
              width: BAR_WIDTH,
              height: barLength,
              borderRadius: BAR_WIDTH / 2,
              backgroundColor: color,
              opacity: 0.5 + normalized * 0.5,
              transform: [{ rotate: `${angleDeg + 90}deg` }],
              // Glow effect via shadow
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6 + normalized * 0.4,
              shadowRadius: 4 + normalized * 6,
            }}
          />
          {/* Zodiac glyph */}
          <Text
            style={{
              position: 'absolute',
              left: glyphX - 7,
              top: glyphY - 7,
              fontSize: 11,
              color: COLORS.textDim,
              textAlign: 'center',
              width: 14,
              lineHeight: 14,
            }}
          >
            {SECTOR_GLYPHS[i]}
          </Text>
        </Pressable>
      );
    });

  // --- Harmony percentage text ---
  const harmonyPct = Math.round(harmonyIndex * 100);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      {/* Gold glow outer ring (visible during kp >= 5) */}
      {kpIndex !== undefined && kpIndex >= 5 && (
        <Animated.View
          style={[
            styles.glowRing,
            {
              width: size - 4,
              height: size - 4,
              borderRadius: (size - 4) / 2,
              borderColor: glowBorderColor,
            },
          ]}
        />
      )}

      {/* Sector bars */}
      {renderSectors()}

      {/* Center circle with Kohärenz-Index */}
      <View
        style={[
          styles.centerCircle,
          {
            width: CENTER_RADIUS * 2,
            height: CENTER_RADIUS * 2,
            borderRadius: CENTER_RADIUS,
            left: halfSize - CENTER_RADIUS,
            top: halfSize - CENTER_RADIUS,
          },
        ]}
      >
        <Text style={styles.harmonyValue}>{harmonyPct}</Text>
        <Text style={styles.harmonyUnit}>%</Text>
      </View>
    </Animated.View>
  );
}

// --- Styles --------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    top: 2,
    left: 2,
    borderWidth: 2,
    // borderColor is set dynamically via Animated
  },
  centerCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(6, 11, 18, 0.85)',
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    // Gold glow on center
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  harmonyValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.gold,
    letterSpacing: -1,
  },
  harmonyUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textDim,
    marginTop: -4,
  },
});
