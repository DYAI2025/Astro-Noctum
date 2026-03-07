
import { ClusterDefinition } from '../types/cluster';

export const NATURKIND_CLUSTER: ClusterDefinition = {
  id: "cluster.naturkind.v1",
  name: "Naturkind",
  description: "Die Essenz deiner Verbindung zur natürlichen Welt – verdichtet in vier Dimensionen: deine energetische Signatur, dein instinktiver Begleiter, deine Wachstums-Essenz und deine materielle Resonanz.",
  theme: {
    icon: "🌿",
    color: "#2D5A4C",
    aesthetic: "botanical"
  },
  quizzes: [
    {
      id: "quiz.aura_colors.v1",
      order: 1,
      unlockCondition: null,
      weight: 1.2,
      displayName: "Deine Aura-Farbe",
      dimension: "Energetische Signatur",
      teaserText: "Welche Farbe umgibt deine Seele?"
    },
    {
      id: "quiz.krafttier.v1",
      order: 2,
      unlockCondition: "previous", // Suggest sequential flow, but technically optional
      weight: 1.0,
      displayName: "Dein Krafttier",
      dimension: "Instinktive Natur",
      teaserText: "Welcher uralte Wächter schlummert in dir?"
    },
    {
      id: "quiz.blumenwesen.v1",
      order: 3,
      unlockCondition: "previous",
      weight: 0.9,
      displayName: "Dein inneres Blumenwesen",
      dimension: "Wachstums-Essenz",
      teaserText: "Wie blühst du in dieser Welt auf?"
    },
    {
      id: "quiz.energiestein.v1",
      order: 4,
      unlockCondition: "previous",
      weight: 1.1,
      displayName: "Dein Energiestein",
      dimension: "Materielle Resonanz",
      teaserText: "Welcher Kristall resoniert mit deiner Seele?"
    }
  ],
  completionReward: {
    attributeId: "attribute.naturkind",
    attributeName: "Naturkind",
    attributeDescription: "Du hast alle vier Naturverbindungen erkundet und deine elementare Identität freigeschaltet.",
    unlockId: "unlock.badges.naturkind_complete",
    unlockLevel: 3
  },
  aggregation: {
    method: "weighted_average",
    outputTraits: [
      "trait.nature.earth_affinity",
      "trait.nature.water_affinity",
      "trait.nature.fire_affinity",
      "trait.nature.air_affinity"
    ],
    outputMarkers: [
      "marker.nature.elemental_harmony",
      "marker.nature.wild_soul",
      "marker.nature.rooted_presence"
    ]
  },
  narrativeTemplate: {
    format: "Deine Natur-Signatur ist {rarity}: Die {aura} verrät {aura_insight}, während {animal} in dir {animal_trait} bewahrt. {flower} zeigt, dass du {flower_insight}. Und {stone} in deinem Kern? {stone_insight}. Du bist kein Gast in der Natur. Du bist ihr Kind – {adjectives}.",
    rarityThresholds: {
      "common": [0, 40],
      "uncommon": [41, 60],
      "rare": [61, 80],
      "legendary": [81, 100]
    }
  }
};

export const MENTALIST_CLUSTER: ClusterDefinition = {
  id: "cluster.mentalist.v1",
  name: "Mentalist",
  description: "Die Essenz deiner emotionalen und sozialen Intelligenz – verdichtet in drei Dimensionen: deine Liebessprache, deine Charme-Signatur und deine emotionale Alchemie.",
  theme: {
    icon: "🔮",
    color: "#4A0E4E",
    aesthetic: "mystical"
  },
  quizzes: [
    {
      id: "quiz.lovelang.v1",
      order: 1,
      unlockCondition: null,
      weight: 1.0,
      displayName: "Die 5 Sprachen der Liebe",
      dimension: "Beziehungsresonanz",
      teaserText: "Welche Sprache spricht dein Herz?"
    },
    {
      id: "quiz.charme.v1",
      order: 2,
      unlockCondition: "previous",
      weight: 1.2,
      displayName: "Die Kunst des Charmes",
      dimension: "Soziale Magie",
      teaserText: "Wie verzauberst du die Menschen um dich?"
    },
    {
      id: "quiz.eq.v1",
      order: 3,
      unlockCondition: "previous",
      weight: 1.1,
      displayName: "Deine Emotionale Signatur",
      dimension: "Emotionale Alchemie",
      teaserText: "Wie transformierst du Gefühle in Kraft?"
    }
  ],
  completionReward: {
    attributeId: "attribute.mentalist",
    attributeName: "Mentalist",
    attributeDescription: "Du hast alle drei Dimensionen emotionaler Meisterschaft erkundet und deine psychologische Tiefe freigeschaltet.",
    unlockId: "unlock.badges.mentalist_complete",
    unlockLevel: 3
  },
  aggregation: {
    method: "weighted_average",
    outputTraits: [
      "trait.mentalist.empathy",
      "trait.mentalist.influence",
      "trait.mentalist.equilibrium",
      "trait.mentalist.insight"
    ],
    outputMarkers: [
      "marker.mentalist.social_mastery",
      "marker.mentalist.emotional_depth",
      "marker.mentalist.charismatic_presence"
    ]
  },
  narrativeTemplate: {
    format: "Deine Mentalist-Signatur ist {rarity}: Deine Liebessprache ist {lovelang}, während dein Charme als {charme} wirkt. Emotional navigierst du als {eq}. Du bist kein Beobachter des Lebens. Du bist ein Meister der unsichtbaren Fäden – {adjectives}.",
    rarityThresholds: {
      "common": [0, 40],
      "uncommon": [41, 60],
      "rare": [61, 80],
      "legendary": [81, 100]
    }
  }
};

export const CLUSTER_REGISTRY: Record<string, ClusterDefinition> = {
  [NATURKIND_CLUSTER.id]: NATURKIND_CLUSTER,
  [MENTALIST_CLUSTER.id]: MENTALIST_CLUSTER
};
