import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QUIZ_MODULE_IDS, type QuizModuleId } from "@bazodiac/shared";
import { useAppState } from "../contexts/AppStateContext";
import {
  flushContributionQueue,
  getQueuedContributionCount,
  queueContributionEvent,
} from "../lib/offlineQueue";

const LABELS: Record<QuizModuleId, string> = {
  "personality-core": "Personality Core",
  "career-dna": "Career DNA",
  "social-role": "Social Role",
  "aura-colors": "Aura Colors",
  "partner-match-01": "Partner Match I",
  "partner-match-02": "Partner Match II",
  "partner-match-03": "Partner Match III",
};

function stateKey(userId: string): string {
  return `bazodiac_mobile_quiz_state_${userId}`;
}

export function QuizScreen() {
  const { userId, bootstrap } = useAppState();
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [pendingCount, setPendingCount] = useState(0);

  const enabled = bootstrap?.feature_flags.quizzes_enabled ?? true;

  useEffect(() => {
    let active = true;

    const load = async () => {
      const raw = await AsyncStorage.getItem(stateKey(userId));
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

  const completionPercent = useMemo(() => {
    const done = QUIZ_MODULE_IDS.filter((id) => completed[id]).length;
    return Math.round((done / QUIZ_MODULE_IDS.length) * 100);
  }, [completed]);

  const toggleModule = async (moduleId: QuizModuleId) => {
    const next = !completed[moduleId];
    const updated = { ...completed, [moduleId]: next };
    setCompleted(updated);
    await AsyncStorage.setItem(stateKey(userId), JSON.stringify(updated));

    await queueContributionEvent({
      userId,
      moduleId,
      eventId: `${moduleId}-${Date.now()}`,
      occurredAt: new Date().toISOString(),
      payload: {
        module_id: moduleId,
        completed: next,
        source: "mobile",
      },
    });

    await flushContributionQueue();
    setPendingCount(await getQueuedContributionCount());
  };

  if (!enabled) {
    return (
      <View style={styles.state}>
        <Text style={styles.stateTitle}>Quiz modules are disabled</Text>
        <Text style={styles.stateBody}>Feature flag gate is active for staged release safety.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={QUIZ_MODULE_IDS}
      keyExtractor={(item) => item}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const isDone = Boolean(completed[item]);
        return (
          <Pressable style={[styles.card, isDone && styles.cardDone]} onPress={() => void toggleModule(item)}>
            <Text style={styles.title}>{LABELS[item]}</Text>
            <Text style={styles.subtitle}>{isDone ? "Completed" : "Tap to mark complete"}</Text>
          </Pressable>
        );
      }}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Contribution Modules</Text>
          <Text style={styles.headerBody}>Offline-safe queue with `user_id + module_id` conflict strategy.</Text>
          <Text style={styles.stats}>Completion: {completionPercent}%</Text>
          <Text style={styles.stats}>Pending queued writes: {pendingCount}</Text>
        </View>
      }
      ListFooterComponent={
        <Pressable style={styles.syncButton} onPress={() => void flushContributionQueue().then(async () => setPendingCount(await getQueuedContributionCount()))}>
          <Text style={styles.syncText}>Sync Queue Now</Text>
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    gap: 10,
    backgroundColor: "#060b12",
  },
  header: {
    marginBottom: 6,
    gap: 4,
  },
  headerTitle: {
    color: "#f4f7fb",
    fontSize: 23,
    fontWeight: "700",
  },
  headerBody: {
    color: "#9db0ca",
    fontSize: 13,
  },
  stats: {
    color: "#cdd8ea",
    fontSize: 12,
  },
  card: {
    minHeight: 70,
    borderRadius: 12,
    borderColor: "#243547",
    borderWidth: 1,
    backgroundColor: "#0f1823",
    padding: 12,
    justifyContent: "center",
    gap: 5,
  },
  cardDone: {
    borderColor: "#4f8f59",
    backgroundColor: "#12301a",
  },
  title: {
    color: "#f1f5fb",
    fontWeight: "700",
    fontSize: 15,
  },
  subtitle: {
    color: "#9cb0c8",
    fontSize: 12,
  },
  syncButton: {
    minHeight: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#2e425d",
    borderWidth: 1,
    backgroundColor: "#122238",
    marginTop: 8,
    marginBottom: 24,
  },
  syncText: {
    color: "#dde8f7",
    fontWeight: "700",
  },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#060b12",
    gap: 8,
  },
  stateTitle: {
    color: "#f4f7fb",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  stateBody: {
    color: "#9cb0ca",
    textAlign: "center",
    lineHeight: 21,
  },
});
