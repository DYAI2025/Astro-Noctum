import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { QuizDefinition } from '@bazodiac/shared';
import type { QuizResult } from '@bazodiac/shared';
import { scoreQuiz } from '@bazodiac/shared';
import { COLORS } from '../theme';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface QuizRendererProps {
  quiz: QuizDefinition;
  onComplete: (result: QuizResult) => void;
  onClose: () => void;
  isPremium?: boolean;
}

const AUTO_ADVANCE_MS = 400;
const FAKE_LOADING_MS = 1500;

// ---------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------

type Screen = 'intro' | 'questions' | 'loading' | 'result' | 'locked' | 'ai-placeholder';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function QuizRenderer({
  quiz,
  onComplete,
  onClose,
  isPremium = false,
}: QuizRendererProps) {
  // ---- state ----
  const [screen, setScreen] = useState<Screen>(() => {
    if (quiz.premium && !isPremium) return 'locked';
    return 'intro';
  });
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);

  // ---- animations ----
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const spin1 = useRef(new Animated.Value(0)).current;
  const spin2 = useRef(new Animated.Value(0)).current;

  // ---- helpers ----
  const currentQuestion = quiz.questions[questionIndex] ?? null;
  const totalQuestions = quiz.questions.length;

  const fadeTransition = useCallback(
    (next: () => void) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start(() => {
        next();
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }).start();
      });
    },
    [fadeAnim],
  );

  // ---- start quiz ----
  const handleStart = useCallback(() => {
    if (totalQuestions === 0) {
      fadeTransition(() => setScreen('ai-placeholder'));
      return;
    }
    fadeTransition(() => setScreen('questions'));
  }, [totalQuestions, fadeTransition]);

  // ---- answer selection ----
  const handleAnswer = useCallback(
    (optionId: string) => {
      if (selectedOptionId !== null) return; // prevent double-tap
      setSelectedOptionId(optionId);

      const questionId = currentQuestion?.id;
      if (!questionId) return;

      const updated = { ...answers, [questionId]: optionId };
      setAnswers(updated);

      setTimeout(() => {
        setSelectedOptionId(null);
        if (questionIndex < totalQuestions - 1) {
          fadeTransition(() => setQuestionIndex(questionIndex + 1));
        } else {
          // all questions answered, go to loading
          fadeTransition(() => setScreen('loading'));
        }
      }, AUTO_ADVANCE_MS);
    },
    [selectedOptionId, currentQuestion, answers, questionIndex, totalQuestions, fadeTransition],
  );

  // ---- back during questions ----
  const handleBack = useCallback(() => {
    if (questionIndex > 0) {
      fadeTransition(() => setQuestionIndex(questionIndex - 1));
    } else {
      fadeTransition(() => setScreen('intro'));
    }
  }, [questionIndex, fadeTransition]);

  // ---- loading screen spinner + scoring ----
  useEffect(() => {
    if (screen !== 'loading') return;

    // Start spinners
    const loop1 = Animated.loop(
      Animated.timing(spin1, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const loop2 = Animated.loop(
      Animated.timing(spin2, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop1.start();
    loop2.start();

    const timer = setTimeout(() => {
      const scored = scoreQuiz(quiz, answers);
      setResult(scored);
      loop1.stop();
      loop2.stop();
      fadeTransition(() => setScreen('result'));
    }, FAKE_LOADING_MS);

    return () => {
      clearTimeout(timer);
      loop1.stop();
      loop2.stop();
    };
  }, [screen, quiz, answers, spin1, spin2, fadeTransition]);

  const spinInterpolation1 = spin1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const spinInterpolation2 = spin2.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  // ---- complete ----
  const handleComplete = useCallback(() => {
    if (result) onComplete(result);
  }, [result, onComplete]);

  // ---- render helpers ----

  const renderCloseButton = () => (
    <Pressable
      style={styles.closeButton}
      onPress={onClose}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Close"
    >
      <Text style={styles.closeButtonText}>✕</Text>
    </Pressable>
  );

  const renderBackButton = () => (
    <Pressable
      style={styles.backButton}
      onPress={handleBack}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Back"
    >
      <Text style={styles.backButtonText}>←</Text>
    </Pressable>
  );

  // ===================== LOCKED SCREEN =====================
  if (screen === 'locked') {
    return (
      <SafeAreaView style={styles.root}>
        {renderCloseButton()}
        <View style={styles.centeredContainer}>
          <Text style={styles.lockEmoji}>🔒</Text>
          <Text style={styles.title}>Premium-Quiz</Text>
          <Text style={styles.subtitle}>
            Dieses Quiz ist nur mit einem Premium-Abo verfügbar.
          </Text>
          <Pressable style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>Zurück</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ===================== AI PLACEHOLDER SCREEN =====================
  if (screen === 'ai-placeholder') {
    return (
      <SafeAreaView style={styles.root}>
        {renderCloseButton()}
        <Animated.View style={[styles.centeredContainer, { opacity: fadeAnim }]}>
          <Text style={styles.emoji}>🤖</Text>
          <Text style={styles.title}>KI-gestützte Analyse</Text>
          <Text style={styles.subtitle}>
            Diese Analyse nutzt künstliche Intelligenz und ist in der App noch nicht verfügbar.
          </Text>
          <Pressable style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>Schließen</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <Animated.View style={[styles.flex1, { opacity: fadeAnim }]}>
        {/* ===================== INTRO ===================== */}
        {screen === 'intro' && (
          <>
            {renderCloseButton()}
            <ScrollView
              contentContainerStyle={styles.centeredContainer}
              bounces={false}
            >
              <Text style={styles.emoji}>{quiz.emoji}</Text>
              <Text style={styles.title}>{quiz.titleDe}</Text>
              <Text style={styles.subtitle}>{quiz.subtitleDe}</Text>
              <Pressable style={styles.goldButton} onPress={handleStart}>
                <Text style={styles.goldButtonText}>Start</Text>
              </Pressable>
            </ScrollView>
          </>
        )}

        {/* ===================== QUESTIONS ===================== */}
        {screen === 'questions' && currentQuestion && (
          <>
            <View style={styles.header}>
              {renderBackButton()}
              {renderCloseButton()}
            </View>

            {/* Progress bar */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${((questionIndex + 1) / totalQuestions) * 100}%` },
                ]}
              />
            </View>

            <ScrollView
              contentContainerStyle={styles.questionContainer}
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              {/* Progress text */}
              <Text style={styles.progressText}>
                {questionIndex + 1} / {totalQuestions}
              </Text>

              {/* Context label */}
              {currentQuestion.context ? (
                <Text style={styles.contextLabel}>{currentQuestion.context}</Text>
              ) : null}

              {/* Question text */}
              <Text style={styles.questionText}>{currentQuestion.text}</Text>

              {/* Options */}
              <View style={styles.optionsContainer}>
                {currentQuestion.options.map(option => {
                  const isSelected = selectedOptionId === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      style={[
                        styles.optionButton,
                        isSelected && styles.optionButtonSelected,
                      ]}
                      onPress={() => handleAnswer(option.id)}
                      disabled={selectedOptionId !== null}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {option.text}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </>
        )}

        {/* ===================== LOADING ===================== */}
        {screen === 'loading' && (
          <View style={styles.centeredContainer}>
            <View style={styles.spinnerContainer}>
              <Animated.View
                style={[
                  styles.spinnerRing,
                  styles.spinnerRingOuter,
                  { transform: [{ rotate: spinInterpolation1 }] },
                ]}
              />
              <Animated.View
                style={[
                  styles.spinnerRing,
                  styles.spinnerRingInner,
                  { transform: [{ rotate: spinInterpolation2 }] },
                ]}
              />
            </View>
            <Text style={styles.loadingText}>Deine Signatur entsteht...</Text>
          </View>
        )}

        {/* ===================== RESULT ===================== */}
        {screen === 'result' && result && (
          <ScrollView
            contentContainerStyle={styles.centeredContainer}
            bounces={false}
          >
            <Text style={styles.emoji}>{result.profile.emoji}</Text>
            <Text style={styles.title}>{result.profile.title}</Text>

            {/* Accent color bar */}
            <View
              style={[
                styles.accentBar,
                { backgroundColor: result.profile.color || COLORS.gold },
              ]}
            />

            <Text style={styles.resultDescription}>
              {result.profile.description}
            </Text>

            <Pressable style={styles.goldButton} onPress={handleComplete}>
              <Text style={styles.goldButtonText}>Schließen</Text>
            </Pressable>
          </ScrollView>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flex1: {
    flex: 1,
  },

  // ---- layout ----
  centeredContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  questionContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },

  // ---- header / nav ----
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    height: 48,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: COLORS.textDim,
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backButtonText: {
    color: COLORS.textDim,
    fontSize: 20,
    fontWeight: '600',
  },

  // ---- progress ----
  progressBarTrack: {
    height: 3,
    backgroundColor: COLORS.card,
    marginHorizontal: 24,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 3,
    backgroundColor: COLORS.gold,
    borderRadius: 2,
  },
  progressText: {
    color: COLORS.textDim,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },

  // ---- text ----
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  lockEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  subtitle: {
    color: COLORS.textDim,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 36,
    maxWidth: 320,
  },
  contextLabel: {
    color: COLORS.gold,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 10,
  },
  questionText: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 32,
    marginBottom: 28,
    fontFamily: undefined, // Will use serif on device if set — kept as system default for RN compat
  },

  // ---- options ----
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
  },
  optionButtonSelected: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.goldDim,
  },
  optionText: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 22,
  },
  optionTextSelected: {
    color: COLORS.gold,
  },

  // ---- loading spinner ----
  spinnerContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  spinnerRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  spinnerRingOuter: {
    width: 72,
    height: 72,
    borderTopColor: COLORS.gold,
    borderRightColor: COLORS.gold,
  },
  spinnerRingInner: {
    width: 48,
    height: 48,
    borderBottomColor: COLORS.textDim,
    borderLeftColor: COLORS.textDim,
  },
  loadingText: {
    color: COLORS.textDim,
    fontSize: 16,
    letterSpacing: 0.5,
  },

  // ---- result ----
  accentBar: {
    width: 48,
    height: 4,
    borderRadius: 2,
    marginBottom: 24,
    marginTop: 4,
  },
  resultDescription: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 36,
    maxWidth: 340,
    opacity: 0.85,
  },

  // ---- buttons ----
  goldButton: {
    minHeight: 48,
    paddingVertical: 14,
    paddingHorizontal: 48,
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldButtonText: {
    color: COLORS.bg,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    minHeight: 48,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.textDim,
    fontSize: 16,
    fontWeight: '600',
  },
});
