/**
 * GENERATED QUIZ: "What Lurks Beneath Your Smile?"
 * Topic: Shadow Archetype
 * Pattern: Primary shadow archetype — the disowned self
 * 
 * Generated from quiz-generator-schema.ts v1.0
 */

import type {
  GeneratedQuiz,
  QuizDefinition,
  ResultProfile,
  AffinityMapEntry,
  EventConverterSpec,
  AggregationRules,
} from './quiz-generator-schema';

// ─────────────────────────────────────────────────────────────
// QUIZ DEFINITION (for scoreQuiz() pipeline)
// ─────────────────────────────────────────────────────────────

export const shadowArchetypeQuiz: QuizDefinition = {
  id: 'shadow_archetype_01',
  version: '1.0.0',
  title: {
    'de-DE': 'Was lauert hinter deinem Lächeln?',
    'en-US': 'What Lurks Beneath Your Smile?',
  },
  description: {
    'de-DE': 'Ein Blick auf die Seite von dir, die niemand zu sehen bekommt.',
    'en-US': 'A look at the side of you nobody gets to see.',
  },
  scoringModel: 'multi-dimension',
  dimensions: [
    { key: 'destroyer', label: 'The Destroyer', description: 'Suppressed rage, desire to tear down what feels false' },
    { key: 'orphan',    label: 'The Orphan',    description: 'Deep abandonment wound, fear of being unseen' },
    { key: 'tyrant',    label: 'The Tyrant',    description: 'Need for control masking vulnerability' },
    { key: 'trickster', label: 'The Trickster', description: 'Chaos as protection, deflection through performance' },
  ],
  questions: [
    // ── Q1: Public humiliation ──
    {
      id: 'q1',
      scenario: {
        'de-DE': 'Du bist auf einer Dinnerparty. Jemand erzählt eine Geschichte, über die alle lachen — aber der Witz geht leise auf deine Kosten. Niemand scheint es zu bemerken.',
        'en-US': "You're at a dinner party. Someone tells a story that everyone laughs at — but the joke is quietly at your expense. Nobody seems to notice.",
      },
      prompt: {
        'de-DE': 'Was passiert in dir?',
        'en-US': 'What happens inside you?',
      },
      options: [
        {
          id: 'a',
          text: {
            'de-DE': 'Ein heißer Stich steigt in mir auf. Ich lächle, aber ich formuliere innerlich schon meine Antwort.',
            'en-US': "A hot flash of anger rises in my chest. I smile, but I'm already composing my response.",
          },
          scores: { destroyer: 3, tyrant: 1, orphan: 0, trickster: 0 },
          emotionalTag: 'suppressed_rage',
        },
        {
          id: 'b',
          text: {
            'de-DE': 'Ich fühle mich unsichtbar. Als könnte ich den Tisch verlassen und niemand würde es merken.',
            'en-US': 'I feel invisible. Like I could leave the table and nobody would notice.',
          },
          scores: { orphan: 3, destroyer: 0, tyrant: 0, trickster: 0 },
          emotionalTag: 'abandonment_trigger',
        },
        {
          id: 'c',
          text: {
            'de-DE': 'Ich notiere es innerlich. Diese Person hat sich gerade verraten. Das werde ich mir merken.',
            'en-US': "I mentally note it. This person just revealed themselves. I'll use that later.",
          },
          scores: { tyrant: 3, destroyer: 1, orphan: 0, trickster: 0 },
          emotionalTag: 'strategic_control',
        },
        {
          id: 'd',
          text: {
            'de-DE': 'Ich lache lauter als alle anderen und lenke den Witz auf jemand anderes um.',
            'en-US': 'I laugh louder than everyone else and redirect the joke onto someone else.',
          },
          scores: { trickster: 3, orphan: 1, destroyer: 0, tyrant: 0 },
          emotionalTag: 'deflection_humor',
        },
      ],
    },
    // ── Q2: Betrayed trust ──
    {
      id: 'q2',
      scenario: {
        'de-DE': 'Du erfährst, dass ein enger Freund hinter deinem Rücken über deine privaten Kämpfe gesprochen hat — nicht bösartig, aber sorglos.',
        'en-US': 'You discover that a close friend has been talking about your private struggles behind your back — not maliciously, but carelessly.',
      },
      prompt: {
        'de-DE': 'Was ist dein erster Impuls?',
        'en-US': "What's your first instinct?",
      },
      options: [
        {
          id: 'a',
          text: {
            'de-DE': 'Die Brücke abbrechen. Wenn Vertrauen gebrochen ist, ist es gebrochen.',
            'en-US': "Burn the bridge. If trust is broken, it's broken.",
          },
          scores: { destroyer: 3, orphan: 1, tyrant: 0, trickster: 0 },
          emotionalTag: 'scorched_earth',
        },
        {
          id: 'b',
          text: {
            'de-DE': 'Nichts sagen. Mich langsam zurückziehen. Die werden es irgendwann merken.',
            'en-US': "Say nothing. Pull away slowly. They'll figure it out eventually.",
          },
          scores: { orphan: 3, tyrant: 1, destroyer: 0, trickster: 0 },
          emotionalTag: 'silent_withdrawal',
        },
        {
          id: 'c',
          text: {
            'de-DE': 'Direkt konfrontieren. Die sollen spüren, was sie getan haben.',
            'en-US': 'Confront them directly. Make them feel the weight of what they did.',
          },
          scores: { tyrant: 3, destroyer: 1, orphan: 0, trickster: 0 },
          emotionalTag: 'dominance_assertion',
        },
        {
          id: 'd',
          text: {
            'de-DE': 'Öffentlich drüber lachen, aber ab jetzt weniger teilen. Schwerer lesbar werden.',
            'en-US': 'Laugh it off publicly but start sharing less. Become harder to read.',
          },
          scores: { trickster: 3, tyrant: 1, orphan: 0, destroyer: 0 },
          emotionalTag: 'strategic_masking',
        },
      ],
    },
    // ── Q3: Uninvited solitude ──
    {
      id: 'q3',
      scenario: {
        'de-DE': 'Du bist allein an einem Samstagabend. Es ist nichts ausgefallen — du wurdest einfach nirgendwo eingeladen.',
        'en-US': "You're alone on a Saturday night. No plans fell through — you just weren't invited to anything.",
      },
      prompt: {
        'de-DE': 'Wohin wandern deine Gedanken?',
        'en-US': 'Where does your mind go?',
      },
      options: [
        {
          id: 'a',
          text: {
            'de-DE': 'Ein tiefer Stich. Als wäre etwas grundlegend falsch an mir.',
            'en-US': 'I feel a deep ache. Like something is fundamentally wrong with me.',
          },
          scores: { orphan: 3, destroyer: 0, tyrant: 0, trickster: 0 },
          emotionalTag: 'core_wound_activation',
        },
        {
          id: 'b',
          text: {
            'de-DE': 'Gut. Ich brauche niemanden. Ich bau was. Erschaffe was. Beweis was.',
            'en-US': "Fine. I don't need anyone. I'll build something. Create something. Prove something.",
          },
          scores: { tyrant: 2, destroyer: 2, orphan: 0, trickster: 0 },
          emotionalTag: 'compensatory_drive',
        },
        {
          id: 'c',
          text: {
            'de-DE': 'Ich fange an Leuten zu schreiben. Ich zieh mein eigenes Ding auf. Ich weigere mich, damit zu sitzen.',
            'en-US': "I start texting people. I'll create my own scene. I refuse to sit in this.",
          },
          scores: { trickster: 3, orphan: 1, destroyer: 0, tyrant: 0 },
          emotionalTag: 'avoidance_through_action',
        },
        {
          id: 'd',
          text: {
            'de-DE': 'Ich spüre den Drang, Social Media zu löschen, meine Nummer zu ändern, zu verschwinden.',
            'en-US': 'I feel the urge to delete social media, change my number, disappear.',
          },
          scores: { destroyer: 3, orphan: 2, tyrant: 0, trickster: 0 },
          emotionalTag: 'self_annihilation_impulse',
        },
      ],
    },
    // ── Q4: Intimate confrontation ──
    {
      id: 'q4',
      scenario: {
        'de-DE': 'Dein Partner sagt: „Manchmal habe ich das Gefühl, ich kenne dich gar nicht wirklich."',
        'en-US': "Your partner says: 'Sometimes I feel like I don't really know you.'",
      },
      prompt: {
        'de-DE': 'Was fühlst du?',
        'en-US': 'What do you feel?',
      },
      options: [
        {
          id: 'a',
          text: {
            'de-DE': 'Sie haben recht. Und das macht mir mehr Angst als ihnen.',
            'en-US': "They're right. And that terrifies me more than it terrifies them.",
          },
          scores: { orphan: 3, trickster: 1, destroyer: 0, tyrant: 0 },
          emotionalTag: 'identity_void',
        },
        {
          id: 'b',
          text: {
            'de-DE': 'Gut so. Nicht alles gehört ihnen.',
            'en-US': "Good. Not everything is theirs to know.",
          },
          scores: { tyrant: 3, trickster: 1, orphan: 0, destroyer: 0 },
          emotionalTag: 'boundary_as_weapon',
        },
        {
          id: 'c',
          text: {
            'de-DE': 'Irritation. Ich hab ihnen alles gezeigt. Was wollen sie noch?',
            'en-US': "Irritation. I've shown them everything. What more do they want?",
          },
          scores: { destroyer: 2, tyrant: 2, orphan: 0, trickster: 0 },
          emotionalTag: 'frustrated_vulnerability',
        },
        {
          id: 'd',
          text: {
            'de-DE': 'Ich werde sofort charmanter. Offener. Mehr... performt.',
            'en-US': 'I immediately become more charming. More open. More... performed.',
          },
          scores: { trickster: 3, orphan: 2, destroyer: 0, tyrant: 0 },
          emotionalTag: 'performative_intimacy',
        },
      ],
    },
    // ── Q5: Hollow achievement ──
    {
      id: 'q5',
      scenario: {
        'de-DE': 'Du erreichst etwas Bedeutendes — Beförderung, kreativer Durchbruch, öffentliche Anerkennung. Leute gratulieren dir.',
        'en-US': 'You achieve something significant — a promotion, a creative breakthrough, public recognition. People congratulate you.',
      },
      prompt: {
        'de-DE': 'Was ist das Gefühl unter dem Lächeln?',
        'en-US': "What's the feeling underneath the smile?",
      },
      options: [
        {
          id: 'a',
          text: {
            'de-DE': 'Es ist nicht genug. Es ist nie genug. Da ist immer das Nächste.',
            'en-US': "It's not enough. It's never enough. There's always the next thing.",
          },
          scores: { tyrant: 3, orphan: 1, destroyer: 0, trickster: 0 },
          emotionalTag: 'insatiable_drive',
        },
        {
          id: 'b',
          text: {
            'de-DE': 'Ich fühle mich wie ein Betrüger. Als würden sie jemanden feiern, der nicht wirklich existiert.',
            'en-US': "I feel like a fraud. Like they're celebrating someone who doesn't really exist.",
          },
          scores: { trickster: 2, orphan: 2, destroyer: 0, tyrant: 0 },
          emotionalTag: 'impostor_shadow',
        },
        {
          id: 'c',
          text: {
            'de-DE': 'Ein Blitz von „Das hab ich allen gezeigt, die an mir gezweifelt haben" — dann Schuld, weil ich so denke.',
            'en-US': "A flash of 'I'll show everyone who doubted me' — then guilt for thinking that.",
          },
          scores: { destroyer: 3, tyrant: 1, orphan: 0, trickster: 0 },
          emotionalTag: 'revenge_satisfaction',
        },
        {
          id: 'd',
          text: {
            'de-DE': 'Leere. Ich dachte, das würde etwas füllen. Hat es nicht.',
            'en-US': "Emptiness. I thought this would fill something. It didn't.",
          },
          scores: { orphan: 3, destroyer: 1, tyrant: 0, trickster: 0 },
          emotionalTag: 'achievement_void',
        },
      ],
    },
    // ── Q6: Stranger's vulnerability ──
    {
      id: 'q6',
      scenario: {
        'de-DE': 'Jemand, den du kaum kennst, öffnet sich dir über seinen tiefsten Schmerz. Er weint. Er ist verletzlich.',
        'en-US': "Someone you barely know opens up to you about their deepest pain. They're crying. They're vulnerable.",
      },
      prompt: {
        'de-DE': 'Was passiert wirklich in dir?',
        'en-US': "What's really happening inside you?",
      },
      options: [
        {
          id: 'a',
          text: {
            'de-DE': 'Ich fühle mich mächtig. Die haben mich ausgewählt. Ich halte jetzt etwas Wertvolles.',
            'en-US': 'I feel powerful. They chose me. I hold something precious now.',
          },
          scores: { tyrant: 3, trickster: 1, orphan: 0, destroyer: 0 },
          emotionalTag: 'intimacy_as_power',
        },
        {
          id: 'b',
          text: {
            'de-DE': 'Ich will wegrennen. Ihr Schmerz zieht etwas aus mir raus, das ich nicht fühlen will.',
            'en-US': "I want to run. Their pain is pulling something out of me I don't want to feel.",
          },
          scores: { orphan: 2, destroyer: 2, tyrant: 0, trickster: 0 },
          emotionalTag: 'empathy_avoidance',
        },
        {
          id: 'c',
          text: {
            'de-DE': 'Ich spiegle ihre Emotion perfekt. Ich weiß genau, was ich sagen muss. Es ist fast... automatisch.',
            'en-US': "I mirror their emotion perfectly. I know exactly what to say. It's almost... automatic.",
          },
          scores: { trickster: 3, tyrant: 1, orphan: 0, destroyer: 0 },
          emotionalTag: 'emotional_mimicry',
        },
        {
          id: 'd',
          text: {
            'de-DE': 'Ich bin wütend auf den, der ihnen das angetan hat. Ich will es richten. Die Quelle zerstören.',
            'en-US': 'I feel angry at whoever caused their pain. I want to fix it. Destroy the source.',
          },
          scores: { destroyer: 3, orphan: 1, tyrant: 0, trickster: 0 },
          emotionalTag: 'protective_rage',
        },
      ],
    },
    // ── Q7: Unguarded reflection ──
    {
      id: 'q7',
      scenario: {
        'de-DE': 'Du siehst dein Spiegelbild unerwartet — in einem Schaufenster, in jemandes Sonnenbrille. Für eine ungeschützte Sekunde siehst du dich.',
        'en-US': "You catch your reflection unexpectedly — in a shop window, in someone's sunglasses. For one unguarded second, you see yourself.",
      },
      prompt: {
        'de-DE': 'Was siehst du?',
        'en-US': 'What do you see?',
      },
      options: [
        {
          id: 'a',
          text: {
            'de-DE': 'Jemand Müdes. Jemand, der zu lange performt hat.',
            'en-US': "Someone tired. Someone who's been performing for too long.",
          },
          scores: { trickster: 3, orphan: 2, destroyer: 0, tyrant: 0 },
          emotionalTag: 'mask_fatigue',
        },
        {
          id: 'b',
          text: {
            'de-DE': 'Jemand Gefährliches. Fähiger als jeder ahnt.',
            'en-US': 'Someone dangerous. More capable than anyone realizes.',
          },
          scores: { destroyer: 2, tyrant: 2, orphan: 0, trickster: 0 },
          emotionalTag: 'hidden_power',
        },
        {
          id: 'c',
          text: {
            'de-DE': 'Einen Fremden. Ich erkenne die Person nicht ganz, die zurückschaut.',
            'en-US': "A stranger. I don't fully recognize the person looking back.",
          },
          scores: { orphan: 3, trickster: 1, destroyer: 0, tyrant: 0 },
          emotionalTag: 'self_dissociation',
        },
        {
          id: 'd',
          text: {
            'de-DE': 'Jemand, der die Kontrolle hat. Jemand, der es geschafft hat.',
            'en-US': "Someone who's in control. Someone who's figured it out.",
          },
          scores: { tyrant: 3, destroyer: 0, orphan: 0, trickster: 0 },
          emotionalTag: 'constructed_identity',
        },
      ],
    },
    // ── Q8: The forbidden thought ──
    {
      id: 'q8',
      scenario: {
        'de-DE': 'Spät in der Nacht. Du kannst nicht schlafen. Dein Verstand driftet zu dem einen Gedanken, den du tagsüber nie zulässt.',
        'en-US': "Late at night. You can't sleep. Your mind drifts to the one thought you never let yourself think during the day.",
      },
      prompt: {
        'de-DE': 'Was ist es?',
        'en-US': 'What is it?',
      },
      options: [
        {
          id: 'a',
          text: {
            'de-DE': 'Dass ich vielleicht allein ende. Wirklich allein.',
            'en-US': 'That I might end up alone. Truly alone.',
          },
          scores: { orphan: 3, destroyer: 1, tyrant: 0, trickster: 0 },
          emotionalTag: 'primal_abandonment_fear',
        },
        {
          id: 'b',
          text: {
            'de-DE': 'Dass alles, was ich aufgebaut habe, bedeutungslos sein könnte.',
            'en-US': 'That everything I\'ve built could be meaningless.',
          },
          scores: { destroyer: 3, tyrant: 1, orphan: 0, trickster: 0 },
          emotionalTag: 'existential_destruction',
        },
        {
          id: 'c',
          text: {
            'de-DE': 'Dass wenn Menschen das echte Ich sehen würden, sie gehen würden.',
            'en-US': "That if people saw the real me, they'd leave.",
          },
          scores: { trickster: 3, orphan: 2, destroyer: 0, tyrant: 0 },
          emotionalTag: 'exposure_fear',
        },
        {
          id: 'd',
          text: {
            'de-DE': 'Dass ich nicht aufhören kann. Ich weiß nicht, wie ich einfach... sein kann.',
            'en-US': "That I can't stop. I don't know how to just... be.",
          },
          scores: { tyrant: 3, orphan: 1, destroyer: 0, trickster: 0 },
          emotionalTag: 'compulsive_control',
        },
      ],
    },
  ],
  thresholds: [
    { dimensionKey: 'destroyer', min: 12, profileId: 'destroyer' },
    { dimensionKey: 'orphan',    min: 12, profileId: 'orphan'    },
    { dimensionKey: 'tyrant',    min: 12, profileId: 'tyrant'    },
    { dimensionKey: 'trickster', min: 12, profileId: 'trickster' },
  ],
  meta: {
    icon: '🔥',
    estimatedMinutes: 4,
    patternCategory: 'shadow',
    tone: 'mysterious',
    premium: false,
  },
};

