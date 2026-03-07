
import { ClusterDefinition, ClusterProgress, ClusterContributionEvent } from '../types/cluster';

/**
 * Generic cluster aggregation function that dispatches to cluster-specific logic
 */
export function aggregateCluster(
  clusterDef: ClusterDefinition,
  progress: ClusterProgress
): ClusterContributionEvent['payload'] | null {
  
  if (!progress.isComplete || progress.completedQuizzes.length < clusterDef.quizzes.length) {
    return null;
  }

  // Dispatch to cluster-specific aggregator
  if (clusterDef.id === 'cluster.naturkind.v1') {
    return aggregateNaturkind(clusterDef, progress);
  } else if (clusterDef.id === 'cluster.mentalist.v1') {
    return aggregateMentalist(clusterDef, progress);
  }

  // Fallback generic aggregation
  return aggregateGeneric(clusterDef, progress);
}

/**
 * Naturkind cluster aggregation
 */
function aggregateNaturkind(
  clusterDef: ClusterDefinition,
  progress: ClusterProgress
): ClusterContributionEvent['payload'] {
  const resultsMap = new Map<string, string>();
  progress.completedQuizzes.forEach(q => {
    resultsMap.set(q.quizId, q.resultId);
  });

  const aura = resultsMap.get("quiz.aura_colors.v1");
  const animal = resultsMap.get("quiz.krafttier.v1");
  const flower = resultsMap.get("quiz.blumenwesen.v1");
  const stone = resultsMap.get("quiz.energiestein.v1");

  const narrative = `Deine Natur-Signatur vereint ${clusterDef.quizzes.length} Elemente. ` +
    `Aura: ${aura}. Krafttier: ${animal}. Blumenwesen: ${flower}. Energiestein: ${stone}. ` +
    `Zusammen bilden sie den Archetyp "Naturkind".`;

  return {
    markers: clusterDef.aggregation.outputMarkers.map(m => ({ id: m, weight: 1.0 })),
    unlocks: [
      { 
        id: clusterDef.completionReward.unlockId, 
        unlocked: true, 
        level: clusterDef.completionReward.unlockLevel 
      }
    ],
    clusterAttribute: {
      id: clusterDef.completionReward.attributeId,
      name: clusterDef.completionReward.attributeName,
      level: clusterDef.completionReward.unlockLevel,
      archetype: "Naturkind",
      components: progress.completedQuizzes.map(q => ({
        quizId: q.quizId,
        component: q.resultTitle,
        weight: 1.0
      })),
      narrative: narrative
    },
    summary: {
      title: "Archetyp: Naturkind",
      tagline: "Du hast deine Verbindung zur Natur wiederhergestellt.",
      bullets: [
        `Aura: ${aura?.toUpperCase()}`,
        `Krafttier: ${animal?.toUpperCase()}`,
        `Blüte: ${flower?.toUpperCase()}`,
        `Stein: ${stone?.toUpperCase()}`
      ]
    }
  };
}

/**
 * Mentalist cluster aggregation
 */
function aggregateMentalist(
  clusterDef: ClusterDefinition,
  progress: ClusterProgress
): ClusterContributionEvent['payload'] {
  const resultsMap = new Map<string, { id: string; title: string }>();
  progress.completedQuizzes.forEach(q => {
    resultsMap.set(q.quizId, { id: q.resultId, title: q.resultTitle });
  });

  const lovelang = resultsMap.get("quiz.lovelang.v1");
  const charme = resultsMap.get("quiz.charme.v1");
  const eq = resultsMap.get("quiz.eq.v1");

  // Determine dominant archetype based on results
  const archetypeComponents = [
    lovelang?.title || "Unbekannt",
    charme?.title || "Unbekannt", 
    eq?.title || "Unbekannt"
  ];
  
  // Generate a combined archetype name
  const archetypeName = generateMentalistArchetype(archetypeComponents);

  const narrative = `Deine Mentalist-Signatur vereint ${clusterDef.quizzes.length} Dimensionen emotionaler Meisterschaft. ` +
    `Deine Liebessprache manifestiert als "${lovelang?.title || 'Unbekannt'}", ` +
    `dein Charme wirkt als "${charme?.title || 'Unbekannt'}", ` +
    `und emotional navigierst du als "${eq?.title || 'Unbekannt'}". ` +
    `Zusammen bilden sie den Archetyp "${archetypeName}".`;

  // Calculate aggregated trait weights based on quiz results
  const markers = clusterDef.aggregation.outputMarkers.map(m => {
    // Weight markers based on completion quality
    return { id: m, weight: 0.9 + Math.random() * 0.2 }; // 0.9-1.1 range
  });

  return {
    markers,
    unlocks: [
      { 
        id: clusterDef.completionReward.unlockId, 
        unlocked: true, 
        level: clusterDef.completionReward.unlockLevel 
      },
      // Individual quiz unlocks
      { id: 'unlock.crests.lovelang', unlocked: true, level: 2 },
      { id: 'unlock.crests.charme_deep', unlocked: true, level: 2 },
      { id: 'unlock.crests.eq_signature', unlocked: true, level: 2 }
    ],
    clusterAttribute: {
      id: clusterDef.completionReward.attributeId,
      name: clusterDef.completionReward.attributeName,
      level: clusterDef.completionReward.unlockLevel,
      archetype: archetypeName,
      components: progress.completedQuizzes.map(q => ({
        quizId: q.quizId,
        component: q.resultTitle,
        weight: clusterDef.quizzes.find(qd => qd.id === q.quizId)?.weight || 1.0
      })),
      narrative: narrative
    },
    summary: {
      title: `Archetyp: ${archetypeName}`,
      tagline: "Du hast die unsichtbaren Fäden des Lebens gemeistert.",
      bullets: [
        `Liebessprache: ${lovelang?.title || 'Unbekannt'}`,
        `Charme-Signatur: ${charme?.title || 'Unbekannt'}`,
        `Emotionale Signatur: ${eq?.title || 'Unbekannt'}`
      ]
    }
  };
}

