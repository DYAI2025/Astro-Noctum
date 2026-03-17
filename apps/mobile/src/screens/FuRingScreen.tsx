import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

export function FuRingScreen() {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotation = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.ring, { transform: [{ rotate: rotation }] }]}
      />
      <Text style={styles.title}>Signatur</Text>
      <Text style={styles.message}>
        Deine Signatur wird in einem kommenden Update verfügbar.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030308',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  ring: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: 'rgba(212, 175, 55, 0.8)',
    borderRightColor: 'rgba(212, 175, 55, 0.3)',
    marginBottom: 32,
  },
  title: {
    color: '#f5f7fb',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  message: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
});