// ─────────────────────────────────────────────────────────────
// RESULT PROFILES (QuissMe-aligned narratives)
// ─────────────────────────────────────────────────────────────

export const shadowResultProfiles: ResultProfile[] = [
  {
    id: 'destroyer',
    name: {
      'de-DE': 'Die Glut Darunter',
      'en-US': 'The Ember Beneath',
    },
    subtitle: {
      'de-DE': 'Du trägst ein Feuer, das wärmen — oder verzehren kann.',
      'en-US': 'You carry a fire that could warm — or consume.',
    },
    description: {
      'de-DE': 'Unter deiner Fassung lebt eine Kraft, die alles Falsche niederreißen will. Du spürst Unechtheit sofort und dein Instinkt ist, sie zu verbrennen. Das ist keine Grausamkeit — es ist ein tiefes Bedürfnis nach Wahrheit, das keinen sicheren Ort zum Landen hat.',
      'en-US': "Beneath your composure lives a force that wants to tear down everything false. You sense inauthenticity instantly and your instinct is to burn it. This isn't cruelty — it's a deep need for truth that has nowhere safe to land.",
    },
    shadowInsight: {
      'de-DE': 'Deine Wut ist nicht das Problem. Es ist, dass dir nie erlaubt wurde, sie ohne Konsequenzen zu fühlen.',
      'en-US': "Your rage isn't the problem. It's that you've never been given permission to feel it without consequence.",
    },
    fusionMapping: {
      element: 'Fire',
      zodiacAffinity: ['Aries', 'Scorpio', 'Sagittarius'],
      ringPosition: 0,
      signaturDimension: 'assertion',
      masterSignalDimension: 'passion',
    },
    visual: {
      color: '#C41E3A',
      symbol: 'ember',
      coustoHz: 144.72,
    },
    zoneLogic: {
      flowCondition: 'natal assertion weight >= 0.6 AND quiz destroyer is dominant',
      sparkCondition: 'natal assertion weight 0.3–0.6, quiz destroyer >= 0.5',
      talkCondition: 'natal assertion weight < 0.3, quiz destroyer is dominant',
    },
  },
  {
    id: 'orphan',
    name: {
      'de-DE': 'Der Hohle Mond',
      'en-US': 'The Hollow Moon',
    },
    subtitle: {
      'de-DE': 'Du trägst eine Leere, die genau die Form von Zugehörigkeit hat.',
      'en-US': 'You carry an emptiness shaped exactly like belonging.',
    },
    description: {
      'de-DE': 'Es gibt einen stillen Raum in dir, den keine Leistung, keine Beziehung, kein Maß an Liebe je ganz füllen konnte. Du hast früh gelernt, dass Anwesenheit nicht dasselbe ist wie gesehen werden.',
      'en-US': "There is a quiet space inside you that no achievement, no relationship, no amount of love has ever quite filled. You learned early that presence isn't the same as being seen.",
    },
    shadowInsight: {
      'de-DE': 'Du fürchtest nicht das Alleinsein. Du fürchtest die Bestätigung dessen, was du immer vermutet hast — dass du nie wirklich dazugehört hast.',
      'en-US': "You don't fear being alone. You fear confirming what you've always suspected — that you were never truly included.",
    },
    fusionMapping: {
      element: 'Water',
      zodiacAffinity: ['Cancer', 'Pisces', 'Libra'],
      ringPosition: 3,
      signaturDimension: 'empathy',
      masterSignalDimension: 'connection',
    },
    visual: {
      color: '#1B3A5C',
      symbol: 'crescent',
      coustoHz: 210.42,
    },
    zoneLogic: {
      flowCondition: 'natal empathy weight >= 0.6 AND quiz orphan is dominant',
      sparkCondition: 'natal empathy weight 0.3–0.6, quiz orphan >= 0.5',
      talkCondition: 'natal empathy weight < 0.3, quiz orphan is dominant',
    },
  },
  {
    id: 'tyrant',
    name: {
      'de-DE': 'Die Eiserne Krone',
      'en-US': 'The Iron Crown',
    },
    subtitle: {
      'de-DE': 'Du hast deinen Thron aus den Dingen gebaut, die du nicht fühlen konntest.',
      'en-US': "You built your throne from the things you couldn't let yourself feel.",
    },
    description: {
      'de-DE': 'Kontrolle ist deine Muttersprache. Nicht weil du kalt bist — sondern weil Verletzlichkeit dich einmal etwas gekostet hat, das du dir nicht leisten konntest zu verlieren. Du hast Disziplin zu Rüstung und Ehrgeiz zu einer Mauer gemacht.',
      'en-US': "Control is your native language. Not because you're cold — but because vulnerability once cost you something you couldn't afford to lose. You've turned discipline into armor and ambition into a wall.",
    },
    shadowInsight: {
      'de-DE': 'Jedes System, das du baust, ist eine Festung gegen das Einzige, das du nicht kontrollieren kannst: gebraucht und dann verlassen zu werden.',
      'en-US': "Every system you build is a fortress against the one thing you can't control: being needed and then abandoned.",
    },
    fusionMapping: {
      element: 'Earth',
      zodiacAffinity: ['Leo', 'Capricorn', 'Virgo'],
      ringPosition: 9,
      signaturDimension: 'discipline',
      masterSignalDimension: 'stability',
    },
    visual: {
      color: '#8B7355',
      symbol: 'crown',
      coustoHz: 147.85,
    },
    zoneLogic: {
      flowCondition: 'natal discipline weight >= 0.6 AND quiz tyrant is dominant',
      sparkCondition: 'natal discipline weight 0.3–0.6, quiz tyrant >= 0.5',
      talkCondition: 'natal discipline weight < 0.3, quiz tyrant is dominant',
    },
  },
  {
    id: 'trickster',
    name: {
      'de-DE': 'Der Spiegel, der Lacht',
      'en-US': 'The Mirror That Laughs',
    },
    subtitle: {
      'de-DE': 'Du zeigst allen ein Gesicht — aber nie zweimal dasselbe.',
      'en-US': 'You show everyone a face — but never the same one twice.',
    },
    description: {
      'de-DE': 'Du beherrschst die Kunst, genau das zu sein, was der Moment verlangt. Charmant, witzig, entwaffnend — deine soziale Intelligenz ist außergewöhnlich. Aber unter der Performance ist eine Frage, der du ausweichst: Wer bist du, wenn niemand zuschaut?',
      'en-US': "You've mastered the art of being exactly what the moment requires. Charming, funny, disarming — your social intelligence is extraordinary. But beneath the performance is a question you've been avoiding: who are you when nobody is watching?",
    },
    shadowInsight: {
      'de-DE': 'Deine Masken sind keine Lügen. Sie sind Überleben. Der Schatten ist nicht, dass du performst — sondern dass du vergessen hast, dass jemand hinter dem Vorhang steht.',
      'en-US': "Your masks aren't lies. They're survival. The shadow isn't that you perform — it's that you've forgotten there's someone behind the curtain.",
    },
    fusionMapping: {
      element: 'Metal',
      zodiacAffinity: ['Gemini', 'Aquarius', 'Libra'],
      ringPosition: 2,
      signaturDimension: 'creativity',
      masterSignalDimension: 'autonomy',
    },
    visual: {
      color: '#9CA3AF',
      symbol: 'mirror',
      coustoHz: 126.22,
    },
    zoneLogic: {
      flowCondition: 'natal creativity weight >= 0.6 AND quiz trickster is dominant',
      sparkCondition: 'natal creativity weight 0.3–0.6, quiz trickster >= 0.5',
      talkCondition: 'natal creativity weight < 0.3, quiz trickster is dominant',
    },
  },
];

