# Cluster-Quiz Schema & Registry v1.0

## 1. ClusterDefinition Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "sp.cluster.definition.v1",
  "title": "ClusterDefinition",
  "type": "object",
  "required": ["id", "name", "quizzes", "completionReward", "aggregation"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^cluster\\.[a-z_]+\\.v[0-9]+$"
    },
    "name": {
      "type": "string",
      "maxLength": 50
    },
    "description": {
      "type": "string",
      "maxLength": 500
    },
    "theme": {
      "type": "object",
      "properties": {
        "icon": { "type": "string" },
        "color": { "type": "string", "pattern": "^#[0-9A-Fa-f]{6}$" },
        "aesthetic": { "type": "string", "enum": ["botanical", "mystical", "cosmic", "elemental", "shadow"] }
      }
    },
    "quizzes": {
      "type": "array",
      "minItems": 3,
      "maxItems": 5,
      "items": {
        "type": "object",
        "required": ["id", "order", "weight"],
        "properties": {
          "id": { "type": "string", "pattern": "^quiz\\.[a-z_]+\\.v[0-9]+$" },
          "order": { "type": "integer", "minimum": 1, "maximum": 5 },
          "unlockCondition": { 
            "type": ["string", "null"],
            "pattern": "^(quiz\\.[a-z_]+\\.v[0-9]+|any_[2-4]|previous)?$"
          },
          "weight": { "type": "number", "minimum": 0.5, "maximum": 2.0 },
          "displayName": { "type": "string" },
          "dimension": { "type": "string" }
        }
      }
    },
    "completionReward": {
      "type": "object",
      "required": ["attributeId", "attributeName", "unlockId", "unlockLevel"],
      "properties": {
        "attributeId": { "type": "string", "pattern": "^attribute\\.[a-z_]+$" },
        "attributeName": { "type": "string" },
        "attributeDescription": { "type": "string" },
        "unlockId": { "type": "string", "pattern": "^unlock\\.[a-z_]+\\.[a-z_]+$" },
        "unlockLevel": { "type": "integer", "enum": [1, 2, 3] }
      }
    },
    "aggregation": {
      "type": "object",
      "required": ["method", "outputMarkers"],
      "properties": {
        "method": { "type": "string", "enum": ["weighted_average", "dominant", "synergy"] },
        "outputTraits": { "type": "array", "items": { "type": "string" } },
        "outputMarkers": { "type": "array", "items": { "type": "string" } }
      }
    }
  }
}
```

---

## 2. ClusterContributionEvent Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "sp.cluster.v1",
  "title": "ClusterContributionEvent",
  "type": "object",
  "required": ["specVersion", "eventId", "occurredAt", "source", "clusterMeta", "payload"],
  "properties": {
    "specVersion": {
      "type": "string",
      "const": "sp.cluster.v1"
    },
    "eventId": {
      "type": "string",
      "format": "uuid"
    },
    "occurredAt": {
      "type": "string",
      "format": "date-time"
    },
    "userRef": {
      "type": "string"
    },
    "source": {
      "type": "object",
      "required": ["vertical", "moduleId"],
      "properties": {
        "vertical": { "type": "string", "const": "cluster" },
        "moduleId": { "type": "string", "pattern": "^cluster\\.[a-z_]+\\.v[0-9]+$" },
        "domain": { "type": "string" },
        "locale": { "type": "string" },
        "build": { "type": "string" }
      }
    },
    "clusterMeta": {
      "type": "object",
      "required": ["clusterId", "clusterName", "completedQuizzes"],
      "properties": {
        "clusterId": { "type": "string" },
        "clusterName": { "type": "string" },
        "completedQuizzes": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["quizId", "completedAt", "resultId"],
            "properties": {
              "quizId": { "type": "string" },
              "completedAt": { "type": "string", "format": "date-time" },
              "resultId": { "type": "string" },
              "primaryMarkers": { "type": "array", "items": { "type": "string" } }
            }
          }
        },
        "completionDuration": { "type": "number" }
      }
    },
    "payload": {
      "type": "object",
      "required": ["markers", "clusterAttribute", "unlocks"],
      "properties": {
        "markers": {
          "type": "array",
          "items": { "$ref": "#/$defs/Marker" }
        },
        "traits": {
          "type": "array",
          "items": { "$ref": "#/$defs/TraitScore" }
        },
        "tags": {
          "type": "array",
          "items": { "$ref": "#/$defs/Tag" }
        },
        "unlocks": {
          "type": "array",
          "items": { "$ref": "#/$defs/Unlock" }
        },
        "clusterAttribute": {
          "$ref": "#/$defs/ClusterAttribute"
        },
        "summary": {
          "type": "object",
          "properties": {
            "title": { "type": "string" },
            "tagline": { "type": "string" },
            "bullets": { "type": "array", "items": { "type": "string" } }
          }
        }
      }
    }
  },
  "$defs": {
    "Marker": {
      "type": "object",
      "required": ["id", "weight"],
      "properties": {
        "id": { "type": "string", "pattern": "^marker\\.[a-z_]+\\.[a-z_]+$" },
        "weight": { "type": "number", "minimum": -1, "maximum": 1 },
        "evidence": {
          "type": "object",
          "properties": {
            "itemsAnswered": { "type": "integer" },
            "confidence": { "type": "number", "minimum": 0, "maximum": 1 }
          }
        }
      }
    },
    "TraitScore": {
      "type": "object",
      "required": ["id", "score"],
      "properties": {
        "id": { "type": "string", "pattern": "^trait\\.[a-z_]+\\.[a-z_]+$" },
        "score": { "type": "integer", "minimum": 1, "maximum": 100 },
        "band": { "type": "string", "enum": ["low", "midlow", "mid", "midhigh", "high"] },
        "confidence": { "type": "number", "minimum": 0, "maximum": 1 }
      }
    },
    "Tag": {
      "type": "object",
      "required": ["id", "label", "kind"],
      "properties": {
        "id": { "type": "string", "pattern": "^tag\\.[a-z_]+\\.[a-z_]+$" },
        "label": { "type": "string" },
        "kind": { "type": "string", "enum": ["archetype", "shadow", "style", "astro", "interest", "cluster"] },
        "weight": { "type": "number", "minimum": 0, "maximum": 1 }
      }
    },
    "Unlock": {
      "type": "object",
      "required": ["id", "unlocked"],
      "properties": {
        "id": { "type": "string", "pattern": "^unlock\\.[a-z_]+\\.[a-z_]+$" },
        "unlocked": { "type": "boolean" },
        "unlockedAt": { "type": "string", "format": "date-time" },
        "level": { "type": "integer", "enum": [1, 2, 3] },
        "sourceRef": { "type": "string" }
      }
    },
    "ClusterAttribute": {
      "type": "object",
      "required": ["id", "name", "level", "archetype", "components"],
      "properties": {
        "id": { "type": "string", "pattern": "^attribute\\.[a-z_]+$" },
        "name": { "type": "string" },
        "level": { "type": "integer", "minimum": 1, "maximum": 100 },
        "archetype": { "type": "string" },
        "components": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["quizId", "component", "weight"],
            "properties": {
              "quizId": { "type": "string" },
              "component": { "type": "string" },
              "weight": { "type": "number" }
            }
          }
        },
        "narrative": { "type": "string" }
      }
    }
  }
}
```

