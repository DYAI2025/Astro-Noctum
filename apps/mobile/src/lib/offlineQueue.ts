import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { supabase } from "./supabase";

const CONTRIBUTION_QUEUE_KEY = "bazodiac_mobile_contribution_queue";

export type QueuedContributionEvent = {
  userId: string;
  eventId: string;
  moduleId: string;
  occurredAt: string;
  payload: Record<string, unknown>;
};

async function readQueue(): Promise<QueuedContributionEvent[]> {
  const raw = await AsyncStorage.getItem(CONTRIBUTION_QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueuedContributionEvent[];
  } catch {
    return [];
  }
}

async function writeQueue(queue: QueuedContributionEvent[]): Promise<void> {
  await AsyncStorage.setItem(CONTRIBUTION_QUEUE_KEY, JSON.stringify(queue));
}

export async function queueContributionEvent(event: QueuedContributionEvent): Promise<void> {
  const queue = await readQueue();
  const deduped = queue.filter((item) => !(item.userId === event.userId && item.moduleId === event.moduleId));
  deduped.push(event);
  await writeQueue(deduped);
}

export async function getQueuedContributionCount(): Promise<number> {
  const queue = await readQueue();
  return queue.length;
}

export async function flushContributionQueue(): Promise<void> {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return;

  const queue = await readQueue();
  if (queue.length === 0) return;

  const stillPending: QueuedContributionEvent[] = [];

  for (const event of queue) {
    const { error } = await supabase.from("contribution_events").upsert(
      {
        user_id: event.userId,
        event_id: event.eventId,
        module_id: event.moduleId,
        occurred_at: event.occurredAt,
        payload: event.payload,
      },
      { onConflict: "user_id,module_id" },
    );

    if (error) {
      stillPending.push(event);
    }
  }

  await writeQueue(stillPending);
}

export function startQueueWorker(intervalMs = 15000): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      void flushContributionQueue();
    }
  });

  const id = setInterval(() => {
    void flushContributionQueue();
  }, intervalMs);

  return () => {
    unsubscribe();
    clearInterval(id);
  };
}
