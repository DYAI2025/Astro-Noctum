/**
 * SignaturVisual — Animated signature visualization (no GL dependency)
 *
 * A living, breathing cosmic signature using React Native Animated API.
 * Multiple concentric rings with planet-colored segments that pulse,
 * rotate, and react to touch and space weather.
 *
 * This is the reliable fallback for when expo-gl doesn't work (simulator)
 * or as the default until the full GL engine is validated on real devices.
 */

import { useEffect, useRef, useMemo } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

const PLANET_COLORS = [
  '#FFB81F', // Sun — gold
  '#AD8CFF', // Moon — violet
  '#33F2FF', // Mercury — cyan
  '#FF66B8', // Venus — pink
  '#FF261F', // Mars — red
  '#FFE000', // Jupiter — yellow
  '#6185B8', // Saturn — steel blue
];

const RING_COUNT = 7; // one per planet

interface SignaturVisualProps {
  weights: number[]; // 7 planet weights [0-1]
  kpIndex?: number;
  size?: number;
  onTap?: () => void;
}

export default function SignaturVisual({
  weights,
  kpIndex = 0,
  size = 300,
  onTap,
}: SignaturVisualProps) {
  // Create animated values for each ring
  const rotations = useRef(
    Array.from({ length: RING_COUNT }, () => new Animated.Value(0))
  ).current;

  const scales = useRef(
    Array.from({ length: RING_COUNT }, () => new Animated.Value(1))
  ).current;

  const opacities = useRef(
    Array.from({ length: RING_COUNT }, () => new Animated.Value(0.6))
  ).current;

  // Pulse animation for touch feedback
  const touchPulse = useRef(new Animated.Value(1)).current;

  // Start continuous animations
  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];

    rotations.forEach((rot, i) => {
      // Each ring rotates at a different speed and direction
      const direction = i % 2 === 0 ? 1 : -1;
      const duration = 8000 + i * 3000 + (weights[i] ?? 0.5) * 4000;

      const anim = Animated.loop(
        Animated.timing(rot, {
          toValue: direction,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      anim.start();
      animations.push(anim);
    });

    // Breathing/pulse for each ring
    scales.forEach((scale, i) => {
      const w = weights[i] ?? 0.5;
      const breatheAmplitude = 0.02 + w * 0.04;
      const kpBoost = kpIndex >= 5 ? 0.03 : kpIndex >= 3 ? 0.01 : 0;
      const duration = 2000 + i * 500;

      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1 + breatheAmplitude + kpBoost,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1 - breatheAmplitude * 0.5,
            duration: duration * 0.8,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
      animations.push(anim);
    });

    // Opacity breathing
    opacities.forEach((opacity, i) => {
      const w = weights[i] ?? 0.5;
      const baseAlpha = 0.15 + w * 0.55;
      const duration = 3000 + i * 700;

      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: Math.min(1, baseAlpha + 0.15),
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: Math.max(0.1, baseAlpha - 0.1),
            duration: duration * 1.2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
      animations.push(anim);
    });

    return () => {
      animations.forEach(a => a.stop());
    };
  }, [weights, kpIndex, rotations, scales, opacities]);

  // Touch handler
  const handleTap = () => {
    // Haptic
    try {
      const Haptics = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    // Pulse animation
    Animated.sequence([
      Animated.timing(touchPulse, {
        toValue: 1.08,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(touchPulse, {
        toValue: 1,
        duration: 400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    onTap?.();
  };

  // Compute ring dimensions based on weights
  const rings = useMemo(() => {
    return weights.map((w, i) => {
      const normalizedWeight = Math.max(0.15, Math.min(1, w));
      const baseRadius = size * 0.12 + (i * size * 0.05);
      const radius = baseRadius + normalizedWeight * size * 0.03;
      const thickness = 2 + normalizedWeight * 6;
      const color = PLANET_COLORS[i] ?? '#FFB81F';

      return { radius, thickness, color, weight: normalizedWeight };
    });
  }, [weights, size]);

  const center = size / 2;

  return (
    <Pressable onPress={handleTap} style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[styles.inner, { transform: [{ scale: touchPulse }] }]}>
        {/* Center glow */}
        <View style={[styles.centerGlow, {
          left: center - 20,
          top: center - 20,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: PLANET_COLORS[0],
          shadowColor: PLANET_COLORS[0],
          shadowRadius: 20,
          shadowOpacity: 0.4,
        }]} />

        {/* Planet rings */}
        {rings.map((ring, i) => {
          const rotation = rotations[i]!.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          });

          const diameter = ring.radius * 2;

          return (
            <Animated.View
              key={i}
              style={[
                styles.ring,
                {
                  width: diameter,
                  height: diameter,
                  borderRadius: diameter / 2,
                  borderWidth: ring.thickness,
                  borderColor: ring.color,
                  left: center - ring.radius,
                  top: center - ring.radius,
                  opacity: opacities[i],
                  transform: [
                    { rotate: rotation },
                    { scale: scales[i]! },
                  ],
                  // Dashed border for visual interest
                  ...(i % 2 === 0 ? {} : { borderStyle: 'dashed' as const }),
                },
              ]}
            >
              {/* Accent dot on each ring */}
              <View style={[
                styles.accentDot,
                {
                  backgroundColor: ring.color,
                  shadowColor: ring.color,
                  shadowRadius: 8,
                  shadowOpacity: 0.6,
                  width: 4 + ring.weight * 6,
                  height: 4 + ring.weight * 6,
                  borderRadius: 5 + ring.weight * 3,
                  top: -2 - ring.weight * 3,
                  left: ring.radius - 2 - ring.weight * 3,
                },
              ]} />
            </Animated.View>
          );
        })}

        {/* Kp storm indicator — outer pulsing ring */}
        {kpIndex >= 3 && (
          <Animated.View
            style={[
              styles.stormRing,
              {
                width: size * 0.92,
                height: size * 0.92,
                borderRadius: size * 0.46,
                left: center - size * 0.46,
                top: center - size * 0.46,
                borderColor: kpIndex >= 5 ? '#ff4422' : '#FFB81F',
                opacity: opacities[0],
              },
            ]}
          />
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#060b12',
    borderRadius: 16,
    overflow: 'hidden',
  },
  inner: {
    flex: 1,
    position: 'relative',
  },
  centerGlow: {
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
  },
  accentDot: {
    position: 'absolute',
  },
  stormRing: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'dotted',
  },
});