---

## 3. Registry-Erweiterung: Cluster-Marker

```typescript
// src/lib/registry/cluster-markers.ts

export const CLUSTER_MARKERS = {
  // Naturkind-Cluster
  "marker.nature.elemental_harmony": {
    name: "Elementare Harmonie",
    description: "Balance zwischen den Naturelementen",
    domain: "nature"
  },
  "marker.nature.wild_soul": {
    name: "Wilde Seele",
    description: "Verbindung zum Instinkthaften",
    domain: "nature"
  },
  "marker.nature.rooted_presence": {
    name: "Verwurzelte Präsenz",
    description: "Stabilität und Erdung",
    domain: "nature"
  },
  
  // Blumenwesen-Markers
  "marker.flower.lotus": { name: "Lotus-Essenz", domain: "nature" },
  "marker.flower.rose": { name: "Rosen-Essenz", domain: "nature" },
  "marker.flower.wildflower": { name: "Wildblumen-Essenz", domain: "nature" },
  "marker.flower.sunflower": { name: "Sonnenblumen-Essenz", domain: "nature" },
  "marker.flower.orchid": { name: "Orchideen-Essenz", domain: "nature" },
  "marker.flower.lavender": { name: "Lavendel-Essenz", domain: "nature" },
  
  // Ahnenstein-Markers
  "marker.stone.amethyst": { name: "Amethyst-Kern", domain: "earth" },
  "marker.stone.obsidian": { name: "Obsidian-Kern", domain: "earth" },
  "marker.stone.rose_quartz": { name: "Rosenquarz-Kern", domain: "earth" },
  "marker.stone.amber": { name: "Bernstein-Kern", domain: "earth" },
  "marker.stone.malachite": { name: "Malachit-Kern", domain: "earth" },
  "marker.stone.moonstone": { name: "Mondstein-Kern", domain: "earth" }
} as const;
```

---

## 4. Registry-Erweiterung: Cluster-Attributes

```typescript
// src/lib/registry/cluster-attributes.ts

export const CLUSTER_ATTRIBUTES = {
  "attribute.naturkind": {
    name: "Naturkind",
    description: "Die Essenz deiner Verbindung zur natürlichen Welt",
    cluster: "cluster.naturkind.v1",
    icon: "🌿",
    color: "#2D5A4C"
  },
  "attribute.schattenwanderer": {
    name: "Schattenwanderer",
    description: "Dein Gleichgewicht zwischen Licht und Dunkelheit",
    cluster: "cluster.schattenwanderer.v1",
    icon: "🌑",
    color: "#1A1A2E"
  },
  "attribute.zeitreisender": {
    name: "Zeitreisender",
    description: "Deine temporale Identität durch die Zeiten",
    cluster: "cluster.zeitreisender.v1",
    icon: "⏳",
    color: "#4A4063"
  }
} as const;
```