// ─────────────────────────────────────────────────────────────
// AFFINITY MAP ENTRIES (merge into affinity-map.ts)
// ─────────────────────────────────────────────────────────────
// Sector order: [Ari, Tau, Gem, Can, Leo, Vir, Lib, Sco, Sag, Cap, Aqu, Pis]

export const shadowAffinityMapEntries: AffinityMapEntry[] = [
  // ── Destroyer keywords ──
  { keyword: 'suppressed_rage',
    sectorWeights: [.4, 0, 0, 0, 0, 0, 0, .4, .1, 0, 0, .1],
    domain: 'shadow',
    rationale: 'Mars-ruled anger: Aries (raw fire) + Scorpio (controlled burn)' },
  { keyword: 'scorched_earth',
    sectorWeights: [.5, 0, 0, 0, 0, 0, 0, .3, .2, 0, 0, 0],
    domain: 'shadow',
    rationale: 'Aries-dominant destruction, Scorpio intensity, Sagittarius fire' },
  { keyword: 'revenge_satisfaction',
    sectorWeights: [.2, 0, 0, 0, .2, 0, 0, .5, 0, .1, 0, 0],
    domain: 'shadow',
    rationale: 'Scorpio vengeance, Leo wounded pride, Aries aggression' },
  { keyword: 'self_annihilation_impulse',
    sectorWeights: [.2, 0, 0, 0, 0, 0, 0, .3, 0, 0, 0, .5],
    domain: 'shadow',
    rationale: 'Pisces dissolution + Scorpio death/rebirth + Aries impulsivity' },
  { keyword: 'protective_rage',
    sectorWeights: [.4, 0, 0, .2, 0, 0, 0, .3, 0, 0, 0, .1],
    domain: 'shadow',
    rationale: 'Mars protection, Cancer nurturing instinct, Scorpio intensity' },
  { keyword: 'existential_destruction',
    sectorWeights: [.1, 0, 0, 0, 0, 0, 0, .4, .2, 0, 0, .3],
    domain: 'shadow',
    rationale: 'Scorpio existential depth, Pisces void, Sagittarius meaning-seeking' },

  // ── Orphan keywords ──
  { keyword: 'abandonment_trigger',
    sectorWeights: [0, 0, 0, .5, 0, 0, .2, 0, 0, 0, 0, .3],
    domain: 'shadow',
    rationale: 'Cancer abandonment wound, Pisces dissolution fear, Libra belonging' },
  { keyword: 'core_wound_activation',
    sectorWeights: [0, 0, 0, .4, 0, 0, 0, .2, 0, 0, 0, .4],
    domain: 'shadow',
    rationale: 'Cancer/Pisces deep emotional core, Scorpio intensity' },
  { keyword: 'silent_withdrawal',
    sectorWeights: [0, 0, 0, .3, 0, .1, 0, .2, 0, .2, 0, .2],
    domain: 'shadow',
    rationale: 'Cancer retreat, Scorpio brooding, Capricorn stoicism, Pisces fade' },
  { keyword: 'identity_void',
    sectorWeights: [0, 0, 0, .2, 0, 0, 0, 0, 0, 0, 0, .8],
    domain: 'shadow',
    rationale: 'Pisces dissolution of self, Cancer identity through belonging' },
  { keyword: 'achievement_void',
    sectorWeights: [0, 0, 0, .3, 0, 0, 0, 0, 0, .3, 0, .4],
    domain: 'shadow',
    rationale: 'Capricorn achievement, Cancer emotional need, Pisces emptiness' },
  { keyword: 'primal_abandonment_fear',
    sectorWeights: [0, 0, 0, .6, 0, 0, .1, 0, 0, 0, 0, .3],
    domain: 'shadow',
    rationale: 'Cancer primal bond fear, Pisces universal aloneness' },

  // ── Tyrant keywords ──
  { keyword: 'strategic_control',
    sectorWeights: [0, 0, 0, 0, .2, .2, 0, .3, 0, .3, 0, 0],
    domain: 'shadow',
    rationale: 'Capricorn structure, Scorpio strategic depth, Leo authority' },
  { keyword: 'dominance_assertion',
    sectorWeights: [.2, 0, 0, 0, .4, 0, 0, .1, 0, .3, 0, 0],
    domain: 'shadow',
    rationale: 'Leo dominance, Capricorn authority, Aries assertion' },
  { keyword: 'boundary_as_weapon',
    sectorWeights: [0, 0, 0, 0, .1, .1, 0, .4, 0, .4, 0, 0],
    domain: 'shadow',
    rationale: 'Scorpio/Capricorn walls, strategic boundary use' },
  { keyword: 'insatiable_drive',
    sectorWeights: [.1, 0, 0, 0, .3, 0, 0, .1, .2, .3, 0, 0],
    domain: 'shadow',
    rationale: 'Capricorn ambition, Leo recognition, Sagittarius expansion' },
  { keyword: 'intimacy_as_power',
    sectorWeights: [0, 0, 0, 0, .2, 0, 0, .5, 0, .3, 0, 0],
    domain: 'shadow',
    rationale: 'Scorpio intimacy/power fusion, Capricorn control, Leo magnetism' },
  { keyword: 'constructed_identity',
    sectorWeights: [0, 0, 0, 0, .3, .2, 0, 0, 0, .4, .1, 0],
    domain: 'shadow',
    rationale: 'Capricorn constructed self, Leo persona, Virgo crafted image' },
  { keyword: 'compulsive_control',
    sectorWeights: [0, 0, 0, 0, 0, .3, 0, .2, 0, .5, 0, 0],
    domain: 'shadow',
    rationale: 'Capricorn compulsion, Virgo perfectionism, Scorpio intensity' },
  { keyword: 'compensatory_drive',
    sectorWeights: [.2, 0, 0, 0, .2, 0, 0, 0, .2, .4, 0, 0],
    domain: 'shadow',
    rationale: 'Capricorn proving, Aries/Leo assertion, Sagittarius expansion' },

  // ── Trickster keywords ──
  { keyword: 'deflection_humor',
    sectorWeights: [0, 0, .4, 0, .2, 0, .2, 0, .2, 0, 0, 0],
    domain: 'shadow',
    rationale: 'Gemini wit, Leo performance, Libra social grace, Sagittarius humor' },
  { keyword: 'strategic_masking',
    sectorWeights: [0, 0, .3, 0, 0, .2, .2, .2, 0, 0, .1, 0],
    domain: 'shadow',
    rationale: 'Gemini duality, Virgo calculation, Libra facade, Scorpio concealment' },
  { keyword: 'avoidance_through_action',
    sectorWeights: [.1, 0, .3, 0, 0, 0, .1, 0, .3, 0, .2, 0],
    domain: 'shadow',
    rationale: 'Gemini/Sagittarius movement, Aquarius detachment, Aries impulse' },
  { keyword: 'performative_intimacy',
    sectorWeights: [0, 0, .3, 0, .3, 0, .3, 0, 0, 0, .1, 0],
    domain: 'shadow',
    rationale: 'Gemini/Leo/Libra performance triangle, Aquarius detachment' },
  { keyword: 'impostor_shadow',
    sectorWeights: [0, 0, .3, 0, 0, .2, .1, 0, 0, 0, .1, .3],
    domain: 'shadow',
    rationale: 'Gemini duality, Pisces identity diffusion, Virgo self-criticism' },
  { keyword: 'emotional_mimicry',
    sectorWeights: [0, 0, .3, .1, 0, 0, .3, 0, 0, 0, 0, .3],
    domain: 'shadow',
    rationale: 'Gemini mirroring, Libra attunement, Pisces absorption' },
  { keyword: 'mask_fatigue',
    sectorWeights: [0, 0, .3, .1, 0, .1, .2, 0, 0, 0, .1, .2],
    domain: 'shadow',
    rationale: 'Gemini exhausted duality, Pisces authenticity yearning, Libra drain' },
  { keyword: 'exposure_fear',
    sectorWeights: [0, 0, .2, .1, 0, .2, 0, .2, 0, 0, 0, .3],
    domain: 'shadow',
    rationale: 'Pisces vulnerability, Scorpio secrecy, Gemini/Virgo self-awareness' },
  { keyword: 'self_dissociation',
    sectorWeights: [0, 0, .2, 0, 0, 0, 0, 0, 0, 0, .3, .5],
    domain: 'shadow',
    rationale: 'Pisces dissolution, Aquarius detachment, Gemini split-self' },

  // ── Cross-dimension keywords ──
  { keyword: 'frustrated_vulnerability',
    sectorWeights: [.3, 0, 0, .1, .2, 0, 0, .2, 0, .2, 0, 0],
    domain: 'shadow',
    rationale: 'Aries frustration, Leo wounded pride, Scorpio/Capricorn guard' },
  { keyword: 'empathy_avoidance',
    sectorWeights: [.1, 0, 0, .2, 0, .1, 0, .2, 0, .3, .1, 0],
    domain: 'shadow',
    rationale: 'Capricorn emotional armor, Cancer suppressed feeling, Scorpio wall' },
  { keyword: 'hidden_power',
    sectorWeights: [.2, 0, 0, 0, .2, 0, 0, .4, 0, .2, 0, 0],
    domain: 'shadow',
    rationale: 'Scorpio hidden depth, Aries/Leo power, Capricorn quiet authority' },
];

