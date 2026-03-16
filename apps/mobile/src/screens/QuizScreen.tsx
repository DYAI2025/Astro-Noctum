import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QUIZ_DEFINITIONS } from "@bazodiac/shared";
import type { QuizDefinition, QuizResult } from "@bazodiac/shared";
import { useAppState } from "../contexts/AppStateContext";
import {
  flushContributionQueue,
  getQueuedContributionCount,
  queueContributionEvent,
} from "../lib/offlineQueue";
import QuizRenderer from "../components/QuizRenderer";
import { COLORS } from "../theme";

const TOTAL_QUIZZES = QUIZ_DEFINITIONS.length;

function completionKey(userId: string): string {
  return `quiz_completed_${userId}`;
}

// ---------------------------------------------------------------------------
// Section helpers
// ---------------------------------------------------------------------------

type QuizSection = {
  title: string;
  data: QuizDefinition[];
};

function buildSections(): QuizSection[] {
  const standalone = QUIZ_DEFINITIONS.filter((q) => !q.seriesId);
  const kinky = QUIZ_DEFINITIONS.filter((q) => q.seriesId === "kinky");
  const partnerMatch = QUIZ_DEFINITIONS.filter(
    (q) => q.seriesId === "partner-match",
  );

  const sections: QuizSection[] = [];
  if (standalone.length > 0) {
    sections.push({ title: "Persönlichkeit", data: standalone });
  }
  if (kinky.length > 0) {
    sections.push({ title: "Kinky Serie", data: kinky });
  }
  if (partnerMatch.length > 0) {
    sections.push({ title: "Partner Match", data: partnerMatch });
  }
  return sections;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuizScreen() {
  const { userId, bootstrap, tier } = useAppState();
  const isPremium = tier === "premium";

  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [pendingCount, setPendingCount] = useState(0);
  const [activeQuiz, setActiveQuiz] = useState<QuizDefinition | null>(null);

  const enabled = bootstrap?.feature_flags.quizzes_enabled ?? true;

  const sections = useMemo(() => buildSections(), []);

  // ---- load persisted completion state ----
  useEffect(() => {
    let active = true;

    const load = async () => {
      const raw = await AsyncStorage.getItem(completionKey(userId));
      if (!active) return;
      if (raw) {
        try {
          setCompleted(JSON.parse(raw) as Record<string, boolean>);
        } catch {
          setCompleted({});
        }
      }
      const count = await getQueuedContributionCount();
      if (active) setPendingCount(count);
    };

    void load();

    return () => {
      active = false;
    };
  }, [userId]);

  // ---- derived stats ----
  const doneCount = useMemo(
    () => QUIZ_DEFINITIONS.filter((q) => completed[q.id]).length,
    [completed],
  );
  const progressPercent = TOTAL_QUIZZES > 0 ? doneCount / TOTAL_QUIZZES : 0;

  // ---- quiz completion handler ----
  const handleQuizComplete = useCallback(
    async (result: QuizResult) => {
      const quiz = activeQuiz;
      if (!quiz) return;

      // 1. Persist locally
      const updated = { ...completed, [quiz.id]: true };
      setCompleted(updated);
      await AsyncStorage.setItem(completionKey(userId), JSON.stringify(updated));

      // 2. Queue contribution event
      await queueContributionEvent({
        userId,
        moduleId: quiz.id,
        eventId: `${quiz.id}-${Date.now()}`,
        occurredAt: new Date().toISOString(),
        payload: {
          module_id: quiz.id,
          completed: true,
          profile_id: result.profileId,
          source: "mobile",
        },
      });

      // 3. Flush queue
      await flushContributionQueue();
      setPendingCount(await getQueuedContributionCount());

      // 4. Close modal
      setActiveQuiz(null);
    },
    [activeQuiz, completed, userId],
  );

  const handleCloseModal = useCallback(() => {
    setActiveQuiz(null);
  }, []);

  const handleSyncQueue = useCallback(async () => {
    await flushContributionQueue();
    setPendingCount(await getQueuedContributionCount());
  }, []);

  // ---- feature flag gate ----
  if (!enabled) {
    return (
      <View style={styles.state}>
        <Text style={styles.stateEmoji}>🔮</Text>
        <Text style={styles.stateTitle}>Coming soon</Text>
        <Text style={styles.stateBody}>
          Die Quiz-Module werden bald freigeschaltet.
        </Text>
      </View>
    );
  }

  // ---- render ----
  return (
    <View style={styles.root}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item: quiz }) => {
          const isDone = Boolean(completed[quiz.id]);
          const isLocked = Boolean(quiz.premium) && !isPremium;

          return (
            <Pressable
              style={[styles.card, isDone && styles.cardDone]}
              onPress={() => setActiveQuiz(quiz)}
            >
              <Text style={styles.cardEmoji}>{quiz.emoji}</Text>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {quiz.titleDe}
                </Text>
              </View>
              {isDone ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : isLocked ? (
                <Text style={styles.lockIcon}>🔒</Text>
              ) : (
                <Text style={styles.chevron}>›</Text>
              )}
            </Pressable>
          );
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Quizzes</Text>
            <Text style={styles.progressLabel}>
              {doneCount} / {TOTAL_QUIZZES} abgeschlossen
            </Text>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(progressPercent * 100)}%` },
                ]}
              />
            </View>

            {pendingCount > 0 && (
              <Text style={styles.pendingLabel}>
                {pendingCount} ausstehende Sync-Events
              </Text>
            )}
          </View>
        }
        ListFooterComponent={
          <Pressable
            style={styles.syncButton}
            onPress={() => void handleSyncQueue()}
          >
            <Text style={styles.syncText}>Sync Queue Now</Text>
          </Pressable>
        }
      />

      {/* Quiz Modal */}
      <Modal
        visible={activeQuiz !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseModal}
      >
        {activeQuiz && (
          <QuizRenderer
            quiz={activeQuiz}
            onComplete={(result) => void handleQuizComplete(result)}
            onClose={handleCloseModal}
            isPremium={isPremium}
          />
        )}
      </Modal>
    </View>
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
  list: {
    padding: 16,
    paddingBottom: 32,
  },

  // ---- header ----
  header: {
    marginBottom: 12,
    gap: 6,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 2,
  },
  progressLabel: {
    color: COLORS.textDim,
    fontSize: 14,
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.card,
    borderRadius: 2,
    marginTop: 6,
    marginBottom: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    backgroundColor: COLORS.gold,
    borderRadius: 2,
  },
  pendingLabel: {
    color: COLORS.textDim,
    fontSize: 12,
    marginTop: 2,
  },

  // ---- section ----
  sectionHeader: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 20,
    marginBottom: 8,
    paddingLeft: 2,
  },

  // ---- card ----
  card: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    borderRadius: 12,
    borderColor: COLORS.border,
    borderWidth: 1,
    backgroundColor: COLORS.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    gap: 12,
  },
  cardDone: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.greenBg,
  },
  cardEmoji: {
    fontSize: 24,
    width: 32,
    textAlign: "center",
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    color: COLORS.text,
    fontWeight: "600",
    fontSize: 15,
  },
  checkmark: {
    color: COLORS.green,
    fontSize: 20,
    fontWeight: "700",
    width: 28,
    textAlign: "center",
  },
  lockIcon: {
    fontSize: 16,
    width: 28,
    textAlign: "center",
    opacity: 0.4,
  },
  chevron: {
    color: COLORS.textDim,
    fontSize: 22,
    fontWeight: "300",
    width: 28,
    textAlign: "center",
  },

  // ---- sync button ----
  syncButton: {
    minHeight: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#2e425d",
    borderWidth: 1,
    backgroundColor: "#122238",
    marginTop: 12,
    marginBottom: 24,
  },
  syncText: {
    color: "#dde8f7",
    fontWeight: "700",
  },

  // ---- disabled state ----
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: COLORS.bg,
    gap: 10,
  },
  stateEmoji: {
    fontSize: 48,
  },
  stateTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  stateBody: {
    color: COLORS.textDim,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
});
