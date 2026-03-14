export interface ClusterDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  quizModuleIds: string[];
}

export const CLUSTER_REGISTRY: ClusterDef[] = [
  {
    id: 'cluster.naturkind.v1',
    name: 'Naturkind',
    icon: '\u{1F33F}',
    color: '#2D5A4C',
    quizModuleIds: [
      'quiz.aura_colors.v1',
      'quiz.krafttier.v1',
      'quiz.blumenwesen.v1',
      'quiz.energiestein.v1',
    ],
  },
  {
    id: 'cluster.mentalist.v1',
    name: 'Mentalist',
    icon: '\u{1F52E}',
    color: '#4A0E4E',
    quizModuleIds: [
      'quiz.love_languages.v1',
      'quiz.charme.v1',
      'quiz.eq.v1',
    ],
  },
  {
    id: 'cluster.stratege.v1',
    name: 'Stratege',
    icon: '\u265F\uFE0F',
    color: '#1A3A5C',
    quizModuleIds: [
      'quiz.personality.v1',
      'quiz.career_dna.v2',
      'quiz.social_role.v2',
      'quiz.spotlight.v2',
    ],
  },
  {
    id: 'cluster.mystiker.v1',
    name: 'Mystiker',
    icon: '\u{1F300}',
    color: '#5C1A4A',
    quizModuleIds: [
      'quiz.destiny.v1',
      'quiz.rpg_identity.v1',
      'quiz.party_need.v1',
      'quiz.celebrity_soulmate.v1',
    ],
  },
  {
    id: 'cluster.kinky.v1',
    name: 'Kinky',
    icon: '\u{1F525}',
    color: '#8B1A1A',
    quizModuleIds: [
      'quiz.kinky_01.v1',
      'quiz.kinky_02.v1',
      'quiz.kinky_03.v1',
      'quiz.kinky_04.v1',
    ],
  },
  {
    id: 'cluster.partner_match.v1',
    name: 'Partner Match',
    icon: '\u{1F49E}',
    color: '#9B3A6A',
    quizModuleIds: [
      'quiz.partner_match_01.v1',
      'quiz.partner_match_02.v1',
      'quiz.partner_match_03.v1',
      'quiz.partner_convo.v1',
    ],
  },
];

export function findClusterForModule(moduleId: string): ClusterDef | null {
  return CLUSTER_REGISTRY.find(c => c.quizModuleIds.includes(moduleId)) ?? null;
}

export function isClusterComplete(
  cluster: ClusterDef,
  completedModuleIds: Set<string>,
): boolean {
  return cluster.quizModuleIds.every(id => completedModuleIds.has(id));
}

export function clusterProgress(
  cluster: ClusterDef,
  completedModuleIds: Set<string>,
): number {
  if (cluster.quizModuleIds.length === 0) return 0;
  const done = cluster.quizModuleIds.filter(id => completedModuleIds.has(id)).length;
  return done / cluster.quizModuleIds.length;
}