// ─────────────────────────────────────────────────────────────
// EVENT CONVERTER SPEC
// ─────────────────────────────────────────────────────────────

export const shadowEventConverter: EventConverterSpec = {
  functionName: 'shadowArchetypeToEvent',
  moduleId: 'quiz.shadow_archetype.v1',
  dimensionToMarkers: [
    {
      dimensionKey: 'destroyer',
      markers: [
        { id: 'marker.shadow.suppressed_rage',  weightFormula: 'score / 24' },
        { id: 'marker.shadow.scorched_earth',    weightFormula: 'score / 24' },
        { id: 'marker.shadow.protective_rage',   weightFormula: 'score / 24' },
        { id: 'marker.instinct.primal_sense',    weightFormula: '(score / 24) * 0.5' },
      ],
    },
    {
      dimensionKey: 'orphan',
      markers: [
        { id: 'marker.shadow.abandonment_trigger',    weightFormula: 'score / 24' },
        { id: 'marker.shadow.core_wound_activation',  weightFormula: 'score / 24' },
        { id: 'marker.shadow.silent_withdrawal',       weightFormula: 'score / 24' },
        { id: 'marker.love.emotional_need',            weightFormula: '(score / 24) * 0.5' },
      ],
    },
    {
      dimensionKey: 'tyrant',
      markers: [
        { id: 'marker.shadow.strategic_control',    weightFormula: 'score / 24' },
        { id: 'marker.shadow.dominance_assertion',  weightFormula: 'score / 24' },
        { id: 'marker.shadow.compulsive_control',   weightFormula: 'score / 24' },
        { id: 'marker.leadership.authority',         weightFormula: '(score / 24) * 0.5' },
      ],
    },
    {
      dimensionKey: 'trickster',
      markers: [
        { id: 'marker.shadow.deflection_humor',        weightFormula: 'score / 24' },
        { id: 'marker.shadow.strategic_masking',        weightFormula: 'score / 24' },
        { id: 'marker.shadow.performative_intimacy',    weightFormula: 'score / 24' },
        { id: 'marker.social.adaptability',              weightFormula: '(score / 24) * 0.5' },
      ],
    },
  ],
  archetypeTags: [
    { profileId: 'destroyer', tagId: 'warrior',   weight: 0.7 },
    { profileId: 'orphan',    tagId: 'healer',    weight: 0.5 },
    { profileId: 'tyrant',    tagId: 'guardian',   weight: 0.6 },
    { profileId: 'trickster', tagId: 'trickster',  weight: 0.8 },
  ],
};

// ─────────────────────────────────────────────────────────────
// AGGREGATION RULES
// ─────────────────────────────────────────────────────────────

export const shadowAggregation: AggregationRules = {
  contributesTo: ['shadow_profile', 'emotional_core', 'relationship_pattern'],
  weight: 0.15,
  decay: 'slow',
  recurrence: 'seasonal',
  maxNatalDeviation: 0.5,
};

// ─────────────────────────────────────────────────────────────
// ASSEMBLED OUTPUT
// ─────────────────────────────────────────────────────────────

export const shadowArchetypeGeneratedQuiz: GeneratedQuiz = {
  definition: shadowArchetypeQuiz,
  resultProfiles: shadowResultProfiles,
  affinityMapEntries: shadowAffinityMapEntries,
  eventConverter: shadowEventConverter,
  aggregation: shadowAggregation,
};
