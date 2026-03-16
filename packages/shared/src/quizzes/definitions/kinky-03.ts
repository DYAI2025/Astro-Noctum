import type { QuizDefinition } from '../schema';

export const kinky03Quiz: QuizDefinition = {
  id: 'kinky-03',
  title: 'Boundary Readiness',
  titleDe: 'Grenzbereitschaft',
  subtitle: 'How far do you dare to show your inner otherness — without shame or judgment?',
  subtitleDe: 'Wie weit traust du dir, dein inneres Anderssein zu zeigen — ohne Scham und Urteil?',
  emoji: '🔥',
  accentColor: '#C73535',
  scoringModel: 'categorical',
  dimensions: ['freedom', 'instinct', 'expression'],
  premium: true,
  seriesId: 'kinky',
  seriesOrder: 3,
  questions: [
    { id: 'q01', text: "Du stehst vor einer Türe, auf der steht: 'Nur für die, die wissen, was sie wollen.' Du weißt es halb. Gehst du rein?", options: [
      { id: 'A', text: 'Nein. Wenn ich nicht sicher bin, gehe ich nicht rein. Halb wissen reicht mir nicht.', scores: { freedom: -0.35, instinct: -0.1, expression: -0.2 }, profileId: 'hueter' },
      { id: 'B', text: 'Ich öffne die Tür und schaue kurz rein — aber trete noch nicht ein.', scores: { freedom: 0.1, instinct: 0.2, expression: 0.05 }, profileId: 'erkunder' },
      { id: 'C', text: 'Rein. Halb wissen ist mehr als genug. Den Rest lerne ich drin.', scores: { freedom: 0.4, instinct: 0.35, expression: 0.35 }, profileId: 'grenzgaenger' },
      { id: 'D', text: 'Ich frage jemanden, der schon drin war — dann entscheide ich.', scores: { freedom: 0.05, instinct: 0.2, expression: 0.1 }, profileId: 'erkunder' },
    ]},
    { id: 'q02', text: 'Du bist mit einer Gruppe unterwegs, die einen anderen Weg einschlägt als du erwartet hast — unbekanntes Terrain, nicht gefährlich, aber neu. Was machst du?', options: [
      { id: 'A', text: 'Ich bleibe auf dem ursprünglich geplanten Weg. Überraschungen muss man nicht suchen.', scores: { freedom: -0.38, instinct: -0.1, expression: -0.2 }, profileId: 'hueter' },
      { id: 'B', text: 'Ich folge der Gruppe — aber behalte meinen eigenen Rhythmus und Abstand.', scores: { freedom: 0.1, instinct: 0.2, expression: 0.05 }, profileId: 'erkunder' },
      { id: 'C', text: 'Ich laufe voraus. Das Neue ist genau das, weswegen ich hier bin.', scores: { freedom: 0.4, instinct: 0.35, expression: 0.3 }, profileId: 'grenzgaenger' },
      { id: 'D', text: 'Ich frage kurz, was uns erwartet — dann entscheide ich spontan.', scores: { freedom: 0.15, instinct: 0.2, expression: 0.1 }, profileId: 'erkunder' },
    ]},
    { id: 'q03', text: 'Du wirst zu einer Veranstaltung eingeladen, die nicht dein übliches Terrain ist — kulturell, sozial, ästhetisch fremd. Du kennst dort niemanden. Gehst du?', options: [
      { id: 'A', text: 'Nein. Wenn ich niemanden kenne, ist das kein Raum für mich.', scores: { freedom: -0.35, instinct: -0.05, expression: -0.25 }, profileId: 'hueter' },
      { id: 'B', text: 'Ich gehe kurz rein, schaue — und wenn es sich nicht gut anfühlt, gehe ich wieder.', scores: { freedom: 0.1, instinct: 0.2, expression: 0.1 }, profileId: 'erkunder' },
      { id: 'C', text: 'Ja — genau das ist der Punkt. Fremdes fühlt sich lebendiger an.', scores: { freedom: 0.4, instinct: 0.3, expression: 0.35 }, profileId: 'grenzgaenger' },
      { id: 'D', text: 'Ich überzeuge eine Vertraute Person, mitzukommen. Dann ja.', scores: { freedom: 0.05, instinct: 0.15, expression: 0.1 }, profileId: 'erkunder' },
    ]},
    { id: 'q04', text: 'Jemand schlägt dir vor, etwas zu tun, das du noch nie getan hast — körperlich, sensorisch, expressiv. Nichts davon ist gefährlich. Es ist nur: unbekannt.', options: [
      { id: 'A', text: 'Ich lehne freundlich ab. Unbekannt heißt für mich: ich brauche mehr Zeit.', scores: { freedom: -0.3, instinct: -0.05, expression: -0.15 }, profileId: 'hueter' },
      { id: 'B', text: "Ich sage: 'Zeig mir erst, wie das geht.' Ich probiere es dann aus.", scores: { freedom: 0.1, instinct: 0.2, expression: 0.1 }, profileId: 'erkunder' },
      { id: 'C', text: 'Ich sage ja, bevor der Satz zu Ende ist. Unbekannt ist mein liebstes Terrain.', scores: { freedom: 0.4, instinct: 0.35, expression: 0.35 }, profileId: 'grenzgaenger' },
      { id: 'D', text: "Ich frage: 'Wie hast du dich danach gefühlt?' Erfahrungsbericht zuerst.", scores: { freedom: 0.05, instinct: 0.2, expression: 0.1 }, profileId: 'erkunder' },
    ]},
    { id: 'q05', text: 'Du reist in eine Stadt, die du nicht kennst. Kein Plan, kein Reiseführer. Ein Abend. Was passiert?', options: [
      { id: 'A', text: 'Ich finde das nächste empfohlene Restaurant und genieße es. Verlässlich ist gut.', scores: { freedom: -0.35, instinct: -0.1, expression: -0.15 }, profileId: 'hueter' },
      { id: 'B', text: 'Ich laufe ohne Ziel los — aber halte mein Telefon als Backup bereit.', scores: { freedom: 0.15, instinct: 0.2, expression: 0.1 }, profileId: 'erkunder' },
      { id: 'C', text: 'Ich gehe dorthin, wo Licht ist und Stimmen — und spreche die erste Person an, die mir sympathisch ist.', scores: { freedom: 0.4, instinct: 0.3, expression: 0.38 }, profileId: 'grenzgaenger' },
      { id: 'D', text: 'Ich folge dem, was sich gerade richtig anfühlt — Schritt für Schritt.', scores: { freedom: 0.2, instinct: 0.25, expression: 0.15 }, profileId: 'erkunder' },
    ]},
    { id: 'q06', text: "Jemand sagt dir: 'Du traust dich mehr, als du denkst.' Was denkst du — haben sie recht?", options: [
      { id: 'A', text: 'Nein. Ich kenne meine Grenzen sehr gut — und ich respektiere sie.', scores: { freedom: -0.3, instinct: -0.05, expression: -0.2 }, profileId: 'hueter' },
      { id: 'B', text: 'Vielleicht. Ich überrasche mich selbst manchmal — aber nicht immer.', scores: { freedom: 0.1, instinct: 0.2, expression: 0.1 }, profileId: 'erkunder' },
      { id: 'C', text: 'Ja — und ich trau mich noch mehr, als sie ahnen.', scores: { freedom: 0.38, instinct: 0.3, expression: 0.35 }, profileId: 'grenzgaenger' },
      { id: 'D', text: 'Ich weiß es nicht. Das finde ich gerade erst heraus.', scores: { freedom: 0.05, instinct: 0.2, expression: 0.05 }, profileId: 'erkunder' },
    ]},
    { id: 'q07', text: 'Du hast die Möglichkeit, an einem Ritual teilzunehmen, das du nicht vollständig verstehst — aber du vertraust dem Raum und den Menschen. Was tust du?', options: [
      { id: 'A', text: 'Ich beobachte von außen. Mitmachen ohne vollständiges Verstehen ist nichts für mich.', scores: { freedom: -0.35, instinct: -0.1, expression: -0.2 }, profileId: 'hueter' },
      { id: 'B', text: 'Ich trete bei — und behalte das Recht, auszusteigen, wenn ich will.', scores: { freedom: 0.1, instinct: 0.2, expression: 0.1 }, profileId: 'erkunder' },
      { id: 'C', text: 'Ich trete bei — vollständig, ohne Vorbehalt. Vertrauen ist Verstehen.', scores: { freedom: 0.4, instinct: 0.35, expression: 0.35 }, profileId: 'grenzgaenger' },
      { id: 'D', text: 'Ich frage nach der Bedeutung — und dann entscheide ich.', scores: { freedom: 0.05, instinct: 0.2, expression: 0.05 }, profileId: 'erkunder' },
    ]},
    { id: 'q08', text: 'Du hast eine Grenze, die du dir selbst gesetzt hast. Nicht weil jemand anderes sie gesetzt hat — sondern weil du dachtest, du brauchst sie. Gilt sie noch?', options: [
      { id: 'A', text: 'Ja. Ich setze Grenzen nicht leichtfertig — sie gelten.', scores: { freedom: -0.35, instinct: -0.05, expression: -0.15 }, profileId: 'hueter' },
      { id: 'B', text: 'Ich überprüfe sie regelmäßig — manche bleiben, manche wandern.', scores: { freedom: 0.1, instinct: 0.2, expression: 0.1 }, profileId: 'erkunder' },
      { id: 'C', text: 'Ich habe sie schon mehrmals verschoben. Das ist keine Schwäche — das ist Wachstum.', scores: { freedom: 0.38, instinct: 0.3, expression: 0.3 }, profileId: 'grenzgaenger' },
      { id: 'D', text: 'Ich weiß nicht mehr, woher sie kam — und das macht mich neugierig.', scores: { freedom: 0.1, instinct: 0.25, expression: 0.05 }, profileId: 'erkunder' },
    ]},
    { id: 'q09', text: 'Stell dir vor, du lebst drei Monate komplett ohne soziale Erwartungen. Keine Rolle, kein Ruf, kein Müssen. Wer bist du dann?', options: [
      { id: 'A', text: 'Ich glaube, ich würde recht ähnlich sein. Ich bin schon ich.', scores: { freedom: -0.2, instinct: 0.1, expression: -0.1 }, profileId: 'hueter' },
      { id: 'B', text: 'Etwas ruhiger, etwas freier — aber im Kern ähnlich.', scores: { freedom: 0.1, instinct: 0.2, expression: 0.1 }, profileId: 'erkunder' },
      { id: 'C', text: 'Jemand, den die meisten noch nicht gesehen haben — und der sich endlich ausstrecken kann.', scores: { freedom: 0.4, instinct: 0.35, expression: 0.38 }, profileId: 'grenzgaenger' },
      { id: 'D', text: 'Das ist die Frage, die mich am meisten beschäftigt.', scores: { freedom: 0.15, instinct: 0.25, expression: 0.15 }, profileId: 'erkunder' },
    ]},
  ],
  profiles: [
    { id: 'hueter', title: 'Der Torwächter', emoji: '🚪', color: '#4A6741', description: 'Du weißt genau, was du hineinlässt — und das ist deine größte Stärke.', priority: 1 },
    { id: 'erkunder', title: 'Der Neugierige Kartograf', emoji: '🗺️', color: '#8B6914', description: 'Du kartierst dein Anderssein — Schritt für Schritt, Linie für Linie.', priority: 2 },
    { id: 'grenzgaenger', title: 'Der Lebendige Horizont', emoji: '🌅', color: '#C73535', description: 'Du gehst nicht bis an Grenzen — du lebst in ihnen.', priority: 3 },
  ],
  resultMapping: {
    markerId: 'quiz.kinky_03.v1',
    profileToTraits: {
      hueter: { 'marker.freedom.independence': 0.1, 'marker.instinct.primal_sense': 0.15, 'marker.creative.expression': 0.08 },
      erkunder: { 'marker.freedom.independence': 0.5, 'marker.instinct.primal_sense': 0.5, 'marker.creative.expression': 0.5 },
      grenzgaenger: { 'marker.freedom.independence': 1.0, 'marker.instinct.primal_sense': 0.82, 'marker.creative.expression': 0.78 },
    },
  },
};