---

## 5. Registry-Erweiterung: Cluster-Unlocks

```typescript
// src/lib/registry/cluster-unlocks.ts

export const CLUSTER_UNLOCKS = {
  "unlock.badges.naturkind_complete": {
    name: "Naturkind",
    description: "Alle vier Naturverbindungen erkundet",
    level: 3,
    icon: "🌿",
    rarity: "legendary"
  },
  "unlock.badges.schattenwanderer_complete": {
    name: "Schattenwanderer",
    description: "Die Dualität gemeistert",
    level: 3,
    icon: "🌑",
    rarity: "legendary"
  }
} as const;
```

---

## 6. ClusterProgress Interface (für UI-State)

```typescript
// src/lib/types/cluster-progress.ts

interface ClusterProgress {
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

interface ClusterProgressStore {
  clusters: Record<string, ClusterProgress>;
  
  // Methods
  startCluster(clusterId: string): void;
  completeQuiz(clusterId: string, quizResult: QuizResult): void;
  getProgress(clusterId: string): ClusterProgress | null;
  getAllInProgress(): ClusterProgress[];
  isClusterComplete(clusterId: string): boolean;
}
```

---

## 7. Naturkind-Cluster Definition (konkret)

```json
{
  "id": "cluster.naturkind.v1",
  "name": "Naturkind",
  "description": "Die Essenz deiner Verbindung zur natürlichen Welt – verdichtet in vier Dimensionen: deine energetische Signatur, dein instinktiver Begleiter, deine Wachstums-Essenz und deine materielle Resonanz.",
  "theme": {
    "icon": "🌿",
    "color": "#2D5A4C",
    "aesthetic": "botanical"
  },
  "quizzes": [
    {
      "id": "quiz.aura.v1",
      "order": 1,
      "unlockCondition": null,
      "weight": 1.2,
      "displayName": "Deine Aura-Farbe",
      "dimension": "Energetische Signatur",
      "teaserText": "Welche Farbe umgibt deine Seele?"
    },
    {
      "id": "quiz.krafttier.v1",
      "order": 2,
      "unlockCondition": null,
      "weight": 1.0,
      "displayName": "Dein Krafttier",
      "dimension": "Instinktive Natur",
      "teaserText": "Welcher uralte Wächter schlummert in dir?"
    },
    {
      "id": "quiz.blumenwesen.v1",
      "order": 3,
      "unlockCondition": null,
      "weight": 0.9,
      "displayName": "Dein inneres Blumenwesen",
      "dimension": "Wachstums-Essenz",
      "teaserText": "Wie blühst du in dieser Welt auf?"
    },
    {
      "id": "quiz.ahnenstein.v1",
      "order": 4,
      "unlockCondition": null,
      "weight": 1.1,
      "displayName": "Dein Ahnenstein",
      "dimension": "Materielle Resonanz",
      "teaserText": "Welcher Kristall trägt deine Ahnenweisheit?"
    }
  ],
  "completionReward": {
    "attributeId": "attribute.naturkind",
    "attributeName": "Naturkind",
    "attributeDescription": "Du hast alle vier Naturverbindungen erkundet und deine elementare Identität freigeschaltet.",
    "unlockId": "unlock.badges.naturkind_complete",
    "unlockLevel": 3
  },
  "aggregation": {
    "method": "weighted_average",
    "outputTraits": [
      "trait.nature.earth_affinity",
      "trait.nature.water_affinity",
      "trait.nature.fire_affinity",
      "trait.nature.air_affinity",
      "trait.nature.spirit_affinity"
    ],
    "outputMarkers": [
      "marker.nature.elemental_harmony",
      "marker.nature.wild_soul",
      "marker.nature.rooted_presence"
    ]
  },
  "narrativeTemplate": {
    "format": "Deine Natur-Signatur ist {rarity}: Die {aura} verrät {aura_insight}, während {animal} in dir {animal_trait} bewahrt. {flower} zeigt, dass du {flower_insight}. Und {stone} in deinem Kern? {stone_insight}. Du bist kein Gast in der Natur. Du bist ihr Kind – {adjectives}.",
    "rarityThresholds": {
      "common": [0, 40],
      "uncommon": [41, 60],
      "rare": [61, 80],
      "legendary": [81, 100]
    }
  }
}
```

---

## 8. Validierungs-Regeln für Cluster-Events

| Check | Bedingung |
|-------|-----------|
| ✅ Schema | `specVersion === "sp.cluster.v1"` |
| ✅ Quiz-Count | `completedQuizzes.length >= 3` |
| ✅ Alle IDs | `completedQuizzes` enthält alle Cluster-Quiz-IDs |
| ✅ Attribute | `clusterAttribute.level` zwischen 1 und 100 |
| ✅ Unlock | `unlocks` enthält den Cluster-Badge |
| ✅ Konsistenz | `clusterAttribute.components.length === completedQuizzes.length` |
