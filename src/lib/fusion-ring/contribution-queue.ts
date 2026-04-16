const STORAGE_KEY = 'bazodiac_pending_contributions';

export interface PendingContribution {
  moduleId: string;
  sectorWeights: number[];
  confidence: number;
  timestamp: number;
}

export function loadPendingContributions(): Map<string, PendingContribution> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const arr: PendingContribution[] = JSON.parse(raw);
    return new Map(arr.map(c => [c.moduleId, c]));
  } catch {
    return new Map();
  }
}

function savePendingContributions(pending: Map<string, PendingContribution>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(pending.values())));
  } catch {
    // localStorage full or unavailable — best effort
  }
}

export function queueContribution(moduleId: string, sectorWeights: number[], confidence: number): void {
  const pending = loadPendingContributions();
  pending.set(moduleId, { moduleId, sectorWeights, confidence, timestamp: Date.now() });
  savePendingContributions(pending);
}

export function drainClusterContributions(moduleIds: string[]): PendingContribution[] {
  const pending = loadPendingContributions();
  const drained: PendingContribution[] = [];
  for (const id of moduleIds) {
    const entry = pending.get(id);
    if (entry) {
      drained.push(entry);
      pending.delete(id);
    }
  }
  savePendingContributions(pending);
  return drained;
}