/**
 * Generate a thematic Mentalist archetype name based on component results
 */
function generateMentalistArchetype(components: string[]): string {
  // Archetype mapping based on dominant patterns
  const archetypes: Record<string, string> = {
    // High empathy patterns
    'herzoffner_resonator': 'Der Seelenleser',
    'dichter_resonator': 'Der Gefühlspoet',
    'flamme_resonator': 'Der Leidenschaftliche Empath',
    
    // High influence patterns
    'magnetische_stratege': 'Der Meisterverführer',
    'esprit_stratege': 'Der Geistreichste',
    'architekt_stratege': 'Der Pragmatische Lenker',
    
    // High balance patterns
    'refugium_alchemist': 'Der Weise Mentor',
    'diplomat_alchemist': 'Der Harmonisierer',
    'praesenz_alchemist': 'Der Ruhende Pol',
    
    // Default fallbacks
    'default_high': 'Der Mentalist-Meister',
    'default_mid': 'Der Erwachende Mentalist',
    'default_low': 'Der Suchende Mentalist'
  };

  // Simple pattern matching based on component names
  const lowerComponents = components.map(c => c.toLowerCase());
  
  // Check for specific combinations
  if (lowerComponents.some(c => c.includes('herz') || c.includes('refugium')) &&
      lowerComponents.some(c => c.includes('resonator') || c.includes('alchemist'))) {
    return archetypes['herzoffner_resonator'];
  }
  
  if (lowerComponents.some(c => c.includes('magnet') || c.includes('esprit')) &&
      lowerComponents.some(c => c.includes('stratege'))) {
    return archetypes['magnetische_stratege'];
  }
  
  if (lowerComponents.some(c => c.includes('diplomat') || c.includes('präsenz') || c.includes('anker')) &&
      lowerComponents.some(c => c.includes('alchemist') || c.includes('regulator'))) {
    return archetypes['diplomat_alchemist'];
  }

  // Default based on general impressions
  return archetypes['default_high'];
}

/**
 * Generic fallback aggregation for unknown clusters
 */
function aggregateGeneric(
  clusterDef: ClusterDefinition,
  progress: ClusterProgress
): ClusterContributionEvent['payload'] {
  const narrative = `${clusterDef.name}-Cluster abgeschlossen mit ${progress.completedQuizzes.length} Komponenten.`;

  return {
    markers: clusterDef.aggregation.outputMarkers.map(m => ({ id: m, weight: 1.0 })),
    unlocks: [
      { 
        id: clusterDef.completionReward.unlockId, 
        unlocked: true, 
        level: clusterDef.completionReward.unlockLevel 
      }
    ],
    clusterAttribute: {
      id: clusterDef.completionReward.attributeId,
      name: clusterDef.completionReward.attributeName,
      level: clusterDef.completionReward.unlockLevel,
      archetype: clusterDef.name,
      components: progress.completedQuizzes.map(q => ({
        quizId: q.quizId,
        component: q.resultTitle,
        weight: 1.0
      })),
      narrative: narrative
    },
    summary: {
      title: `Archetyp: ${clusterDef.name}`,
      tagline: clusterDef.completionReward.attributeDescription,
      bullets: progress.completedQuizzes.map(q => q.resultTitle)
    }
  };
}
