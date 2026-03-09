
export interface ClusterDefinition {
  id: string;
  name: string;
  description: string;
  theme: {
    icon: string;
    color: string;
    aesthetic: 'botanical' | 'mystical' | 'cosmic' | 'elemental' | 'shadow';
  };
  quizzes: {
    id: string;
    order: number;
    unlockCondition?: string | null;
    weight: number;
    displayName: string;
    dimension: string;
    teaserText?: string;
  }[];
  completionReward: {
    attributeId: string;
    attributeName: string;
    attributeDescription: string;
    unlockId: string;
    unlockLevel: 1 | 2 | 3;
  };
  aggregation: {
    method: 'weighted_average' | 'dominant' | 'synergy';
    outputTraits: string[];
    outputMarkers: string[];
  };
  narrativeTemplate?: {
    format: string;
    rarityThresholds: Record<string, [number, number]>;
  };
}

export interface ClusterProgress {
  clusterId: string;
  clusterName: string;
  totalQuizzes: number;
  completedQuizzes: {
    quizId: string;
    completedAt: string;
    resultId: string;
    resultTitle: string;
  }[];
  percentComplete: number;
  isComplete: boolean;
  startedAt: string;
  lastActivityAt: string;
}

export interface ClusterContributionEvent {
  specVersion: 'sp.cluster.v1';
  eventId: string;
  occurredAt: string;
  source: {
    vertical: 'cluster';
    moduleId: string;
    domain: string;
    locale: string;
  };
  clusterMeta: {
    clusterId: string;
    clusterName: string;
    completedQuizzes: {
      quizId: string;
      completedAt: string;
      resultId: string;
      primaryMarkers: string[];
    }[];
    completionDuration?: number;
  };
  payload: {
    markers: Array<{ id: string; weight: number }>;
    traits?: Array<{ id: string; score: number }>;
    tags?: Array<{ id: string; label: string; kind: string }>;
    unlocks: Array<{ id: string; unlocked: boolean; level: number }>;
    clusterAttribute: {
      id: string;
      name: string;
      level: number;
      archetype: string;
      components: {
        quizId: string;
        component: string;
        weight: number;
      }[];
      narrative: string;
    };
    summary: {
      title: string;
      tagline: string;
      bullets: string[];
    };
  };
}
